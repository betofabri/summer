import { useEffect, useState } from "react";
import {
  currentSubscription,
  pushSupported,
  subscribe,
  unsubscribe,
} from "../lib/push.ts";

type State = "loading" | "off" | "on" | "unsupported";

export function NotificationsButton() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pushSupported()) {
      setState("unsupported");
      return;
    }
    currentSubscription()
      .then((s) => setState(s ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function toggle() {
    if (busy || state === "unsupported" || state === "loading") return;
    setBusy(true);
    setError(null);
    try {
      if (state === "on") {
        await unsubscribe();
        setState("off");
      } else {
        await subscribe();
        setState("on");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falhou");
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") return null;

  const isOn = state === "on";

  return (
    <button
      onClick={toggle}
      disabled={busy || state === "loading"}
      title={isOn ? "Lembrete diário ligado" : "Ativar lembrete diário"}
      aria-label={isOn ? "Desativar lembrete diário" : "Ativar lembrete diário"}
      aria-pressed={isOn}
      className={`press flex-shrink-0 min-w-12 min-h-12 inline-flex items-center justify-center rounded-[--radius-md] relative ${
        isOn
          ? "glass-primary text-[--color-primary-bright] shadow-soft-glow"
          : "glass text-[--color-text-2]"
      } disabled:opacity-50`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={isOn ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 003.4 0" fill="none" stroke="currentColor" />
      </svg>
      {error ? (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[--color-danger]"
          aria-label={error}
        />
      ) : null}
    </button>
  );
}
