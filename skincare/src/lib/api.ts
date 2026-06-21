import type {
  AnalyzedProduct,
  BootstrapResponse,
  HistoryEntry,
  Product,
  ProductInput,
  Situation,
  SituationCategory,
  SituationPhoto,
  SituationStatus,
  SituationWithCover,
  SkinState,
  SuggestResponse,
} from "./types.ts";

const TOKEN_KEY = "skincare-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

const API_BASE = `${import.meta.env.BASE_URL}api`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("No token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    if (res.status === 401) clearToken();
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function bootstrap(): Promise<BootstrapResponse> {
  return request("/bootstrap");
}

export function logDaily(input: {
  skin_state: SkinState;
  post_shave: boolean;
  notes?: string;
}): Promise<{ ok: true }> {
  return request("/log", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function suggest(input: {
  skin_state: SkinState;
  post_shave: boolean;
  notes?: string;
}): Promise<SuggestResponse> {
  return request("/suggest", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function applyRoutine(
  routine_id: number,
  product_ids: string[],
): Promise<{ ok: true }> {
  return request("/apply", {
    method: "POST",
    body: JSON.stringify({ routine_id, product_ids }),
  });
}

export function history(): Promise<{ history: HistoryEntry[] }> {
  return request("/history");
}

export function listProducts(): Promise<{ products: Product[] }> {
  return request("/products");
}

export function createProduct(input: ProductInput): Promise<{ id: string }> {
  return request("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  id: string,
  updates: Partial<ProductInput> & { enabled?: boolean },
): Promise<{ ok: true }> {
  return request(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteProduct(id: string): Promise<{ ok: true }> {
  return request(`/products/${id}`, {
    method: "DELETE",
  });
}

export function analyzeProductPhoto(
  image: string,
): Promise<AnalyzedProduct> {
  return request("/products/analyze", {
    method: "POST",
    body: JSON.stringify({ image }),
  });
}

export function listSituations(): Promise<{ situations: SituationWithCover[] }> {
  return request("/situations");
}

export function getSituation(
  id: number,
): Promise<{ situation: Situation; photos: SituationPhoto[] }> {
  return request(`/situations/${id}`);
}

export function createSituation(input: {
  title: string;
  category: SituationCategory;
  notes?: string;
}): Promise<{ id: number }> {
  return request("/situations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateSituation(
  id: number,
  updates: {
    title?: string;
    category?: SituationCategory;
    status?: SituationStatus;
    notes?: string | null;
  },
): Promise<{ ok: true }> {
  return request(`/situations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function deleteSituation(id: number): Promise<{ ok: true }> {
  return request(`/situations/${id}`, { method: "DELETE" });
}

export function addPhoto(
  situationId: number,
  image: string,
  caption?: string,
): Promise<{ id: number; r2_key: string }> {
  return request(`/situations/${situationId}/photos`, {
    method: "POST",
    body: JSON.stringify({ image, caption }),
  });
}

export function deletePhoto(
  situationId: number,
  photoId: number,
): Promise<{ ok: true }> {
  return request(`/situations/${situationId}/photos/${photoId}`, {
    method: "DELETE",
  });
}

export function photoUrl(r2Key: string): string {
  return `${import.meta.env.BASE_URL}api/photos/${encodeURIComponent(r2Key)}`;
}

export async function fetchPhotoBlob(r2Key: string): Promise<string> {
  const token = getToken();
  if (!token) throw new Error("No token");
  const res = await fetch(photoUrl(r2Key), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
