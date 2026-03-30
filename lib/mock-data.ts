import { AnalysisFrame, AnalysisResult } from "./types";

/**
 * 실제 백엔드 연결 전 사용하는 Mock 분석 데이터.
 * 10ms 단위 프레임 (30초 기준 3000 frames).
 */
export function generateMockAnalysis(duration = 30): AnalysisResult {
  const frames: AnalysisFrame[] = [];
  const step = 0.01; // 10ms

  for (let t = 0; t <= duration; t = Math.round((t + step) * 100) / 100) {
    // 온도: 40~75°C, 완만하게 올라가다 내려오는 패턴
    const baseTemp = 55 + 15 * Math.sin((t / duration) * Math.PI);
    const temperature = parseFloat((baseTemp + (Math.random() - 0.5) * 3).toFixed(2));

    // 변위: -8~8mm, 오디오 진폭처럼 진동
    const baseExc = 5 * Math.sin((t * 2 * Math.PI) / 0.8) * (0.7 + 0.3 * Math.sin(t * 0.4));
    const excursion = parseFloat((baseExc + (Math.random() - 0.5) * 0.5).toFixed(3));

    frames.push({ time: t, temperature, excursion });
  }

  return {
    filename: "demo_audio.wav",
    duration,
    sampleRate: 44100,
    frames,
  };
}
