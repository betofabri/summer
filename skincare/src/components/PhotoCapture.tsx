import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "../lib/image.ts";

interface Props {
  label: string;
  hint?: string;
  capture?: "user" | "environment";
  onCapture: (dataUrl: string) => void;
  disabled?: boolean;
}

export function PhotoCapture({
  label,
  hint,
  capture = "environment",
  onCapture,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setProcessing(true);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onCapture(dataUrl);
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={disabled || processing}
      className="press w-full min-h-[88px] rounded-[--radius-md] glass-soft border-dashed px-5 py-4 flex items-center gap-4 text-left disabled:opacity-50"
      style={{ borderStyle: "dashed", borderWidth: "1.5px" }}
    >
      <span className="flex-shrink-0 w-12 h-12 rounded-full glass-primary text-[--color-primary-bright] flex items-center justify-center shadow-soft-glow">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-base font-bold tracking-tight text-[--color-text]">
          {processing ? "Processando…" : label}
        </span>
        {hint ? (
          <span className="block text-xs text-[--color-text-3] mt-0.5">
            {hint}
          </span>
        ) : null}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </button>
  );
}
