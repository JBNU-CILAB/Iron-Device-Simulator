// koffi는 런타임 require — 빌드 시 QEMU 환경에서 .node 로드 방지
// eslint-disable-next-line @typescript-eslint/no-require-imports
const koffi = require("koffi");
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execSync } from "child_process";
import type { AudioEngine, AudioEngineInput } from "./audio-engine";
import type { AnalysisFrame, AnalysisResult } from "./types";

// ─── 처리 상수 (ff_prot.c 기준) ─────────────────────────────────────────────
// 16-bit PCM, 스테레오, 채널당 256 샘플 → 1,024 bytes/frame
const SAMPLE_RATE      = 44100;
const CHANNELS         = 2;
const BYTES_PER_SAMPLE = 2;                                    // 16-bit signed
const SAMPLES_PER_CH   = 256;
const FRAME_BYTES      = SAMPLES_PER_CH * CHANNELS * BYTES_PER_SAMPLE; // 1024
const AMB_TEMP         = 25;
// ────────────────────────────────────────────────────────────────────────────

export class NativeEngine implements AudioEngine {
  private readonly _init:       () => number;
  private readonly _setParam:   () => number;
  private readonly _startExec:  (
    data: Buffer, samplePerCh: number, bytesPerSample: number,
    channels: number, ambTemp: number, spkTemp: Buffer, spkExc: Buffer
  ) => number;
  private readonly _stopExec:   () => number;

  constructor(soPath: string) {
    if (!fs.existsSync(soPath)) {
      throw new Error(`[NativeEngine] .so 파일을 찾을 수 없음: ${soPath}`);
    }

    const lib = koffi.load(soPath);

    // libirontune.so 실제 export 심볼: ff_prot_init / ff_prot_set_param /
    //   ff_prot_start_exec / ff_prot_stop_exec
    // (audio_ff_prot_* 는 ff_prot.c 래퍼 계층이며 .so에 포함되지 않음)
    this._init     = lib.func("ff_prot_init",      "int", []);
    this._setParam = lib.func("ff_prot_set_param", "int", []);
    this._stopExec = lib.func("ff_prot_stop_exec", "int", []);

    // ff_prot_start_exec(void *data, uint32 samplePerCh, uint32 bytesPerSample,
    //                    uint32 channels, int32 ambTemp,
    //                    int32 *spkTemp[2], int32 *spkExc[2])
    this._startExec = lib.func(
      "ff_prot_start_exec",
      "int",
      ["void *", "uint32", "uint32", "uint32", "int32", "void *", "void *"]
    );
  }

  async analyze({ buffer, filename, duration }: AudioEngineInput): Promise<AnalysisResult> {
    const stamp    = Date.now();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const tmpInput = path.join(os.tmpdir(), `iron_in_${stamp}_${safeName}`);
    const tmpPcm   = path.join(os.tmpdir(), `iron_pcm_${stamp}.raw`);

    try {
      fs.writeFileSync(tmpInput, buffer);

      // ffmpeg: 입력 → 16-bit signed LE PCM, stereo, 44100 Hz
      execSync(
        `ffmpeg -y -i "${tmpInput}" -f s16le -ac ${CHANNELS} -ar ${SAMPLE_RATE} "${tmpPcm}"`,
        { stdio: "pipe" }
      );

      const pcm    = fs.readFileSync(tmpPcm);
      const frames = this._processFrames(pcm);

      return { filename, duration, sampleRate: SAMPLE_RATE, frames };
    } finally {
      if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
      if (fs.existsSync(tmpPcm))   fs.unlinkSync(tmpPcm);
    }
  }

  private _processFrames(pcm: Buffer): AnalysisFrame[] {
    // 라이브러리 초기화 (ff_prot.c의 audio_ff_prot_init 흐름과 동일)
    const initRet = this._init();
    if (initRet !== 0) throw new Error(`[NativeEngine] ff_prot_init 실패 (ret=${initRet})`);

    const paramRet = this._setParam();
    if (paramRet !== 0) throw new Error(`[NativeEngine] ff_prot_set_param 실패 (ret=${paramRet})`);

    const frames: AnalysisFrame[] = [];
    const totalFrames   = Math.floor(pcm.length / FRAME_BYTES);
    const frameDuration = SAMPLES_PER_CH / SAMPLE_RATE; // ≈ 0.0058 초

    try {
      for (let i = 0; i < totalFrames; i++) {
        const interleaved = pcm.subarray(i * FRAME_BYTES, (i + 1) * FRAME_BYTES);

        // ff_prot.c 와 동일한 de-interleave:
        //   interleaved: L R L R L R ... (1024 bytes)
        //   → planar:    L L L ... R R R ... (512 bytes L + 512 bytes R)
        const planar = deinterleave(interleaved, SAMPLES_PER_CH, CHANNELS, BYTES_PER_SAMPLE);

        const spkTempBuf = Buffer.alloc(8); // int32_t[2]
        const spkExcBuf  = Buffer.alloc(8); // int32_t[2]

        this._startExec(
          planar, SAMPLES_PER_CH, BYTES_PER_SAMPLE, CHANNELS,
          AMB_TEMP, spkTempBuf, spkExcBuf
        );

        frames.push({
          time:        parseFloat((i * frameDuration).toFixed(4)),
          temperature: spkTempBuf.readInt32LE(0), // ch0 온도
          excursion:   spkExcBuf.readInt32LE(0),  // ch0 익스커션
        });
      }
    } finally {
      this._stopExec();
    }

    return frames;
  }
}

/**
 * PCM 버퍼를 인터리브(L R L R) → 플래너(LL...RR...) 포맷으로 변환
 * ff_prot.c의 채널 분리 로직을 TypeScript로 구현
 */
function deinterleave(
  src: Buffer,
  samplesPerCh: number,
  channels: number,
  bytesPerSample: number
): Buffer {
  const dst            = Buffer.alloc(src.length);
  const channelOffset  = samplesPerCh * bytesPerSample; // 512
  const sampleStride   = channels * bytesPerSample;     // 4 (한 인터리브 단계)

  for (let ch = 0; ch < channels; ch++) {
    for (let i = 0; i < samplesPerCh; i++) {
      const srcOff = i * sampleStride + ch * bytesPerSample;
      const dstOff = ch * channelOffset + i * bytesPerSample;
      src.copy(dst, dstOff, srcOff, srcOff + bytesPerSample);
    }
  }
  return dst;
}
