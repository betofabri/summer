import { SKIN_STATES, type SkinState } from "../lib/types.ts";

interface Props {
  value: SkinState | null;
  onChange: (state: SkinState) => void;
  postShave: boolean;
  onPostShaveChange: (v: boolean) => void;
}

const SELECTED_TONE: Record<string, string> = {
  good: "bg-[--color-success-soft] border-[--color-success] text-[--color-success]",
  warn: "bg-[--color-warning-soft] border-[--color-warning] text-[--color-warning]",
  bad: "bg-[--color-danger-soft] border-[--color-danger] text-[--color-danger]",
  default:
    "bg-[--color-primary-soft] border-[--color-primary] text-[--color-primary]",
};

export function StateSelector({
  value,
  onChange,
  postShave,
  onPostShaveChange,
}: Props) {
  return (
    <fieldset className="space-y-6">
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
          const tone = SELECTED_TONE[s.tone] ?? SELECTED_TONE.default;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(s.id)}
              className={`press min-h-12 px-4 rounded-[--radius-md] border text-sm font-semibold text-center ${
                active
                  ? tone
                  : "bg-[--color-surface] border-[--color-border] text-[--color-text-2]"
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
        className={`press w-full min-h-12 px-4 rounded-[--radius-md] border flex items-center justify-between gap-3 ${
          postShave
            ? "bg-[--color-warning-soft] border-[--color-warning] text-[--color-warning]"
            : "bg-[--color-surface] border-[--color-border] text-[--color-text-2]"
        }`}
      >
        <span className="text-sm font-semibold">Fiz a barba hoje</span>
        <span
          className={`relative w-11 h-6 rounded-full transition-colors ${
            postShave ? "bg-[--color-warning]" : "bg-[--color-border-strong]"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
              postShave ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </fieldset>
  );
}
