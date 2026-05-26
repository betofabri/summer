import { SKIN_STATES, type SkinState } from "../lib/types.ts";

interface Props {
  value: SkinState | null;
  onChange: (state: SkinState) => void;
  postShave: boolean;
  onPostShaveChange: (v: boolean) => void;
}

const TONES: Record<string, { bg: string; text: string; ring: string }> = {
  good: {
    bg: "bg-[--color-good]/10",
    text: "text-[--color-good]",
    ring: "ring-[--color-good]/40",
  },
  warn: {
    bg: "bg-[--color-warn]/10",
    text: "text-[--color-warn]",
    ring: "ring-[--color-warn]/40",
  },
  bad: {
    bg: "bg-[--color-bad]/10",
    text: "text-[--color-bad]",
    ring: "ring-[--color-bad]/40",
  },
  default: {
    bg: "bg-[--color-surface-2]",
    text: "text-[--color-text]",
    ring: "ring-[--color-border-strong]",
  },
};

export function StateSelector({
  value,
  onChange,
  postShave,
  onPostShaveChange,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[--color-dim] text-[11px] uppercase tracking-[0.18em] mb-3">
          Como está sua pele hoje
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SKIN_STATES.map((s) => {
            const active = value === s.id;
            const tone = TONES[s.tone] ?? TONES.default;
            return (
              <button
                key={s.id}
                onClick={() => onChange(s.id)}
                className={`rounded-2xl py-3.5 text-[15px] font-medium transition active:scale-[0.98] ${
                  active
                    ? `${tone.bg} ${tone.text} ring-1 ${tone.ring}`
                    : "bg-[--color-surface] text-[--color-muted] ring-soft hover:text-[--color-text]"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => onPostShaveChange(!postShave)}
        className={`w-full rounded-2xl py-3 px-4 flex items-center justify-between transition active:scale-[0.99] ${
          postShave
            ? "bg-[--color-warn]/10 ring-1 ring-[--color-warn]/40"
            : "bg-[--color-surface] ring-soft"
        }`}
      >
        <span className={`text-[14px] ${postShave ? "text-[--color-warn]" : "text-[--color-muted]"}`}>
          Fiz a barba hoje
        </span>
        <span
          className={`w-10 h-6 rounded-full relative transition ${
            postShave ? "bg-[--color-warn]" : "bg-[--color-border-strong]"
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-[--color-bg] transition ${
              postShave ? "left-[18px]" : "left-0.5"
            }`}
          />
        </span>
      </button>
    </div>
  );
}
