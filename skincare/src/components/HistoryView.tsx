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

const STATE_TONES: Record<SkinState, string> = {
  calma: "text-[--color-good]",
  oleosa: "text-[--color-text]",
  acne_ativa: "text-[--color-warn]",
  vermelhidao: "text-[--color-warn]",
  irritada: "text-[--color-bad]",
  ressecada: "text-[--color-muted]",
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
    <div className="fixed inset-0 bg-[--color-bg] z-50 overflow-y-auto">
      <div className="max-w-md mx-auto px-5 pt-6 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Histórico</h2>
          <button
            onClick={onClose}
            className="text-[--color-muted] text-[14px] py-1.5 px-3 rounded-full ring-soft active:scale-95 transition"
          >
            Fechar
          </button>
        </div>

        {entries === null ? (
          <div className="text-[--color-dim] text-[14px]">Carregando…</div>
        ) : entries.length === 0 ? (
          <div className="text-[--color-dim] text-[14px]">
            Nenhum registro ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((e) => {
              const usedProducts =
                e.routine?.product_ids
                  .map((id) => productById.get(id))
                  .filter((p): p is Product => Boolean(p)) ?? [];
              return (
                <div
                  key={e.daily.date}
                  className="rounded-2xl bg-[--color-surface] ring-soft px-4 py-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] tabular-nums text-[--color-dim]">
                      {e.daily.date.slice(8, 10)}/{e.daily.date.slice(5, 7)}
                    </span>
                    <span
                      className={`text-[13px] font-medium ${STATE_TONES[e.daily.skin_state]}`}
                    >
                      {STATE_LABELS[e.daily.skin_state]}
                      {e.daily.post_shave ? " · pós-barba" : ""}
                    </span>
                  </div>
                  {usedProducts.length > 0 ? (
                    <div className="space-y-1">
                      {usedProducts.map((p) => (
                        <div
                          key={p.id}
                          className="text-[13px] text-[--color-muted]"
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[12px] text-[--color-dim]">
                      Sem rotina aplicada
                    </div>
                  )}
                  {e.routine?.reasoning ? (
                    <div className="text-[12px] text-[--color-dim] italic pt-1 border-t border-[--color-border]">
                      {e.routine.reasoning}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
