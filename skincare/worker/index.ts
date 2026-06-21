import {
  addSituationPhoto,
  createProduct,
  createSituation,
  deleteProduct,
  deleteSituation,
  deleteSituationPhoto,
  getDailyLog,
  getHistory,
  getLatestPhotoForSituation,
  getSituation,
  listActiveSituations,
  listAllProducts,
  listProducts,
  listSituationPhotos,
  listSituations,
  markRoutineApplied,
  saveRoutine,
  updateProduct,
  updateSituation,
  upsertDailyLog,
} from "./db.ts";
import { suggest } from "./suggest.ts";
import { analyzeProductPhoto } from "./vision.ts";
import type {
  Active,
  Category,
  Product,
  SituationCategory,
  SituationStatus,
  SkinState,
  SuggestRequest,
} from "./types.ts";

interface AppEnv extends Env {
  GEMINI_API_KEY: string;
  ACCESS_TOKEN: string;
  PHOTOS: R2Bucket;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

function err(status: number, message: string): Response {
  return json({ error: message }, { status });
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function authorized(
  request: Request,
  expectedToken: string,
): Promise<boolean> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const provided = auth.slice(7);
  const encoder = new TextEncoder();
  const a = encoder.encode(provided);
  const b = encoder.encode(expectedToken);
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const VALID_STATES: SkinState[] = [
  "normal",
  "oleosa",
  "irritada",
  "acne_ativa",
];

const PREFIX = "/summer/skincare";

function strip(pathname: string): string {
  if (pathname === PREFIX) return "/";
  if (pathname.startsWith(PREFIX + "/")) return pathname.slice(PREFIX.length);
  return pathname;
}

export default {
  async fetch(request: Request, env: AppEnv): Promise<Response> {
    const url = new URL(request.url);
    const path = strip(url.pathname);

    if (!path.startsWith("/api/")) {
      if (path !== url.pathname) {
        const innerUrl = new URL(request.url);
        innerUrl.pathname = path;
        return env.ASSETS.fetch(new Request(innerUrl, request));
      }
      return env.ASSETS.fetch(request);
    }

    if (!(await authorized(request, env.ACCESS_TOKEN))) {
      return err(401, "unauthorized");
    }

    try {
      if (path === "/api/bootstrap" && request.method === "GET") {
        const [products, today, yesterday, history, activeSituations] =
          await Promise.all([
            listProducts(env.DB),
            getDailyLog(env.DB, todayDate()),
            getDailyLog(env.DB, yesterdayDate()),
            getHistory(env.DB, 7),
            listActiveSituations(env.DB),
          ]);
        const yesterdayRoutine =
          history.find((h) => h.daily.date === yesterdayDate())?.routine ??
          null;
        const situationsWithCover = await Promise.all(
          activeSituations.map(async (s) => {
            const cover = await getLatestPhotoForSituation(env.DB, s.id);
            return { ...s, cover };
          }),
        );
        return json({
          today_date: todayDate(),
          products,
          today,
          yesterday,
          yesterday_routine: yesterdayRoutine,
          active_situations: situationsWithCover,
        });
      }

      if (path === "/api/log" && request.method === "POST") {
        const body = (await request.json()) as {
          skin_state: string;
          post_shave: boolean;
          notes?: string;
        };
        if (!VALID_STATES.includes(body.skin_state as SkinState)) {
          return err(400, "invalid skin_state");
        }
        await upsertDailyLog(env.DB, {
          date: todayDate(),
          skin_state: body.skin_state as SkinState,
          post_shave: Boolean(body.post_shave),
          notes: body.notes ?? null,
        });
        return json({ ok: true });
      }

      if (path === "/api/suggest" && request.method === "POST") {
        const body = (await request.json()) as SuggestRequest;
        if (!VALID_STATES.includes(body.skin_state)) {
          return err(400, "invalid skin_state");
        }
        const result = await suggest(env.DB, env.GEMINI_API_KEY, body);
        const id = await saveRoutine(
          env.DB,
          todayDate(),
          result.product_ids,
          result.reasoning,
          false,
        );
        return json({ ...result, routine_id: id });
      }

      if (path === "/api/apply" && request.method === "POST") {
        const body = (await request.json()) as {
          routine_id: number;
          product_ids: string[];
        };
        await markRoutineApplied(env.DB, body.routine_id, body.product_ids);
        return json({ ok: true });
      }

      if (path === "/api/history" && request.method === "GET") {
        const history = await getHistory(env.DB, 30);
        return json({ history });
      }

      if (path === "/api/products" && request.method === "GET") {
        const products = await listAllProducts(env.DB);
        return json({ products });
      }

      if (path === "/api/products" && request.method === "POST") {
        const body = (await request.json()) as Partial<Product>;
        if (
          !body.name?.trim() ||
          !body.brand?.trim() ||
          !body.category ||
          !body.actives ||
          !body.intensity
        ) {
          return err(400, "campos obrigatórios faltando");
        }
        const baseId = body.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 40);
        const suffix = crypto.randomUUID().slice(0, 4);
        const id = `${baseId}-${suffix}`;
        await createProduct(env.DB, {
          id,
          name: body.name.trim(),
          brand: body.brand.trim(),
          category: body.category as Category,
          actives: body.actives as Active[],
          intensity: body.intensity as 1 | 2 | 3,
          notes: body.notes?.trim() || null,
          enabled: body.enabled !== false,
        });
        return json({ id });
      }

      if (
        path.startsWith("/api/products/") &&
        request.method === "PATCH"
      ) {
        const id = path.slice("/api/products/".length);
        const body = (await request.json()) as Partial<Product>;
        await updateProduct(env.DB, id, body);
        return json({ ok: true });
      }

      if (
        path.startsWith("/api/products/") &&
        request.method === "DELETE"
      ) {
        const id = path.slice("/api/products/".length);
        await deleteProduct(env.DB, id);
        return json({ ok: true });
      }

      if (path === "/api/products/analyze" && request.method === "POST") {
        const body = (await request.json()) as { image?: string };
        if (!body.image) return err(400, "imagem ausente");
        const analyzed = await analyzeProductPhoto(
          env.GEMINI_API_KEY,
          body.image,
        );
        return json(analyzed);
      }

      if (path === "/api/situations" && request.method === "GET") {
        const situations = await listSituations(env.DB);
        const withCovers = await Promise.all(
          situations.map(async (s) => {
            const cover = await getLatestPhotoForSituation(env.DB, s.id);
            return { ...s, cover };
          }),
        );
        return json({ situations: withCovers });
      }

      if (path === "/api/situations" && request.method === "POST") {
        const body = (await request.json()) as {
          title?: string;
          category?: SituationCategory;
          notes?: string;
        };
        if (!body.title?.trim() || !body.category) {
          return err(400, "campos obrigatórios faltando");
        }
        const id = await createSituation(env.DB, {
          title: body.title.trim(),
          category: body.category,
          notes: body.notes?.trim() ?? null,
        });
        return json({ id });
      }

      const situationMatch = /^\/api\/situations\/(\d+)(\/photos(?:\/(\d+))?)?$/.exec(
        path,
      );
      if (situationMatch) {
        const id = Number(situationMatch[1]);
        const isPhotos = Boolean(situationMatch[2]);
        const photoId = situationMatch[3] ? Number(situationMatch[3]) : null;

        if (!isPhotos) {
          if (request.method === "GET") {
            const situation = await getSituation(env.DB, id);
            if (!situation) return err(404, "situação não encontrada");
            const photos = await listSituationPhotos(env.DB, id);
            return json({ situation, photos });
          }
          if (request.method === "PATCH") {
            const body = (await request.json()) as {
              title?: string;
              category?: SituationCategory;
              status?: SituationStatus;
              notes?: string | null;
            };
            await updateSituation(env.DB, id, body);
            return json({ ok: true });
          }
          if (request.method === "DELETE") {
            const r2Keys = await deleteSituation(env.DB, id);
            await Promise.all(r2Keys.map((k) => env.PHOTOS.delete(k)));
            return json({ ok: true });
          }
        } else if (photoId !== null) {
          if (request.method === "DELETE") {
            const r2Key = await deleteSituationPhoto(env.DB, photoId);
            if (r2Key) await env.PHOTOS.delete(r2Key);
            return json({ ok: true });
          }
        } else {
          if (request.method === "POST") {
            const body = (await request.json()) as {
              image?: string;
              caption?: string;
            };
            if (!body.image) return err(400, "imagem ausente");
            const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(body.image);
            if (!m) return err(400, "imagem inválida");
            const [, mimeType, base64] = m;
            const bytes = Uint8Array.from(atob(base64), (c) =>
              c.charCodeAt(0),
            );
            const ext = mimeType.split("/")[1].split("+")[0];
            const key = `situations/${id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
            await env.PHOTOS.put(key, bytes, {
              httpMetadata: { contentType: mimeType },
            });
            const photoId = await addSituationPhoto(env.DB, {
              situation_id: id,
              r2_key: key,
              caption: body.caption?.trim() ?? null,
            });
            return json({ id: photoId, r2_key: key });
          }
        }
      }

      if (path.startsWith("/api/photos/") && request.method === "GET") {
        const key = decodeURIComponent(path.slice("/api/photos/".length));
        const obj = await env.PHOTOS.get(key);
        if (!obj) return err(404, "foto não encontrada");
        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set("Cache-Control", "private, max-age=3600");
        return new Response(obj.body, { headers });
      }

      return err(404, "not found");
    } catch (e) {
      const message = e instanceof Error ? e.message : "internal error";
      console.error({ path, error: message });
      if (message === "OVERLOADED") {
        return err(
          503,
          "Gemini está sobrecarregado agora. Tenta de novo em alguns segundos.",
        );
      }
      if (message === "AI_PARSE_ERROR") {
        return err(
          502,
          "A IA respondeu em formato inválido. Tenta de novo.",
        );
      }
      return err(500, message);
    }
  },
} satisfies ExportedHandler<AppEnv>;
