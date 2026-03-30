"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Square } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { AppStatus } from "@/lib/types";

interface Props {
  audioFile: File | null;
  status: AppStatus;
  onTimeUpdate: (currentTime: number) => void;
  onStatusChange: (status: AppStatus) => void;
}

export default function WaveformPlayer({
  audioFile,
  status,
  onTimeUpdate,
  onStatusChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !audioFile) return;

    let ws: import("wavesurfer.js").default;

    (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      // Destroy previous instance
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }

      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: "#CDD1DA",
        progressColor: "#0057B8",
        cursorColor: "#1A73E8",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 72,
        normalize: true,
        interact: true,
      });

      ws.on("ready", (dur) => {
        setDuration(dur);
        setIsReady(true);
        onStatusChange("ready");
      });

      ws.on("timeupdate", (time) => {
        setCurrentTime(time);
        onTimeUpdate(time);
      });

      ws.on("finish", () => {
        onStatusChange("paused");
      });

      const url = URL.createObjectURL(audioFile);
      ws.load(url);
      wavesurferRef.current = ws;
    })();

    return () => {
      ws?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioFile]);

  const handlePlayPause = useCallback(() => {
    if (!wavesurferRef.current || !isReady) return;
    if (wavesurferRef.current.isPlaying()) {
      wavesurferRef.current.pause();
      onStatusChange("paused");
    } else {
      wavesurferRef.current.play();
      onStatusChange("playing");
    }
  }, [isReady, onStatusChange]);

  const handleStop = useCallback(() => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.stop();
    setCurrentTime(0);
    onStatusChange("ready");
  }, [onStatusChange]);

  const isPlaying = status === "playing";
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div id="waveform-player" className="card">
      <div className="card-header">
        <span className="card-title">Waveform</span>
        {isReady && (
          <span id="waveform-time-display" className="font-mono text-xs text-iron-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        )}
      </div>

      <div className="waveform-body p-4 space-y-4">
        {/* WaveSurfer container */}
        <div
          id="waveform-canvas"
          ref={containerRef}
          className={cn(
            "w-full rounded-lg bg-iron-50 overflow-hidden",
            !audioFile && "flex items-center justify-center h-[72px]"
          )}
        >
          {!audioFile && (
            <p className="waveform-placeholder text-xs text-iron-400">파일을 업로드하면 파형이 표시됩니다</p>
          )}
        </div>

        {/* Progress bar */}
        {isReady && (
          <div id="playback-progress-track" className="h-1 bg-iron-100 rounded-full overflow-hidden">
            <div
              id="playback-progress-fill"
              className="h-full bg-brand-blue transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Controls */}
        <div id="player-controls" className="flex items-center gap-2">
          <button
            id="play-pause-btn"
            onClick={handlePlayPause}
            disabled={!isReady}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              isReady
                ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
                : "bg-iron-100 text-iron-300 cursor-not-allowed"
            )}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            id="stop-btn"
            onClick={handleStop}
            disabled={!isReady}
            className={cn(
              "p-2 rounded-lg transition-all",
              isReady
                ? "text-iron-500 hover:bg-iron-100 hover:text-iron-700"
                : "text-iron-300 cursor-not-allowed"
            )}
          >
            <Square size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
