import { useState } from "react";
import {
  CATEGORY_LABELS,
  type Product,
  type SuggestResponse,
} from "../lib/types.ts";
import { applyRoutine } from "../lib/api.ts";

interface Props {
  suggestion: SuggestResponse;
  products: Product[];
  onApplied: () => void;
}

export function Suggestion({ suggestion, products, onApplied }: Props) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const [selected, setSelected] = useState<Set<string>>(
    new Set(suggestion.product_ids),
  );
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const orderedSuggestion = suggestion.product_ids
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p));

  function toggle(id: string) {
    if (applied) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleApply() {
    if (selected.size === 0) return;
    setApplying(true);
    try {
      const ordered = suggestion.product_ids.filter((id) => selected.has(id));
      const extras = Array.from(selected).filter(
        (id) => !suggestion.product_ids.includes(id),
      );
      await applyRoutine(suggestion.routine_id, [...ordered, ...extras]);
      setApplied(true);
      setTimeout(onApplied, 600);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      <section
        aria-label="Sugestão da noite"
        className="glass shadow-glass rounded-[--radius-lg] overflow-hidden"
      >
        <div className="p-6 pb-5 border-b border-[--color-border]">
          <div className="inline-flex items-center gap-2 text-[--color-primary] text-[11px] uppercase tracking-[0.2em] font-bold mb-3">
            <span className="w-1 h-1 rounded-full bg-[--color-primary]" />
            Tratamento sugerido
          </div>
          <p className="text-base leading-relaxed text-[--color-text-2] font-medium">
            {suggestion.reasoning}
          </p>
        </div>

        <ul className="p-3" aria-label="Produtos sugeridos">
          {orderedSuggestion.map((p, i) => {
            const isSelected = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(p.id)}
                  disabled={applied}
                  className={`press w-full text-left rounded-[--radius-md] min-h-[72px] px-4 py-3 flex items-center gap-4 ${
                    isSelected
                      ? "glass-soft"
                      : "bg-transparent opacity-40"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-10 h-10 rounded-[--radius-sm] flex items-center justify-center font-mono font-bold text-sm tabular-nums ${
                      isSelected
                        ? "bg-[--color-primary] text-[--color-primary-on]"
                        : "bg-[--color-surface-3] text-[--color-text-muted]"
                    }`}
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-[--color-text] truncate tracking-tight">
                      {p.name}
                    </div>
                    <div className="text-xs text-[--color-text-3] mt-0.5 flex items-center gap-2 font-medium">
                      <span>{p.brand}</span>
                      <span
                        className="w-1 h-1 rounded-full bg-[--color-text-muted]"
                        aria-hidden="true"
                      />
                      <span>{CATEGORY_LABELS[p.category]}</span>
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-[--color-primary] border-[--color-primary]"
                        : "bg-transparent border-[--color-border-strong]"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[--color-primary-on]"
                      >
                        <path d="M3 8.5l3.5 3.5L13 4.5" />
                      </svg>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <button
        type="button"
        onClick={handleApply}
        disabled={selected.size === 0 || applying || applied}
        className="press w-full min-h-[60px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-[--color-primary-on] text-base font-bold tracking-tight shadow-soft-glow disabled:bg-[--color-surface-2] disabled:text-[--color-text-muted] disabled:shadow-none disabled:opacity-50"
      >
        {applied ? "✓ Aplicado" : applying ? "Salvando…" : "Marcar como aplicado"}
      </button>
    </div>
  );
}
