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

export function YesterdayCard({ yesterday, routine, products }: Props) {
  if (!yesterday) {
    return (
      <section
        aria-label="Estado de ontem"
        className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-6"
      >
        <div className="text-[--color-text-3] text-xs uppercase tracking-[0.14em] font-semibold mb-2">
          Ontem
        </div>
        <p className="text-[--color-text-2] text-sm">
          Sem registro. Esta é sua primeira noite no app.
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
      className="bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-6 space-y-5"
    >
      <div className="flex items-baseline justify-between">
        <div className="text-[--color-text-3] text-xs uppercase tracking-[0.14em] font-semibold">
          Ontem
        </div>
        <div className="text-[--color-text-3] text-xs">
          {yesterday.date.slice(8, 10)}/{yesterday.date.slice(5, 7)}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_CHIP[yesterday.skin_state]}`}
        >
          {STATE_LABELS[yesterday.skin_state]}
        </span>
        {yesterday.post_shave ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[--color-warning-soft] text-[--color-warning] border border-[--color-warning]/30">
            Pós-barba
          </span>
        ) : null}
      </div>

      {usedProducts.length > 0 ? (
        <ul className="space-y-2">
          {usedProducts.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 text-sm text-[--color-text-2]"
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
        <p className="text-sm text-[--color-text-3]">Sem rotina aplicada.</p>
      )}
    </section>
  );
}
