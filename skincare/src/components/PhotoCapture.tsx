import { useRef, useState } from "react";
import { fileToCompressedDataUrl } from "../lib/image.ts";

interface Props {
  label: string;
  hint?: string;
  /**
   * Force a specific camera. Omit to let the OS show its native picker
   * (Take Photo / Photo Library / Choose File on iOS).
   */
  capture?: "user" | "environment";
  onCapture: (dataUrl: string) => void;
  disabled?: boolean;
}

export function PhotoCapture({
  label,
  hint,
  capture,
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
      <span className="relative flex-shrink-0 w-12 h-12 rounded-full glass-primary text-[--color-primary-bright] flex items-center justify-center shadow-soft-glow">
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
        {!capture ? (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full glass-strong text-[--color-primary-bright] flex items-center justify-center">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </span>
        ) : null}
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
