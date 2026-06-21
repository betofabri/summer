import { SKIN_STATES, type SkinState } from "../lib/types.ts";

interface Props {
  value: SkinState | null;
  onChange: (state: SkinState) => void;
  postShave: boolean;
  onPostShaveChange: (v: boolean) => void;
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
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
      <legend className="text-[11px] font-bold text-[--color-text-3] uppercase tracking-[0.2em] mb-1">
        Estado da pele
      </legend>

      <div
        role="radiogroup"
        aria-label="Estado da pele"
        className="grid grid-cols-2 gap-3"
      >
        {SKIN_STATES.map((s) => {
          const active = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(s.id)}
              className={`press relative min-h-[68px] px-4 py-3 rounded-[--radius-md] text-base font-bold tracking-tight ${
                active
                  ? "glass-primary text-[--color-primary-bright] shadow-soft-glow"
                  : "glass text-[--color-text-2]"
              }`}
            >
              {active ? (
                <span className="absolute top-3 right-3 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[--color-primary] text-[--color-primary-on]">
                  <CheckIcon />
                </span>
              ) : null}
              <span className="block text-left">{s.label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={postShave}
        onClick={() => onPostShaveChange(!postShave)}
        className={`press w-full min-h-[64px] px-5 rounded-[--radius-md] flex items-center justify-between gap-3 ${
          postShave
            ? "bg-[--color-warning-glass] text-[--color-warning] border border-[--color-warning]/40"
            : "glass text-[--color-text-2]"
        }`}
      >
        <div className="flex items-center gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 8h14M7 8v10a2 2 0 002 2h6a2 2 0 002-2V8M9 4h6l1 4H8z" />
          </svg>
          <span className="text-base font-bold tracking-tight">
            Fiz a barba hoje
          </span>
        </div>
        <span
          className={`relative w-12 h-7 rounded-full transition-colors ${
            postShave ? "bg-[--color-warning]" : "bg-[--color-surface-3]"
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
