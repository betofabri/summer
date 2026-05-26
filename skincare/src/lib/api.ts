import type {
  BootstrapResponse,
  HistoryEntry,
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("No token");
  const res = await fetch(path, {
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
  return request("/api/bootstrap");
}

export function logDaily(input: {
  skin_state: SkinState;
  post_shave: boolean;
  notes?: string;
}): Promise<{ ok: true }> {
  return request("/api/log", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function suggest(input: {
  skin_state: SkinState;
  post_shave: boolean;
  notes?: string;
}): Promise<SuggestResponse> {
  return request("/api/suggest", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function applyRoutine(
  routine_id: number,
  product_ids: string[],
): Promise<{ ok: true }> {
  return request("/api/apply", {
    method: "POST",
    body: JSON.stringify({ routine_id, product_ids }),
  });
}

export function history(): Promise<{ history: HistoryEntry[] }> {
  return request("/api/history");
}
