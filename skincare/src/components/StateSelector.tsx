import { SKIN_STATES, type SkinState } from "../lib/types.ts";

interface Props {
  value: SkinState | null;
  onChange: (state: SkinState) => void;
  postShave: boolean;
  onPostShaveChange: (v: boolean) => void;
}

const SELECTED_FILL: Record<string, string> = {
  good: "bg-[--color-success] border-[--color-success] text-white",
  warn: "bg-[--color-warning] border-[--color-warning] text-white",
  bad: "bg-[--color-danger] border-[--color-danger] text-white",
  default: "bg-[--color-primary] border-[--color-primary] text-white",
};

export function StateSelector({
  value,
  onChange,
  postShave,
  onPostShaveChange,
}: Props) {
  return (
    <fieldset className="space-y-6 border-0 p-0 m-0">
      <legend className="block text-xs font-semibold text-[--color-text-2] uppercase tracking-[0.08em] mb-4">
        Como está sua pele hoje
      </legend>

      <div
        role="radiogroup"
        aria-label="Estado da pele"
        className="grid grid-cols-2 gap-3"
      >
        {SKIN_STATES.map((s) => {
          const active = value === s.id;
          const fill = SELECTED_FILL[s.tone] ?? SELECTED_FILL.default;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(s.id)}
              className={`press min-h-12 px-4 rounded-[--radius-md] border-2 text-sm font-semibold text-center shadow-sm ${
                active
                  ? `${fill} shadow-md`
                  : "bg-[--color-surface] border-[--color-border] text-[--color-text]"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={postShave}
        onClick={() => onPostShaveChange(!postShave)}
        className={`press w-full min-h-12 px-4 rounded-[--radius-md] border-2 flex items-center justify-between gap-3 ${
          postShave
            ? "bg-[--color-warning] border-[--color-warning] text-white shadow-md"
            : "bg-[--color-surface] border-[--color-border] text-[--color-text]"
        }`}
      >
        <span className="text-sm font-semibold">Fiz a barba hoje</span>
        <span
          className={`relative w-11 h-6 rounded-full transition-colors ${
            postShave ? "bg-white/30" : "bg-[--color-border-strong]"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              postShave ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </fieldset>
  );
}
