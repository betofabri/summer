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
    <div className="min-h-dvh flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <div className="text-[--color-text-3] text-xs uppercase tracking-[0.14em] font-semibold">
            Skin
          </div>
          <h1 className="font-display text-[30px] leading-[1.15] font-semibold text-[--color-text]">
            Entrar
          </h1>
          <p className="text-[--color-text-2] text-sm">
            Digite seu token de acesso para continuar.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="token"
            className="block text-xs font-semibold text-[--color-text-2] uppercase tracking-[0.08em]"
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
            className="press w-full min-h-12 bg-[--color-surface] border border-[--color-border] rounded-[--radius-md] px-4 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="press w-full min-h-12 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-white text-base font-semibold disabled:opacity-40"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
