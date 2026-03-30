import { NextRequest, NextResponse } from "next/server";
import { getEngine } from "@/lib/audio-engine";

/**
 * POST /api/analyze
 *
 * FormData 필드:
 *   audio    : File   — 오디오 파일
 *   duration : string — 클라이언트가 측정한 실제 재생 길이(초)
 *
 * 엔진 전환:
 *   USE_MOCK=true  (기본) → MockEngine (lib/audio-engine.ts)
 *   USE_MOCK=false        → NativeEngine (lib/native-engine.ts) + SO_PATH 필요
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file         = formData.get("audio")    as File   | null;
    const durationStr  = formData.get("duration") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const buffer   = Buffer.from(await file.arrayBuffer());
    const duration = durationStr ? parseFloat(durationStr) : 30;

    const result = await getEngine().analyze({
      buffer,
      filename: file.name,
      duration,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
