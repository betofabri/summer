import { useEffect, useState } from "react";
import {
  analyzeProductPhoto,
  createProduct as apiCreate,
  deleteProduct as apiDelete,
  listProducts,
  updateProduct as apiUpdate,
} from "../lib/api.ts";
import {
  ACTIVES,
  ACTIVE_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  INTENSITY_LABELS,
  type Active,
  type AnalyzedProduct,
  type Category,
  type Product,
  type ProductInput,
} from "../lib/types.ts";
import { ConfirmSheet } from "./ConfirmSheet.tsx";
import { PhotoCapture } from "./PhotoCapture.tsx";

interface Props {
  onClose: () => void;
  onChange: () => void;
}

type EditState =
  | { mode: "list" }
  | { mode: "new"; prefill?: Partial<ProductInput> }
  | { mode: "analyzing" }
  | { mode: "edit"; product: Product };

export function ProductsView({ onClose, onChange }: Props) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [edit, setEdit] = useState<EditState>({ mode: "list" });
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function load() {
    const r = await listProducts();
    setProducts(r.products);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleToggle(p: Product) {
    setProducts(
      (curr) =>
        curr?.map((x) =>
          x.id === p.id ? { ...x, enabled: !p.enabled } : x,
        ) ?? null,
    );
    await apiUpdate(p.id, { enabled: !p.enabled });
    onChange();
  }

  return (
    <div
      role="dialog"
      aria-label="Produtos"
      className="anim-backdrop fixed inset-0 bg-gradient-aurora z-50 overflow-y-auto"
    >
      <div className="anim-sheet max-w-md mx-auto px-6 pt-14 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-[--color-text] tracking-tight">
            Produtos
          </h2>
          <button
            onClick={onClose}
            className="press min-h-12 px-5 inline-flex items-center justify-center rounded-[--radius-md] glass text-[--color-text-2] text-sm font-semibold"
          >
            Fechar
          </button>
        </div>

        {edit.mode === "analyzing" ? (
          <div className="glass shadow-glass rounded-[--radius-lg] px-6 py-16 flex flex-col items-center gap-5">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-[--color-primary] animate-glow-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
            <div className="text-[--color-text-2] text-sm font-medium text-center">
              Lendo a embalagem…
            </div>
          </div>
        ) : edit.mode === "new" || edit.mode === "edit" ? (
          <ProductForm
            product={edit.mode === "edit" ? edit.product : undefined}
            prefill={edit.mode === "new" ? edit.prefill : undefined}
            onCancel={() => setEdit({ mode: "list" })}
            onSaved={async () => {
              setEdit({ mode: "list" });
              await load();
              onChange();
            }}
          />
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {analyzeError ? (
                <div
                  role="alert"
                  className="anim-fade-up glass border-[--color-danger]/40 rounded-[--radius-md] px-4 py-3 text-sm text-[--color-danger] font-medium"
                >
                  {analyzeError}
                </div>
              ) : null}
              <PhotoCapture
                label="Adicionar por foto"
                hint="Câmera ou galeria do celular"
                onCapture={async (dataUrl) => {
                  setAnalyzeError(null);
                  setEdit({ mode: "analyzing" });
                  try {
                    const analyzed: AnalyzedProduct =
                      await analyzeProductPhoto(dataUrl);
                    setEdit({
                      mode: "new",
                      prefill: {
                        name: analyzed.name,
                        brand: analyzed.brand,
                        category:
                          (analyzed.category as Category) || "hidratacao",
                        actives: analyzed.actives,
                        intensity: analyzed.intensity,
                        notes: analyzed.notes,
                      },
                    });
                  } catch (e) {
                    setAnalyzeError(
                      e instanceof Error && e.message.length < 80
                        ? `Não consegui ler a embalagem (${e.message}). Tenta outra foto ou adiciona manualmente.`
                        : "Não consegui ler a embalagem. Tenta outra foto ou adiciona manualmente.",
                    );
                    setEdit({ mode: "list" });
                  }
                }}
              />
              <button
                onClick={() => setEdit({ mode: "new" })}
                className="press w-full min-h-12 inline-flex items-center justify-center gap-2 rounded-[--radius-md] glass text-[--color-text-2] text-sm font-semibold"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M8 3v10M3 8h10" />
                </svg>
                Adicionar manualmente
              </button>
            </div>

            {products === null ? (
              <div className="text-[--color-text-3] text-sm">Carregando…</div>
            ) : products.length === 0 ? (
              <div className="glass shadow-glass rounded-[--radius-lg] p-10 text-center">
                <p className="text-[--color-text-2] text-sm">
                  Nenhum produto. Adicione o primeiro.
                </p>
              </div>
            ) : (
              <ul className="stagger space-y-3">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className={`rounded-[--radius-lg] ${
                      p.enabled ? "glass shadow-glass" : "glass-soft opacity-60"
                    }`}
                  >
                    <div className="p-5 flex items-start gap-4">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div
                          className={`font-bold tracking-tight text-base truncate ${
                            p.enabled
                              ? "text-[--color-text]"
                              : "text-[--color-text-3]"
                          }`}
                        >
                          {p.name}
                        </div>
                        <div className="text-xs text-[--color-text-3] flex items-center gap-2 font-medium">
                          <span>{p.brand}</span>
                          <span
                            className="w-1 h-1 rounded-full bg-[--color-text-muted]"
                            aria-hidden="true"
                          />
                          <span>{CATEGORY_LABELS[p.category]}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(p)}
                        role="switch"
                        aria-checked={p.enabled}
                        aria-label={p.enabled ? "Desativar" : "Ativar"}
                        className="press flex-shrink-0"
                      >
                        <span
                          className={`relative block w-12 h-7 rounded-full transition-colors ${
                            p.enabled
                              ? "bg-[--color-primary]"
                              : "glass-soft"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                              p.enabled ? "left-[22px]" : "left-0.5"
                            }`}
                          />
                        </span>
                      </button>
                    </div>
                    <div className="px-5 pb-4 -mt-1 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setEdit({ mode: "edit", product: p })}
                        className="press text-xs font-semibold text-[--color-text-3] hover:text-[--color-primary]"
                      >
                        Editar
                      </button>
                      {!p.enabled ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold text-[--color-text-muted]">
                          Inativo
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductForm({
  product,
  prefill,
  onCancel,
  onSaved,
}: {
  product?: Product;
  prefill?: Partial<ProductInput>;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const source = product ?? prefill;
  const [name, setName] = useState(source?.name ?? "");
  const [brand, setBrand] = useState(source?.brand ?? "");
  const [category, setCategory] = useState<Category>(
    (source?.category as Category) ?? "hidratacao",
  );
  const [actives, setActives] = useState<Set<Active>>(
    new Set((source?.actives as Active[]) ?? []),
  );
  const [intensity, setIntensity] = useState<1 | 2 | 3>(
    (source?.intensity as 1 | 2 | 3) ?? 1,
  );
  const [notes, setNotes] = useState(source?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleActive(a: Active) {
    setActives((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    if (!name.trim() || !brand.trim() || actives.size === 0) {
      setError("Preencha nome, marca e pelo menos 1 ativo.");
      return;
    }
    setSaving(true);
    try {
      const payload: ProductInput = {
        name: name.trim(),
        brand: brand.trim(),
        category,
        actives: Array.from(actives),
        intensity,
        notes: notes.trim() || undefined,
      };
      if (product) {
        await apiUpdate(product.id, payload);
      } else {
        await apiCreate(payload);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    setSaving(true);
    try {
      await apiDelete(product.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass shadow-glass rounded-[--radius-lg] p-6 space-y-5">
        <div className="text-[11px] font-bold text-[--color-primary] uppercase tracking-[0.2em]">
          {product ? "Editar produto" : prefill ? "Confira e salve" : "Novo produto"}
        </div>

        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Effaclar Serum"
            className="press w-full min-h-12 glass-soft rounded-[--radius-sm] px-4 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </Field>

        <Field label="Marca">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ex: La Roche-Posay"
            className="press w-full min-h-12 glass-soft rounded-[--radius-sm] px-4 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </Field>

        <Field label="Categoria">
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`press min-h-11 px-3 rounded-[--radius-sm] text-sm font-bold tracking-tight ${
                    active
                      ? "glass-primary text-[--color-primary-bright] shadow-soft-glow"
                      : "glass-soft text-[--color-text-2]"
                  }`}
                >
                  {CATEGORY_LABELS[c]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Ativos (escolha 1+)">
          <div className="flex flex-wrap gap-2">
            {ACTIVES.map((a) => {
              const isOn = actives.has(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleActive(a)}
                  className={`press min-h-10 px-3.5 rounded-[--radius-pill] text-xs font-bold tracking-tight ${
                    isOn
                      ? "glass-primary text-[--color-primary-bright] shadow-soft-glow"
                      : "glass-soft text-[--color-text-2]"
                  }`}
                >
                  {ACTIVE_LABELS[a]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Intensidade">
          <div className="grid grid-cols-3 gap-2">
            {([1, 2, 3] as const).map((n) => {
              const active = intensity === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIntensity(n)}
                  className={`press min-h-11 rounded-[--radius-sm] text-sm font-bold tracking-tight ${
                    active
                      ? "glass-primary text-[--color-primary-bright] shadow-soft-glow"
                      : "glass-soft text-[--color-text-2]"
                  }`}
                >
                  {INTENSITY_LABELS[n]}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Notas (opcional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre uso, restrições, etc."
            rows={2}
            className="press w-full glass-soft rounded-[--radius-sm] px-4 py-3 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary] resize-none"
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
          className="press w-full min-h-[60px] inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-primary] text-[--color-primary-on] text-base font-bold tracking-tight shadow-soft-glow disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={onCancel}
          className="press w-full min-h-11 text-[--color-text-3] text-sm font-semibold"
        >
          Cancelar
        </button>
        {product ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="press w-full min-h-11 text-[--color-danger] text-sm font-semibold disabled:opacity-50"
          >
            Excluir produto
          </button>
        ) : null}
      </div>

      {confirmDelete && product ? (
        <ConfirmSheet
          title={`Excluir "${product.name}"?`}
          message="O produto sai do catálogo e das próximas sugestões. Não dá pra desfazer."
          confirmLabel="Excluir"
          busy={saving}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      ) : null}
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
