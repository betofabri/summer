import type { DailyLog, Product, RoutineLog, SkinState } from "../lib/types.ts";

interface Props {
  yesterday: DailyLog | null;
  routine: RoutineLog | null;
  products: Product[];
}

const STATE_LABELS: Record<SkinState, string> = {
  normal: "Normal",
  oleosa: "Oleosa",
  irritada: "Irritada",
  acne_ativa: "Com acne",
};

export function YesterdayCard({ yesterday, routine, products }: Props) {
  if (!yesterday) {
    return (
      <section
        aria-label="Estado de ontem"
        className="glass shadow-glass rounded-[--radius-lg] p-6"
      >
        <div className="text-[11px] font-bold text-[--color-text-3] uppercase tracking-[0.2em] mb-3">
          Ontem
        </div>
        <p className="text-[--color-text-2] text-sm">
          Sem registro. Esta é sua primeira noite.
        </p>
      </section>
    );
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const usedProducts =
    routine?.product_ids
      .map((id) => productById.get(id))
      .filter((p): p is Product => Boolean(p)) ?? [];

  return (
    <section
      aria-label="Estado de ontem"
      className="glass shadow-glass rounded-[--radius-lg] p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-[--color-text-3] uppercase tracking-[0.2em]">
          Ontem
        </div>
        <div className="text-[--color-text-3] text-xs font-mono tabular-nums">
          {yesterday.date.slice(8, 10)}/{yesterday.date.slice(5, 7)}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <div className="font-display text-2xl font-bold text-[--color-text] tracking-tight">
          {STATE_LABELS[yesterday.skin_state]}
        </div>
        {yesterday.post_shave ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[--radius-pill] text-[10px] font-bold uppercase tracking-wider bg-[--color-warning]/15 text-[--color-warning]">
            Pós-barba
          </span>
        ) : null}
      </div>

      {usedProducts.length > 0 ? (
        <ul className="space-y-2.5 pt-1">
          {usedProducts.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 text-sm text-[--color-text-2]"
            >
              <span className="font-mono tabular-nums text-[--color-text-muted] text-xs w-4">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{p.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[--color-text-3]">Sem rotina aplicada.</p>
      )}
    </section>
  );
}
