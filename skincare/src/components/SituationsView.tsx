import { useEffect, useState } from "react";
import {
  addPhoto,
  createSituation,
  deletePhoto,
  deleteSituation,
  getSituation,
  listSituations,
  updateSituation,
} from "../lib/api.ts";
import { formatShortDate, formatTimeAgo } from "../lib/image.ts";
import {
  SITUATION_CATEGORIES,
  SITUATION_CATEGORY_LABELS,
  type Situation,
  type SituationCategory,
  type SituationPhoto,
  type SituationWithCover,
} from "../lib/types.ts";
import { AuthedImage } from "./AuthedImage.tsx";
import { PhotoCapture } from "./PhotoCapture.tsx";

interface Props {
  onClose: () => void;
  onChange: () => void;
}

type View =
  | { mode: "list" }
  | { mode: "new" }
  | { mode: "detail"; situationId: number };

export function SituationsView({ onClose, onChange }: Props) {
  const [view, setView] = useState<View>({ mode: "list" });
  const [situations, setSituations] = useState<SituationWithCover[] | null>(
    null,
  );

  async function load() {
    const r = await listSituations();
    setSituations(r.situations);
  }

  useEffect(() => {
    void load();
  }, []);

  function backToList() {
    setView({ mode: "list" });
    void load();
    onChange();
  }

  return (
    <div
      role="dialog"
      aria-label="Situações"
      className="fixed inset-0 bg-gradient-aurora z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto px-6 pt-14 pb-20">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={view.mode === "list" ? onClose : backToList}
            className="press shadow-card min-h-12 px-4 inline-flex items-center justify-center gap-1 rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2] text-sm font-semibold"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 12L6 8l4-4" />
            </svg>
            {view.mode === "list" ? "Fechar" : "Voltar"}
          </button>
          <h2 className="font-display text-xl font-bold text-[--color-text] tracking-tight">
            {view.mode === "list"
              ? "Situações"
              : view.mode === "new"
                ? "Nova"
                : "Detalhe"}
          </h2>
          <span className="min-w-12" aria-hidden="true" />
        </div>

        {view.mode === "list" ? (
          <ListView
            situations={situations}
            onNew={() => setView({ mode: "new" })}
            onOpen={(id) => setView({ mode: "detail", situationId: id })}
          />
        ) : view.mode === "new" ? (
          <NewSituationForm
            onCancel={backToList}
            onCreated={(id) => setView({ mode: "detail", situationId: id })}
          />
        ) : (
          <DetailView
            situationId={view.situationId}
            onClose={backToList}
          />
        )}
      </div>
    </div>
  );
}

function ListView({
  situations,
  onNew,
  onOpen,
}: {
  situations: SituationWithCover[] | null;
  onNew: () => void;
  onOpen: (id: number) => void;
}) {
  return (
    <>
      <button
        onClick={onNew}
        className="press w-full mb-6 min-h-[56px] inline-flex items-center justify-center gap-2 rounded-[--radius-md] bg-[--color-primary] text-[--color-primary-on] text-base font-bold tracking-tight shadow-glow"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
        Nova situação
      </button>

      {situations === null ? (
        <div className="text-[--color-text-3] text-sm">Carregando…</div>
      ) : situations.length === 0 ? (
        <div className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-10 text-center">
          <p className="text-[--color-text-2] text-sm">
            Nenhuma situação. Comece tirando uma foto do que você quer
            acompanhar (espinha, pelo encravado, mancha, etc).
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {situations.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onOpen(s.id)}
                className="press w-full text-left shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] overflow-hidden flex items-stretch gap-4"
              >
                <div className="w-24 h-24 flex-shrink-0 bg-[--color-surface-2]">
                  {s.cover ? (
                    <AuthedImage
                      r2Key={s.cover.r2_key}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[--color-text-muted]">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="6" width="18" height="14" rx="2" />
                        <circle cx="12" cy="13" r="3" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 py-4 pr-4 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[--color-text-3]">
                      {SITUATION_CATEGORY_LABELS[s.category]}
                    </span>
                    {s.status === "resolved" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-[--radius-pill] text-[9px] font-bold uppercase tracking-wider bg-[--color-success]/15 text-[--color-success]">
                        Resolvida
                      </span>
                    ) : null}
                  </div>
                  <div className="text-base font-bold text-[--color-text] tracking-tight truncate">
                    {s.title}
                  </div>
                  <div className="text-xs text-[--color-text-3] font-medium">
                    {s.status === "active"
                      ? `há ${formatTimeAgo(s.started_at)}`
                      : `resolvida em ${formatShortDate(s.resolved_at ?? s.updated_at)}`}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function NewSituationForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SituationCategory>("acne");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Dê um título pra reconhecer depois.");
      return;
    }
    setSaving(true);
    try {
      const r = await createSituation({
        title: title.trim(),
        category,
        notes: notes.trim() || undefined,
      });
      onCreated(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-6 space-y-5">
        <Field label="Título">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Espinha bochecha esq."
            autoFocus
            className="press w-full min-h-12 bg-[--color-surface-2] border border-[--color-border] rounded-[--radius-sm] px-4 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </Field>

        <Field label="Categoria">
          <div className="grid grid-cols-2 gap-2">
            {SITUATION_CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`press min-h-11 px-3 rounded-[--radius-sm] text-sm font-bold tracking-tight ${
                    active
                      ? "bg-[--color-primary] text-[--color-primary-on]"
                      : "bg-[--color-surface-2] text-[--color-text-2] border border-[--color-border]"
                  }`}
                >
                  {SITUATION_CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto, suspeita de causa, etc."
            rows={2}
            className="press w-full bg-[--color-surface-2] border border-[--color-border] rounded-[--radius-sm] px-4 py-3 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary] resize-none"
          />
        </Field>

        {error ? (
          <div
            role="alert"
            className="bg-[--color-surface-2] border border-[--color-danger]/50 rounded-[--radius-sm] px-4 py-3 text-sm text-[--color-danger] font-medium"
          >
            {error}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="press w-full min-h-[60px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-[--color-primary-on] text-base font-bold tracking-tight shadow-glow disabled:opacity-50"
        >
          {saving ? "Criando…" : "Criar e tirar foto"}
        </button>
        <button
          onClick={onCancel}
          className="press w-full min-h-11 text-[--color-text-3] text-sm font-semibold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function DetailView({
  situationId,
  onClose,
}: {
  situationId: number;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    situation: Situation;
    photos: SituationPhoto[];
  } | null>(null);
  const [caption, setCaption] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await getSituation(situationId);
    setData(r);
  }

  useEffect(() => {
    void load();
  }, [situationId]);

  async function handleCapture(dataUrl: string) {
    setPendingPhoto(dataUrl);
  }

  async function handleSavePhoto() {
    if (!pendingPhoto) return;
    setSaving(true);
    try {
      await addPhoto(situationId, pendingPhoto, caption || undefined);
      setPendingPhoto(null);
      setCaption("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!data) return;
    const next = data.situation.status === "active" ? "resolved" : "active";
    await updateSituation(situationId, { status: next });
    await load();
  }

  async function handleDelete() {
    if (!data) return;
    if (!confirm(`Excluir "${data.situation.title}" e todas as fotos?`)) return;
    await deleteSituation(situationId);
    onClose();
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm("Excluir esta foto?")) return;
    await deletePhoto(situationId, photoId);
    await load();
  }

  if (!data) {
    return <div className="text-[--color-text-3] text-sm">Carregando…</div>;
  }

  const s = data.situation;
  const isResolved = s.status === "resolved";

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-[--color-text-3]">
            {SITUATION_CATEGORY_LABELS[s.category]}
          </span>
          {isResolved ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-pill] text-[10px] font-bold uppercase tracking-wider bg-[--color-success]/15 text-[--color-success]">
              Resolvida
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-pill] text-[10px] font-bold uppercase tracking-wider bg-[--color-primary]/15 text-[--color-primary]">
              Ativa há {formatTimeAgo(s.started_at)}
            </span>
          )}
        </div>
        <h3 className="font-display text-2xl font-bold text-[--color-text] tracking-tight">
          {s.title}
        </h3>
        {s.notes ? (
          <p className="text-sm text-[--color-text-2]">{s.notes}</p>
        ) : null}
      </header>

      {pendingPhoto ? (
        <div className="shadow-card bg-[--color-surface] border border-[--color-primary]/40 rounded-[--radius-lg] overflow-hidden">
          <img
            src={pendingPhoto}
            alt="Pré-visualização"
            className="w-full aspect-square object-cover"
          />
          <div className="p-4 space-y-3">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Legenda (opcional)"
              className="press w-full min-h-11 bg-[--color-surface-2] border border-[--color-border] rounded-[--radius-sm] px-4 text-sm text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setPendingPhoto(null);
                  setCaption("");
                }}
                className="press min-h-11 rounded-[--radius-sm] bg-[--color-surface-2] border border-[--color-border] text-sm font-semibold text-[--color-text-2]"
              >
                Descartar
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={saving}
                className="press min-h-11 rounded-[--radius-sm] bg-[--color-primary] text-[--color-primary-on] text-sm font-bold disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Salvar foto"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <PhotoCapture
          label={data.photos.length === 0 ? "Tirar primeira foto" : "Adicionar foto"}
          hint="Câmera do iPhone se você estiver no mobile"
          onCapture={handleCapture}
        />
      )}

      {data.photos.length > 0 ? (
        <section aria-label="Linha do tempo" className="space-y-3">
          <div className="text-[11px] font-bold text-[--color-text-3] uppercase tracking-[0.2em]">
            Linha do tempo · {data.photos.length}
          </div>
          <ul className="space-y-4">
            {data.photos.map((p, i) => {
              const previous = data.photos[i + 1];
              const sinceDays =
                previous != null
                  ? Math.max(
                      0,
                      Math.round(
                        (p.created_at - previous.created_at) /
                          (1000 * 60 * 60 * 24),
                      ),
                    )
                  : null;
              return (
                <li
                  key={p.id}
                  className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] overflow-hidden"
                >
                  <div className="aspect-square w-full bg-[--color-surface-2]">
                    <AuthedImage
                      r2Key={p.r2_key}
                      alt={p.caption ?? `Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[--color-text-3]">
                        <span>{formatShortDate(p.created_at)}</span>
                        <span
                          className="w-0.5 h-0.5 rounded-full bg-[--color-text-muted]"
                          aria-hidden="true"
                        />
                        <span>{formatTimeAgo(p.created_at)}</span>
                        {sinceDays !== null && sinceDays > 0 ? (
                          <>
                            <span
                              className="w-0.5 h-0.5 rounded-full bg-[--color-text-muted]"
                              aria-hidden="true"
                            />
                            <span>+{sinceDays}d</span>
                          </>
                        ) : null}
                      </div>
                      {p.caption ? (
                        <p className="text-sm text-[--color-text-2] font-medium">
                          {p.caption}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="press text-xs text-[--color-text-3] font-semibold"
                      aria-label="Excluir foto"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="space-y-2 pt-2">
        <button
          onClick={handleToggleStatus}
          className="press w-full min-h-12 rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2] text-sm font-semibold"
        >
          {isResolved ? "Reabrir situação" : "Marcar como resolvida"}
        </button>
        <button
          onClick={handleDelete}
          className="press w-full min-h-11 text-[--color-danger] text-sm font-semibold"
        >
          Excluir situação
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-bold text-[--color-text-3] uppercase tracking-[0.16em]">
        {label}
      </div>
      {children}
    </div>
  );
}
