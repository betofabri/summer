import { useEffect, useState } from "react";
import {
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
  type Category,
  type Product,
  type ProductInput,
} from "../lib/types.ts";

interface Props {
  onClose: () => void;
  onChange: () => void;
}

type EditState =
  | { mode: "list" }
  | { mode: "new" }
  | { mode: "edit"; product: Product };

export function ProductsView({ onClose, onChange }: Props) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [edit, setEdit] = useState<EditState>({ mode: "list" });

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
      className="fixed inset-0 bg-gradient-aurora z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto px-6 pt-14 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-[--color-text] tracking-tight">
            Produtos
          </h2>
          <button
            onClick={onClose}
            className="press shadow-card min-h-12 px-5 inline-flex items-center justify-center rounded-[--radius-md] bg-[--color-surface] border border-[--color-border] text-[--color-text-2] text-sm font-semibold"
          >
            Fechar
          </button>
        </div>

        {edit.mode === "new" ? (
          <ProductForm
            onCancel={() => setEdit({ mode: "list" })}
            onSaved={async () => {
              setEdit({ mode: "list" });
              await load();
              onChange();
            }}
          />
        ) : edit.mode === "edit" ? (
          <ProductForm
            product={edit.product}
            onCancel={() => setEdit({ mode: "list" })}
            onSaved={async () => {
              setEdit({ mode: "list" });
              await load();
              onChange();
            }}
          />
        ) : (
          <>
            <button
              onClick={() => setEdit({ mode: "new" })}
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
              Adicionar produto
            </button>

            {products === null ? (
              <div className="text-[--color-text-3] text-sm">Carregando…</div>
            ) : products.length === 0 ? (
              <div className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-10 text-center">
                <p className="text-[--color-text-2] text-sm">
                  Nenhum produto. Adicione o primeiro.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className={`shadow-card rounded-[--radius-lg] border ${
                      p.enabled
                        ? "bg-[--color-surface] border-[--color-border]"
                        : "bg-[--color-surface]/50 border-[--color-border]/50"
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
                              : "bg-[--color-surface-3]"
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
  onCancel,
  onSaved,
}: {
  product?: Product;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [category, setCategory] = useState<Category>(
    product?.category ?? "hidratacao",
  );
  const [actives, setActives] = useState<Set<Active>>(
    new Set((product?.actives as Active[]) ?? []),
  );
  const [intensity, setIntensity] = useState<1 | 2 | 3>(
    product?.intensity ?? 1,
  );
  const [notes, setNotes] = useState(product?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!confirm(`Excluir "${product.name}"? Não dá pra desfazer.`)) return;
    setSaving(true);
    try {
      await apiDelete(product.id);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="shadow-card bg-[--color-surface] border border-[--color-border] rounded-[--radius-lg] p-6 space-y-5">
        <div className="text-[11px] font-bold text-[--color-primary] uppercase tracking-[0.2em]">
          {product ? "Editar produto" : "Novo produto"}
        </div>

        <Field label="Nome">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Effaclar Serum"
            className="press w-full min-h-12 bg-[--color-surface-2] border border-[--color-border] rounded-[--radius-sm] px-4 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
          />
        </Field>

        <Field label="Marca">
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ex: La Roche-Posay"
            className="press w-full min-h-12 bg-[--color-surface-2] border border-[--color-border] rounded-[--radius-sm] px-4 text-base text-[--color-text] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-primary]"
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
                      ? "bg-[--color-primary] text-[--color-primary-on]"
                      : "bg-[--color-surface-2] text-[--color-text-2] border border-[--color-border]"
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
                      ? "bg-[--color-primary] text-[--color-primary-on]"
                      : "bg-[--color-surface-2] text-[--color-text-2] border border-[--color-border]"
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
                      ? "bg-[--color-primary] text-[--color-primary-on]"
                      : "bg-[--color-surface-2] text-[--color-text-2] border border-[--color-border]"
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
            onClick={handleDelete}
            disabled={saving}
            className="press w-full min-h-11 text-[--color-danger] text-sm font-semibold disabled:opacity-50"
          >
            Excluir produto
          </button>
        ) : null}
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
