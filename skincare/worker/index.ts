import {
  getDailyLog,
  getHistory,
  listProducts,
  markRoutineApplied,
  saveRoutine,
  upsertDailyLog,
} from "./db.ts";
import { suggest } from "./suggest.ts";
import type { SkinState, SuggestRequest } from "./types.ts";

interface AppEnv extends Env {
  ANTHROPIC_API_KEY: string;
  ACCESS_TOKEN: string;
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
  "calma",
  "oleosa",
  "irritada",
  "acne_ativa",
  "vermelhidao",
  "ressecada",
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
        const [products, today, yesterday, history] = await Promise.all([
          listProducts(env.DB),
          getDailyLog(env.DB, todayDate()),
          getDailyLog(env.DB, yesterdayDate()),
          getHistory(env.DB, 7),
        ]);
        const yesterdayRoutine = history.find((h) => h.daily.date === yesterdayDate())?.routine ?? null;
        return json({
          today_date: todayDate(),
          products,
          today,
          yesterday,
          yesterday_routine: yesterdayRoutine,
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
        const result = await suggest(env.DB, env.ANTHROPIC_API_KEY, body);
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

      return err(404, "not found");
    } catch (e) {
      const message = e instanceof Error ? e.message : "internal error";
      console.error({ path, error: message });
      return err(500, message);
    }
  },
} satisfies ExportedHandler<AppEnv>;
