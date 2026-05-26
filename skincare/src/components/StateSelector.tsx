import { SKIN_STATES, type SkinState } from "../lib/types.ts";

interface Props {
  value: SkinState | null;
  onChange: (state: SkinState) => void;
  postShave: boolean;
  onPostShaveChange: (v: boolean) => void;
}

const SELECTED_FILL: Record<string, string> = {
  good: "bg-[--color-success] border-[--color-success] text-white shadow-elevated",
  warn: "bg-[--color-warning] border-[--color-warning] text-white shadow-elevated",
  bad: "bg-[--color-danger] border-[--color-danger] text-white shadow-elevated",
  default:
    "bg-[--color-primary] border-[--color-primary] text-white shadow-elevated",
};

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8.5l3.5 3.5L13 4.5" />
    </svg>
  );
}

export function StateSelector({
  value,
  onChange,
  postShave,
  onPostShaveChange,
}: Props) {
  return (
    <fieldset className="space-y-5 border-0 p-0 m-0">
      <legend className="text-xs font-bold text-[--color-text-2] uppercase tracking-[0.08em] mb-1">
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
              className={`press relative min-h-[60px] px-4 py-3 rounded-[--radius-md] border-2 text-base font-semibold ${
                active
                  ? fill
                  : "bg-[--color-surface] border-[--color-border] text-[--color-text] shadow-card"
              }`}
            >
              {active ? (
                <CheckIcon className="absolute left-3 top-1/2 -translate-y-1/2" />
              ) : null}
              <span className={active ? "pl-5" : ""}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={postShave}
        onClick={() => onPostShaveChange(!postShave)}
        className={`press w-full min-h-[60px] px-5 rounded-[--radius-md] border-2 flex items-center justify-between gap-3 ${
          postShave
            ? "bg-[--color-warning] border-[--color-warning] text-white shadow-elevated"
            : "bg-[--color-surface] border-[--color-border] text-[--color-text] shadow-card"
        }`}
      >
        <span className="text-base font-semibold">Fiz a barba hoje</span>
        <span
          className={`relative w-12 h-7 rounded-full transition-colors ${
            postShave ? "bg-white/25" : "bg-[--color-border-strong]"
          }`}
          aria-hidden="true"
        >
          <span
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
              postShave ? "left-[22px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </fieldset>
  );
}
