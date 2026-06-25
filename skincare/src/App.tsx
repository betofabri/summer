import { useCallback, useEffect, useState } from "react";
import { TokenGate } from "./components/TokenGate.tsx";
import { YesterdayCard } from "./components/YesterdayCard.tsx";
import { StateSelector } from "./components/StateSelector.tsx";
import { Suggestion } from "./components/Suggestion.tsx";
import { HistoryView } from "./components/HistoryView.tsx";
import { ProductsView } from "./components/ProductsView.tsx";
import { SituationsView } from "./components/SituationsView.tsx";
import { AuthedImage } from "./components/AuthedImage.tsx";
import { NotificationsButton } from "./components/NotificationsButton.tsx";
import { SITUATION_CATEGORY_LABELS } from "./lib/types.ts";
import { formatTimeAgo } from "./lib/image.ts";
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
  const [showProducts, setShowProducts] = useState(false);
  const [showSituations, setShowSituations] = useState(false);

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
      <div className="min-h-dvh flex items-center justify-center px-6 bg-gradient-aurora">
        {bootError ? (
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-[--color-danger] text-sm font-medium">{bootError}</div>
            <button
              onClick={load}
              className="press min-h-12 px-6 inline-flex items-center justify-center rounded-[--radius-md] glass text-[--color-text] text-sm font-semibold"
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
    <div className="relative min-h-dvh bg-gradient-aurora">
      <div className="max-w-md mx-auto px-6 pt-14 pb-20">
        <header className="flex items-start justify-between mb-12">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[--color-primary] text-[11px] uppercase tracking-[0.2em] font-bold">
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-[--color-primary] animate-glow-pulse" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-[--color-primary]" />
              </span>
              Skin
            </div>
            <h1 className="font-display text-[40px] leading-[1] font-bold text-[--color-text] tracking-tight">
              {formatDate(boot.today_date)}
            </h1>
            <div className="text-[--color-text-3] text-sm">Boa noite.</div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsButton />
            <button
              onClick={() => setShowSituations(true)}
              className="press shadow-card flex-shrink-0 min-w-12 min-h-12 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2] relative"
              aria-label="Situações"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="6" width="18" height="14" rx="2" />
                <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {boot.active_situations.length > 0 ? (
                <span
                  className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[--color-primary] text-[--color-primary-on] text-[10px] font-bold tabular-nums"
                  aria-label={`${boot.active_situations.length} situações ativas`}
                >
                  {boot.active_situations.length}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setShowProducts(true)}
              className="press shadow-card flex-shrink-0 min-w-12 min-h-12 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2]"
              aria-label="Produtos"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 7l6-3 6 3v10l-6 3-6-3V7z" />
                <path d="M6 7l6 3 6-3M12 10v10" />
              </svg>
            </button>
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
                <path
                  d="M12 7v5l3 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <YesterdayCard
          yesterday={boot.yesterday}
          routine={boot.yesterday_routine}
          products={boot.products}
        />

        {boot.active_situations.length > 0 ? (
          <button
            onClick={() => setShowSituations(true)}
            className="press w-full mt-3 glass shadow-glass rounded-[--radius-lg] p-4 flex items-center gap-3 text-left"
          >
            <div className="flex -space-x-3">
              {boot.active_situations.slice(0, 3).map((s) => (
                <div
                  key={s.id}
                  className="w-11 h-11 rounded-[--radius-sm] overflow-hidden border-2 border-[--color-surface] bg-[--color-surface-2] flex-shrink-0"
                >
                  {s.cover ? (
                    <AuthedImage
                      r2Key={s.cover.r2_key}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[--color-text-3]">
                Acompanhando
              </div>
              <div className="text-sm font-bold text-[--color-text] truncate">
                {boot.active_situations.length === 1
                  ? boot.active_situations[0].title
                  : `${boot.active_situations.length} situações ativas`}
              </div>
              {boot.active_situations.length === 1 ? (
                <div className="text-xs text-[--color-text-3] font-medium">
                  {SITUATION_CATEGORY_LABELS[boot.active_situations[0].category]}{" "}
                  · {formatTimeAgo(boot.active_situations[0].started_at)}
                </div>
              ) : null}
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[--color-text-3] flex-shrink-0"
              aria-hidden="true"
            >
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        ) : null}

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
                <summary className="text-[--color-text-3] text-sm font-semibold cursor-pointer list-none inline-flex items-center gap-2 select-none">
                  <span>Nota opcional</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="group-open:rotate-180 transition-transform"
                    aria-hidden="true"
                  >
                    <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Algo específico hoje?"
                  rows={3}
                  className="press mt-3 w-full glass-soft rounded-[--radius-md] px-4 py-3 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary] resize-none"
                />
              </details>

              {error ? (
                <div
                  role="alert"
                  className="glass border-[--color-danger]/40 rounded-[--radius-md] px-4 py-3 text-sm text-[--color-danger] font-medium"
                >
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleSuggest}
                disabled={!state}
                className="press w-full min-h-[60px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-[--color-primary-on] text-base font-bold tracking-tight shadow-soft-glow disabled:bg-[--color-surface-2] disabled:text-[--color-text-muted] disabled:shadow-none disabled:opacity-50"
              >
                Sugerir tratamento →
              </button>
            </>
          ) : phase === "suggesting" ? (
            <div className="glass shadow-glass rounded-[--radius-lg] px-6 py-20 flex flex-col items-center gap-5">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-[--color-primary] animate-glow-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <div className="text-[--color-text-2] text-sm font-medium">
                Analisando sua pele…
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
              <div className="glass shadow-glass rounded-[--radius-lg] px-6 py-12 text-center space-y-4">
                <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-[--color-success] text-[--color-success-on] shadow-soft-glow-success">
                  <svg
                    width="24"
                    height="24"
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
                <div className="space-y-1">
                  <div className="font-display text-xl font-bold text-[--color-text]">
                    Rotina registrada
                  </div>
                  <div className="text-[--color-text-3] text-sm">
                    Até amanhã.
                  </div>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="press w-full min-h-11 text-[--color-text-3] text-sm font-semibold"
              >
                Editar
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {showHistory ? (
        <HistoryView
          products={boot.products}
          onClose={() => setShowHistory(false)}
        />
      ) : null}

      {showProducts ? (
        <ProductsView
          onClose={() => setShowProducts(false)}
          onChange={() => void load()}
        />
      ) : null}

      {showSituations ? (
        <SituationsView
          onClose={() => setShowSituations(false)}
          onChange={() => void load()}
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
    .replace(/\bde\b/g, "·");
}
