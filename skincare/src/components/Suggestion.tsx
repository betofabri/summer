import { useState } from "react";
import { CATEGORY_LABELS, type Product, type SuggestResponse } from "../lib/types.ts";
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
    <div className="space-y-5">
      <div className="rounded-3xl bg-[--color-surface] ring-soft px-5 py-5 space-y-4">
        <div className="text-[--color-dim] text-[11px] uppercase tracking-[0.18em]">
          Sugestão para esta noite
        </div>

        <p className="text-[15px] leading-relaxed text-[--color-muted]">
          {suggestion.reasoning}
        </p>

        <div className="space-y-2 pt-1">
          {orderedSuggestion.map((p, i) => {
            const isSelected = selected.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                disabled={applied}
                className={`w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition active:scale-[0.99] ${
                  isSelected
                    ? "bg-[--color-surface-2] ring-1 ring-[--color-accent]/50"
                    : "bg-[--color-surface-2]/40 ring-1 ring-[--color-border] opacity-50"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold tabular-nums ${
                    isSelected
                      ? "bg-[--color-accent] text-[--color-bg]"
                      : "bg-[--color-border] text-[--color-dim]"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[--color-text] truncate">
                    {p.name}
                  </div>
                  <div className="text-[12px] text-[--color-dim] flex items-center gap-2">
                    <span>{p.brand}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-[--color-dim]" />
                    <span>{CATEGORY_LABELS[p.category]}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleApply}
        disabled={selected.size === 0 || applying || applied}
        className="w-full bg-[--color-accent] text-[--color-bg] font-medium rounded-2xl py-3.5 active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100"
      >
        {applied ? "Aplicado" : applying ? "Salvando…" : "Marcar como aplicado"}
      </button>
    </div>
  );
}
