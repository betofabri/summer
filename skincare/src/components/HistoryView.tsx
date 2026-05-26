import { useEffect, useState } from "react";
import { history } from "../lib/api.ts";
import type { HistoryEntry, Product, SkinState } from "../lib/types.ts";

interface Props {
  products: Product[];
  onClose: () => void;
}

const STATE_LABELS: Record<SkinState, string> = {
  calma: "Calma",
  oleosa: "Oleosa",
  irritada: "Irritada",
  acne_ativa: "Acne ativa",
  vermelhidao: "Vermelhidão",
  ressecada: "Ressecada",
};

const STATE_CHIP: Record<SkinState, string> = {
  calma:
    "bg-[--color-success-soft] text-[--color-success] border border-[--color-success]/30",
  oleosa:
    "bg-[--color-surface-2] text-[--color-text-2] border border-[--color-border]",
  acne_ativa:
    "bg-[--color-warning-soft] text-[--color-warning] border border-[--color-warning]/30",
  vermelhidao:
    "bg-[--color-warning-soft] text-[--color-warning] border border-[--color-warning]/30",
  irritada:
    "bg-[--color-danger-soft] text-[--color-danger] border border-[--color-danger]/30",
  ressecada:
    "bg-[--color-surface-2] text-[--color-text-2] border border-[--color-border]",
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
      className="fixed inset-0 bg-[--color-bg] z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto px-6 pt-10 pb-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-display text-2xl font-semibold text-[--color-text]">
            Histórico
          </h2>
          <button
            onClick={onClose}
            className="press min-h-11 px-5 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2] text-sm font-medium"
          >
            Fechar
          </button>
        </div>

        {entries === null ? (
          <div className="text-[--color-text-3] text-sm">Carregando…</div>
        ) : entries.length === 0 ? (
          <div className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-8 text-center">
            <p className="text-[--color-text-2] text-sm">
              Nenhum registro ainda.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {entries.map((e) => {
              const usedProducts =
                e.routine?.product_ids
                  .map((id) => productById.get(id))
                  .filter((p): p is Product => Boolean(p)) ?? [];
              return (
                <li
                  key={e.daily.date}
                  className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[--color-text-3] font-medium">
                      {e.daily.date.slice(8, 10)}/{e.daily.date.slice(5, 7)}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_CHIP[e.daily.skin_state]}`}
                      >
                        {STATE_LABELS[e.daily.skin_state]}
                      </span>
                      {e.daily.post_shave ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[--color-warning-soft] text-[--color-warning] border border-[--color-warning]/30">
                          Pós-barba
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {usedProducts.length > 0 ? (
                    <ul className="space-y-1.5">
                      {usedProducts.map((p) => (
                        <li
                          key={p.id}
                          className="text-sm text-[--color-text-2] flex items-center gap-3"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-[--color-primary]"
                            aria-hidden="true"
                          />
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
