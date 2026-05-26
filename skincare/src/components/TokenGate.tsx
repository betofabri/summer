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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <div className="text-[--color-dim] text-xs uppercase tracking-[0.18em]">Skin</div>
          <h1 className="text-2xl font-semibold tracking-tight">Acesso</h1>
        </div>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Token"
          className="w-full bg-[--color-surface] ring-soft rounded-2xl px-4 py-3.5 text-[--color-text] placeholder:text-[--color-dim] focus:outline-none focus:ring-1 focus:ring-[--color-accent] transition"
        />
        <button
          type="submit"
          className="w-full bg-[--color-accent] text-[--color-bg] font-medium rounded-2xl py-3.5 active:scale-[0.98] transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
