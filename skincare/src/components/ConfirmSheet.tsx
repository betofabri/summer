interface Props {
  title: string;
  message?: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-end justify-center"
    >
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancelar"
        className="anim-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="anim-sheet relative w-full max-w-md mx-4 mb-8 glass-strong shadow-glass-lift rounded-[--radius-lg] p-6 space-y-5">
        <div className="space-y-1.5">
          <div className="text-base font-bold tracking-tight text-[--color-text]">
            {title}
          </div>
          {message ? (
            <p className="text-sm text-[--color-text-2] leading-relaxed">
              {message}
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="press min-h-12 rounded-[--radius-md] glass text-sm font-semibold text-[--color-text-2]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="press min-h-12 rounded-[--radius-md] bg-[--color-danger] text-[--color-danger-on] text-sm font-bold disabled:opacity-50"
          >
            {busy ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
