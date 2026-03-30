import { AnalysisResult } from "./types";
import { generateMockAnalysis } from "./mock-data";

// ─────────────────────────────────────────────
// 공통 인터페이스
// ─────────────────────────────────────────────

export interface AudioEngineInput {
  buffer: Buffer;
  filename: string;
  /** 클라이언트에서 측정한 실제 오디오 길이(초) */
  duration: number;
}

export interface AudioEngine {
  analyze(input: AudioEngineInput): Promise<AnalysisResult>;
}

// ─────────────────────────────────────────────
// MockEngine — .so 도착 전 사용
// ─────────────────────────────────────────────

class MockEngine implements AudioEngine {
  async analyze({ filename, duration }: AudioEngineInput): Promise<AnalysisResult> {
    // 실제 분석 지연 시뮬레이션 (500ms ~ 2s)
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 1500));
    const result = generateMockAnalysis(duration);
    result.filename = filename;
    return result;
  }
}

// ─────────────────────────────────────────────
// 팩토리 — 환경변수 USE_MOCK 으로 엔진 전환
// ─────────────────────────────────────────────

let _engine: AudioEngine | null = null;

export function getEngine(): AudioEngine {
  if (_engine) return _engine;

  const useMock = process.env.USE_MOCK !== "false";

  if (!useMock) {
    // TODO: .so 시그니처 확인 후 NativeEngine 주석 해제
    // const soPath = process.env.SO_PATH ?? "/app/native/libaudio_analysis.so";
    // const { NativeEngine } = require("./native-engine");
    // _engine = new NativeEngine(soPath);
    throw new Error(
      "[AudioEngine] USE_MOCK=false 설정 시 native-engine.ts 구현 필요. " +
      "lib/native-engine.ts의 TODO 주석을 채워주세요."
    );
  }

  _engine = new MockEngine();
  return _engine;
}
