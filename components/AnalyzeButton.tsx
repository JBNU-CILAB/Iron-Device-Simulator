"use client";

import { Loader2, ScanSearch } from "lucide-react";
import { AppStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  status: AppStatus;
  hasFile: boolean;
  onClick: () => void;
}

export default function AnalyzeButton({ status, hasFile, onClick }: Props) {
  const isLoading = status === "uploading" || status === "analyzing";
  const isDisabled = !hasFile || isLoading || status === "playing";

  return (
    <button
      id="analyze-btn"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
        isDisabled
          ? "bg-iron-100 text-iron-300 cursor-not-allowed"
          : "bg-brand-blue text-white hover:bg-brand-blue-dark shadow-sm hover:shadow-md"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 size={15} className="btn-spinner animate-spin" />
          {status === "uploading" ? "업로드 중..." : "분석 중..."}
        </>
      ) : (
        <>
          <ScanSearch size={15} />
          분석 시작
        </>
      )}
    </button>
  );
}
