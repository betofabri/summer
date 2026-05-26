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
        className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-6 space-y-5"
      >
        <div className="inline-flex items-center gap-2 text-[--color-primary] text-[11px] uppercase tracking-[0.16em] font-bold">
          <span className="w-1 h-1 rounded-full bg-[--color-primary]" />
          Sugestão para esta noite
        </div>

        <p className="text-base leading-relaxed text-[--color-text-2]">
          {suggestion.reasoning}
        </p>

        <ul className="space-y-3" aria-label="Produtos sugeridos">
          {orderedSuggestion.map((p, i) => {
            const isSelected = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggle(p.id)}
                  disabled={applied}
                  className={`press w-full text-left rounded-[--radius-md] border-2 min-h-[64px] px-4 py-3 flex items-center gap-4 ${
                    isSelected
                      ? "bg-[--color-surface] border-[--color-primary] shadow-lift"
                      : "bg-[--color-surface-2] border-[--color-border] opacity-50"
                  }`}
                >
                  <span
                    className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected
                        ? "bg-[--color-primary] text-white"
                        : "bg-[--color-border] text-[--color-text-3]"
                    }`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-[--color-text] truncate">
                      {p.name}
                    </div>
                    <div className="text-xs text-[--color-text-3] mt-0.5 flex items-center gap-2">
                      <span>{p.brand}</span>
                      <span
                        className="w-0.5 h-0.5 rounded-full bg-[--color-text-muted]"
                        aria-hidden="true"
                      />
                      <span>{CATEGORY_LABELS[p.category]}</span>
                    </div>
                  </div>
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
        className="press shadow-elevated w-full min-h-[56px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-white text-base font-bold tracking-tight disabled:opacity-40 disabled:shadow-none"
      >
        {applied ? "Aplicado" : applying ? "Salvando…" : "Marcar como aplicado"}
      </button>
    </div>
  );
}
