import { useCallback, useEffect, useState } from "react";
import { TokenGate } from "./components/TokenGate.tsx";
import { YesterdayCard } from "./components/YesterdayCard.tsx";
import { StateSelector } from "./components/StateSelector.tsx";
import { Suggestion } from "./components/Suggestion.tsx";
import { HistoryView } from "./components/HistoryView.tsx";
import { bootstrap, getToken, logDaily, suggest } from "./lib/api.ts";
import type {
  BootstrapResponse,
  SkinState,
  SuggestResponse,
} from "./lib/types.ts";

type Phase = "input" | "suggesting" | "review" | "done";

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [boot, setBoot] = useState<BootstrapResponse | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("input");
  const [state, setState] = useState<SkinState | null>(null);
  const [postShave, setPostShave] = useState(false);
  const [notes, setNotes] = useState("");
  const [suggestion, setSuggestion] = useState<SuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setBootError(null);
    try {
      const data = await bootstrap();
      setBoot(data);
      if (data.today) {
        setState(data.today.skin_state);
        setPostShave(data.today.post_shave);
        setNotes(data.today.notes ?? "");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      if (msg === "No token" || msg === "unauthorized") {
        setAuthed(false);
      } else {
        setBootError(msg);
      }
    }
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  async function handleSuggest() {
    if (!state) return;
    setPhase("suggesting");
    setError(null);
    try {
      await logDaily({ skin_state: state, post_shave: postShave, notes });
      const result = await suggest({
        skin_state: state,
        post_shave: postShave,
        notes: notes || undefined,
      });
      setSuggestion(result);
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar sugestão");
      setPhase("input");
    }
  }

  async function handleApplied() {
    setPhase("done");
    await load();
  }

  function handleReset() {
    setPhase("input");
    setSuggestion(null);
    setNotes("");
  }

  if (!authed) {
    return <TokenGate onUnlock={() => setAuthed(true)} />;
  }

  if (!boot) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        {bootError ? (
          <div className="text-center space-y-3 px-6">
            <div className="text-[--color-bad] text-[14px]">{bootError}</div>
            <button
              onClick={load}
              className="text-[--color-muted] text-[13px] underline"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="text-[--color-dim] text-[13px]">Carregando…</div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[--color-dim] text-[11px] uppercase tracking-[0.18em]">
            Boa noite
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
            {formatDate(boot.today_date)}
          </h1>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="w-10 h-10 rounded-full bg-[--color-surface] ring-soft flex items-center justify-center active:scale-95 transition"
          aria-label="Histórico"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-[--color-muted]"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <YesterdayCard
        yesterday={boot.yesterday}
        routine={boot.yesterday_routine}
        products={boot.products}
      />

      <div className="mt-7 space-y-7">
        {phase === "input" ? (
          <>
            <StateSelector
              value={state}
              onChange={setState}
              postShave={postShave}
              onPostShaveChange={setPostShave}
            />

            <details className="group">
              <summary className="text-[--color-dim] text-[12px] cursor-pointer list-none flex items-center gap-1.5 select-none">
                <span>Nota opcional</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="group-open:rotate-180 transition"
                >
                  <path d="M3 5l3 3 3-3" strokeLinecap="round" />
                </svg>
              </summary>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Algo específico hoje?"
                rows={2}
                className="mt-2 w-full bg-[--color-surface] ring-soft rounded-2xl px-4 py-3 text-[14px] text-[--color-text] placeholder:text-[--color-dim] focus:outline-none focus:ring-1 focus:ring-[--color-accent] transition resize-none"
              />
            </details>

            {error ? (
              <div className="text-[--color-bad] text-[13px]">{error}</div>
            ) : null}

            <button
              onClick={handleSuggest}
              disabled={!state}
              className="w-full bg-[--color-accent] text-[--color-bg] font-medium rounded-2xl py-3.5 active:scale-[0.98] transition disabled:opacity-30 disabled:active:scale-100"
            >
              Sugerir rotina
            </button>
          </>
        ) : phase === "suggesting" ? (
          <div className="rounded-3xl bg-[--color-surface] ring-soft px-5 py-12 text-center">
            <div className="text-[--color-muted] text-[14px]">
              Pensando na melhor rotina…
            </div>
          </div>
        ) : phase === "review" && suggestion ? (
          <Suggestion
            suggestion={suggestion}
            products={boot.products}
            onApplied={handleApplied}
          />
        ) : phase === "done" ? (
          <div className="space-y-5">
            <div className="rounded-3xl bg-[--color-surface] ring-soft px-5 py-8 text-center space-y-2">
              <div className="text-[--color-accent] text-[15px] font-medium">
                Rotina registrada
              </div>
              <div className="text-[--color-dim] text-[13px]">
                Até amanhã.
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full text-[--color-muted] text-[14px] py-2 active:opacity-50 transition"
            >
              Editar
            </button>
          </div>
        ) : null}
      </div>

      {showHistory ? (
        <HistoryView
          products={boot.products}
          onClose={() => setShowHistory(false)}
        />
      ) : null}
    </div>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date
    .toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    })
    .toLowerCase();
}
