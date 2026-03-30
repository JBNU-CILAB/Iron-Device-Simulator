/**
 * NativeEngine — libaudio_analysis.so 연동 스켈레톤
 *
 * ──────────────────────────────────────────────
 * [.so 도착 후 교체 절차]
 *
 *  1. npm install koffi
 *
 *  2. .so 헤더(.h) 또는 API 문서를 확인하여
 *     아래 "TODO: 시그니처" 주석을 실제 함수 선언으로 교체
 *
 *  3. audio-engine.ts의 getEngine() 에서
 *     주석 처리된 NativeEngine 블록 주석 해제
 *
 *  4. 환경변수 USE_MOCK=false, SO_PATH=<경로> 설정 후 서버 재시작
 * ──────────────────────────────────────────────
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { AudioEngine, AudioEngineInput } from "./audio-engine";
import type { AnalysisResult } from "./types";

// TODO: npm install koffi 후 주석 해제
// import koffi from "koffi";

export class NativeEngine implements AudioEngine {
  // private lib: ReturnType<typeof koffi.load>;

  // soPath는 koffi 연동 시 this.lib = koffi.load(soPath) 에서 사용됩니다.
  // 시그니처 확인 후 private readonly 로 변경하고 주석을 해제하세요.
  constructor(soPath: string) {
    if (!fs.existsSync(soPath)) {
      throw new Error(`[NativeEngine] .so 파일을 찾을 수 없음: ${soPath}`);
    }

    // TODO: koffi로 .so 로드 및 함수 바인딩
    // this.lib = koffi.load(soPath);
    //
    // 예시 (시그니처 확인 후 수정):
    // this._analyzeAudio = this.lib.func(
    //   "analyze_audio",
    //   "int",                        // 반환 타입
    //   ["str", "float *", "float *"] // 인자: filepath, temp_out[], excursion_out[]
    // );

    void soPath; // TODO: 위 koffi 주석 해제 시 이 줄 삭제
  }

  async analyze({ buffer, filename, duration }: AudioEngineInput): Promise<AnalysisResult> {
    // .so는 파일 경로를 받으므로 임시 파일로 저장 후 호출
    const tmpPath = path.join(
      os.tmpdir(),
      `iron_audio_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    );

    try {
      fs.writeFileSync(tmpPath, buffer);

      // TODO: 실제 .so 함수 호출로 교체
      // const frames = this._callNative(tmpPath, duration);
      // return { filename, duration, sampleRate: 44100, frames };

      void duration; // lint 억제 (실제 구현 시 제거)
      throw new Error(
        "[NativeEngine] analyze() 미구현 — .so 시그니처 확인 후 TODO 채워주세요"
      );
    } finally {
      // 임시 파일 반드시 삭제
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    }
  }

  // TODO: .so raw 결과 → AnalysisFrame[] 변환 로직
  // private _callNative(filePath: string, duration: number): AnalysisFrame[] {
  //   const frameCount = Math.floor(duration / 0.1); // 100ms 단위
  //   const tempOut   = new Float32Array(frameCount);
  //   const excurOut  = new Float32Array(frameCount);
  //
  //   this._analyzeAudio(filePath, tempOut, excurOut);
  //
  //   return Array.from({ length: frameCount }, (_, i) => ({
  //     time:        parseFloat((i * 0.1).toFixed(2)),
  //     temperature: tempOut[i],
  //     excursion:   excurOut[i],
  //   }));
  // }
}
