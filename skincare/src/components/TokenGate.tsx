import { useState, type FormEvent } from "react";
import { setToken } from "../lib/api.ts";

interface Props {
  onUnlock: () => void;
}

export function TokenGate({ onUnlock }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setToken(value.trim());
    onUnlock();
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 bg-gradient-aurora">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 text-[--color-primary] text-[11px] uppercase tracking-[0.2em] font-bold">
            <span className="relative flex items-center justify-center w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-[--color-primary] animate-glow-pulse" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-[--color-primary]" />
            </span>
            Skin
          </div>
          <h1 className="font-display text-[40px] leading-[1] font-bold text-[--color-text] tracking-tight">
            Acesso
          </h1>
          <p className="text-[--color-text-3] text-sm">
            Digite seu token para continuar.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="token"
            className="block text-[11px] font-bold text-[--color-text-3] uppercase tracking-[0.16em]"
          >
            Token
          </label>
          <input
            id="token"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="••••••••"
            className="press w-full min-h-[56px] glass-soft rounded-[--radius-md] px-5 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="press w-full min-h-[60px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-[--color-primary-on] text-base font-bold tracking-tight shadow-soft-glow disabled:bg-[--color-surface-2] disabled:text-[--color-text-muted] disabled:shadow-none disabled:opacity-50"
        >
          Entrar →
        </button>
      </form>
    </div>
  );
}
