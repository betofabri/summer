import { useEffect, useState } from "react";
import { history } from "../lib/api.ts";
import type { HistoryEntry, Product, SkinState } from "../lib/types.ts";

interface Props {
  products: Product[];
  onClose: () => void;
}

const STATE_LABELS: Record<SkinState, string> = {
  normal: "Normal",
  oleosa: "Oleosa",
  irritada: "Irritada",
  acne_ativa: "Com acne",
};

const STATE_DOT: Record<SkinState, string> = {
  normal: "bg-[--color-success]",
  oleosa: "bg-[--color-primary]",
  irritada: "bg-[--color-danger]",
  acne_ativa: "bg-[--color-warning]",
};

export function HistoryView({ products, onClose }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const productById = new Map(products.map((p) => [p.id, p]));

  useEffect(() => {
    history()
      .then((r) => setEntries(r.history))
      .catch(() => setEntries([]));
  }, []);

  return (
    <div
      role="dialog"
      aria-label="Histórico"
      className="anim-backdrop fixed inset-0 bg-gradient-aurora z-50 overflow-y-auto"
    >
      <div className="anim-sheet max-w-md mx-auto px-6 pt-14 pb-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-3xl font-bold text-[--color-text] tracking-tight">
            Histórico
          </h2>
          <button
            onClick={onClose}
            className="press min-h-12 px-5 inline-flex items-center justify-center rounded-[--radius-md] glass text-[--color-text-2] text-sm font-semibold"
          >
            Fechar
          </button>
        </div>

        {entries === null ? (
          <div className="text-[--color-text-3] text-sm">Carregando…</div>
        ) : entries.length === 0 ? (
          <div className="glass shadow-glass rounded-[--radius-lg] p-10 text-center">
            <p className="text-[--color-text-2] text-sm">
              Nenhum registro ainda.
            </p>
          </div>
        ) : (
          <ul className="stagger space-y-3">
            {entries.map((e) => {
              const usedProducts =
                e.routine?.product_ids
                  .map((id) => productById.get(id))
                  .filter((p): p is Product => Boolean(p)) ?? [];
              return (
                <li
                  key={e.daily.date}
                  className="glass shadow-glass rounded-[--radius-lg] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${STATE_DOT[e.daily.skin_state]}`}
                      />
                      <span className="text-base font-bold text-[--color-text] tracking-tight">
                        {STATE_LABELS[e.daily.skin_state]}
                      </span>
                      {e.daily.post_shave ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-pill] text-[10px] font-bold uppercase tracking-wider bg-[--color-warning]/15 text-[--color-warning]">
                          Barba
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-[--color-text-3] font-mono tabular-nums">
                      {e.daily.date.slice(8, 10)}/{e.daily.date.slice(5, 7)}
                    </span>
                  </div>

                  {usedProducts.length > 0 ? (
                    <ul className="space-y-1.5">
                      {usedProducts.map((p, i) => (
                        <li
                          key={p.id}
                          className="text-sm text-[--color-text-2] flex items-center gap-3 font-medium"
                        >
                          <span className="font-mono tabular-nums text-[--color-text-muted] text-xs w-4">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{p.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-[--color-text-3]">
                      Sem rotina aplicada.
                    </p>
                  )}

                  {e.routine?.reasoning ? (
                    <p className="text-xs text-[--color-text-3] italic pt-3 border-t border-[--color-border]">
                      {e.routine.reasoning}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
