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
      <div className="min-h-dvh flex items-center justify-center px-6">
        {bootError ? (
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-[--color-danger] text-base">{bootError}</div>
            <button
              onClick={load}
              className="press min-h-11 px-6 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] text-[--color-text] text-sm font-medium border border-[--color-border]"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="text-[--color-text-3] text-sm">Carregando…</div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-12 pb-16">
      <header className="flex items-start justify-between mb-12">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-[--color-text-3] text-[11px] uppercase tracking-[0.16em] font-bold">
            <span className="w-1 h-1 rounded-full bg-[--color-primary]" />
            Boa noite
          </div>
          <h1 className="font-display text-[36px] leading-[1.1] font-bold text-[--color-text]">
            {formatDate(boot.today_date)}
          </h1>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="press shadow-card flex-shrink-0 min-w-12 min-h-12 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2]"
          aria-label="Histórico"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </header>

      <YesterdayCard
        yesterday={boot.yesterday}
        routine={boot.yesterday_routine}
        products={boot.products}
      />

      <div className="mt-10 space-y-8">
        {phase === "input" ? (
          <>
            <StateSelector
              value={state}
              onChange={setState}
              postShave={postShave}
              onPostShaveChange={setPostShave}
            />

            <details className="group">
              <summary className="text-[--color-text-3] text-sm font-medium cursor-pointer list-none inline-flex items-center gap-2 select-none">
                <span>Nota opcional</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  className="group-open:rotate-180 transition-transform"
                  aria-hidden="true"
                >
                  <path
                    d="M3 5l3 3 3-3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Algo específico hoje?"
                rows={3}
                className="press mt-3 w-full bg-[--color-surface] border border-[--color-border] rounded-[--radius-md] px-4 py-3 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary] resize-none"
              />
            </details>

            {error ? (
              <div
                role="alert"
                className="bg-[--color-danger-soft] border border-[--color-danger]/30 rounded-[--radius-md] px-4 py-3 text-sm text-[--color-danger]"
              >
                {error}
              </div>
            ) : null}

            <button
              onClick={handleSuggest}
              disabled={!state}
              className="press shadow-elevated w-full min-h-[56px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-white text-base font-bold tracking-tight disabled:opacity-40 disabled:shadow-none"
            >
              Sugerir tratamento
            </button>
          </>
        ) : phase === "suggesting" ? (
          <div className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] px-6 py-16 flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              <span
                className="w-2 h-2 rounded-full bg-[--color-primary] animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-[--color-primary] animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-[--color-primary] animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <div className="text-[--color-text-2] text-base font-medium">
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
          <div className="space-y-6">
            <div className="shadow-card bg-[--color-success-soft] border-2 border-[--color-success]/30 rounded-[--radius-lg] px-6 py-12 text-center space-y-3">
              <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-[--color-success] text-white shadow-elevated">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 8.5l3.5 3.5L13 4.5" />
                </svg>
              </div>
              <div className="font-display text-xl font-bold text-[--color-success]">
                Rotina registrada
              </div>
              <div className="text-[--color-text-2] text-sm">Até amanhã.</div>
            </div>
            <button
              onClick={handleReset}
              className="press w-full min-h-11 text-[--color-text-2] text-sm font-semibold"
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
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
}
