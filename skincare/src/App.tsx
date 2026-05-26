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
    <div className="max-w-md mx-auto px-6 pt-10 pb-16">
      <header className="flex items-start justify-between mb-10">
        <div className="space-y-1">
          <div className="text-[--color-text-3] text-xs uppercase tracking-[0.14em] font-semibold">
            Boa noite
          </div>
          <h1 className="font-display text-[30px] leading-[1.15] font-semibold text-[--color-text]">
            {formatDate(boot.today_date)}
          </h1>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="press min-w-11 min-h-11 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2]"
          aria-label="Histórico"
        >
          <svg
            width="18"
            height="18"
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
              className="press w-full min-h-12 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-white text-base font-semibold disabled:opacity-40"
            >
              Sugerir tratamento
            </button>
          </>
        ) : phase === "suggesting" ? (
          <div className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] px-6 py-16 text-center">
            <div className="text-[--color-text-2] text-base">
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
            <div className="bg-[--color-success-soft] border border-[--color-success]/30 rounded-[--radius-lg] px-6 py-10 text-center space-y-2">
              <div className="text-[--color-success] text-base font-semibold">
                Rotina registrada
              </div>
              <div className="text-[--color-text-2] text-sm">Até amanhã.</div>
            </div>
            <button
              onClick={handleReset}
              className="press w-full min-h-11 text-[--color-text-2] text-sm font-medium"
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
