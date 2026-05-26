import type { DailyLog, Product, RoutineLog, SkinState } from "../lib/types.ts";

interface Props {
  yesterday: DailyLog | null;
  routine: RoutineLog | null;
  products: Product[];
}

const STATE_LABELS: Record<SkinState, string> = {
  calma: "Calma",
  oleosa: "Oleosa",
  irritada: "Irritada",
  acne_ativa: "Acne ativa",
  vermelhidao: "Vermelhidão",
  ressecada: "Ressecada",
};

export function YesterdayCard({ yesterday, routine, products }: Props) {
  if (!yesterday) {
    return (
      <div className="rounded-3xl bg-[--color-surface] ring-soft px-5 py-5">
        <div className="text-[--color-dim] text-[11px] uppercase tracking-[0.18em] mb-1">
          Ontem
        </div>
        <div className="text-[--color-muted] text-[15px]">
          Sem registro. Esta é sua primeira noite no app.
        </div>
      </div>
    );
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const usedProducts = routine?.product_ids
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p)) ?? [];

  return (
    <div className="rounded-3xl bg-[--color-surface] ring-soft px-5 py-5 space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="text-[--color-dim] text-[11px] uppercase tracking-[0.18em]">
          Ontem
        </div>
        <div className="text-[--color-muted] text-xs tabular-nums">
          {yesterday.date.slice(8, 10)}/{yesterday.date.slice(5, 7)}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[15px] text-[--color-text]">
          {STATE_LABELS[yesterday.skin_state]}
        </span>
        {yesterday.post_shave ? (
          <span className="text-[11px] uppercase tracking-wider text-[--color-warn] px-2 py-0.5 rounded-full ring-1 ring-[--color-warn]/30">
            pós-barba
          </span>
        ) : null}
      </div>

      {usedProducts.length > 0 ? (
        <div className="space-y-1.5">
          {usedProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-[13px]">
              <span className="w-1 h-1 rounded-full bg-[--color-accent]" />
              <span className="text-[--color-muted]">{p.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[13px] text-[--color-dim]">Sem rotina aplicada</div>
      )}
    </div>
  );
}
