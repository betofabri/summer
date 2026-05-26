import type {
  Active,
  Product,
  RoutineLog,
  SkinState,
  SuggestRequest,
  SuggestResponse,
} from "./types.ts";
import { getRecentRoutines, listProducts } from "./db.ts";

const STRONG_ACIDS: Active[] = ["salicylic", "glycolic", "lha"];
const RETINOIDS: Active[] = ["retinol"];

interface FilterContext {
  state: SkinState;
  postShave: boolean;
  usedYesterday: Set<Active>;
  acidsLast2Days: boolean;
  retinolLast2Days: boolean;
}

function buildContext(
  request: SuggestRequest,
  recent: RoutineLog[],
  products: Product[],
): FilterContext {
  const productById = new Map(products.map((p) => [p.id, p]));
  const activesByDate = new Map<string, Set<Active>>();

  for (const routine of recent) {
    const actives = new Set<Active>();
    for (const id of routine.product_ids) {
      const p = productById.get(id);
      if (p) p.actives.forEach((a) => actives.add(a));
    }
    activesByDate.set(routine.date, actives);
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  const yesterdayActives = activesByDate.get(ymd(yesterday)) ?? new Set();
  const twoDaysActives = activesByDate.get(ymd(twoDaysAgo)) ?? new Set();

  const hasAcid = (s: Set<Active>) => STRONG_ACIDS.some((a) => s.has(a));
  const hasRetinol = (s: Set<Active>) => RETINOIDS.some((a) => s.has(a));

  return {
    state: request.skin_state,
    postShave: request.post_shave,
    usedYesterday: yesterdayActives,
    acidsLast2Days: hasAcid(yesterdayActives) || hasAcid(twoDaysActives),
    retinolLast2Days:
      hasRetinol(yesterdayActives) || hasRetinol(twoDaysActives),
  };
}

function filterCandidates(
  products: Product[],
  ctx: FilterContext,
): { candidates: Product[]; constraints: string[] } {
  const constraints: string[] = [];
  let candidates = products.slice();

  if (ctx.postShave || ctx.state === "irritada") {
    constraints.push(
      ctx.postShave
        ? "Pele pós-barba — só calmantes e hidratação"
        : "Pele irritada — sem ácidos nem retinol",
    );
    candidates = candidates.filter(
      (p) =>
        p.category === "hidratacao" ||
        p.category === "mascara" ||
        (p.category === "clareamento" &&
          p.actives.includes("niacinamide") &&
          !p.actives.some((a) => STRONG_ACIDS.includes(a))),
    );
    return { candidates, constraints };
  }

  if (ctx.acidsLast2Days) {
    constraints.push("Ácidos nos últimos 2 dias — pular ácidos hoje");
    candidates = candidates.filter(
      (p) => !p.actives.some((a) => STRONG_ACIDS.includes(a)),
    );
  }

  if (ctx.retinolLast2Days) {
    constraints.push("Retinol recente — sem retinol hoje");
    candidates = candidates.filter((p) => !p.actives.includes("retinol"));
  }

  if (ctx.state === "acne_ativa") {
    constraints.push("Acne ativa — spot treatment + tratamento focal ok");
  }

  if (ctx.state === "oleosa") {
    constraints.push(
      "Oleosa — priorizar controle de oleosidade (salicílico, niacinamida + zinco)",
    );
  }

  return { candidates, constraints };
}

function buildPrompt(
  candidates: Product[],
  ctx: FilterContext,
  constraints: string[],
  notes: string | undefined,
): string {
  const productList = candidates
    .map(
      (p) =>
        `- [${p.id}] ${p.name} (${p.brand}) — categoria: ${p.category}, ativos: ${p.actives.join(", ")}, intensidade: ${p.intensity}${p.notes ? `. ${p.notes}` : ""}`,
    )
    .join("\n");

  const yesterdayActives = Array.from(ctx.usedYesterday).join(", ") || "nada";

  return `Você é um consultor de skincare. Recomende a rotina noturna de hoje para uma pele MASCULINA adulta, mista/oleosa, com tendência a acne leve e marcas pós-inflamatórias.

ESTADO ATUAL DA PELE: ${ctx.state}
PÓS-BARBA: ${ctx.postShave ? "sim" : "não"}
ATIVOS USADOS ONTEM: ${yesterdayActives}
NOTAS DO USUÁRIO: ${notes || "—"}

REGRAS APLICADAS (já filtradas):
${constraints.length > 0 ? constraints.map((c) => `- ${c}`).join("\n") : "- Nenhuma restrição forte"}

PRODUTOS DISPONÍVEIS HOJE:
${productList}

INSTRUÇÕES:
1. Escolha 2 a 4 produtos da lista acima — APENAS desta lista.
2. Ordene na sequência correta de aplicação (mais fluido → mais denso).
3. NÃO combine ácido com retinol no mesmo dia.
4. Priorize consistência sobre agressividade. "Menos é mais."
5. Responda em JSON exato, nada além disso:

{
  "product_ids": ["id1", "id2", ...],
  "reasoning": "uma frase curta explicando a escolha"
}`;
}

export async function suggest(
  db: D1Database,
  apiKey: string,
  request: SuggestRequest,
): Promise<SuggestResponse> {
  const [products, recent] = await Promise.all([
    listProducts(db),
    getRecentRoutines(db, 5),
  ]);

  const ctx = buildContext(request, recent, products);
  const { candidates, constraints } = filterCandidates(products, ctx);

  if (candidates.length === 0) {
    return {
      product_ids: [],
      reasoning:
        "Nenhum produto compatível com o estado atual da pele. Considere descanso completo hoje.",
    };
  }

  const prompt = buildPrompt(candidates, ctx, constraints, request.notes);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          product_ids: {
            type: "ARRAY",
            items: { type: "STRING", enum: candidates.map((c) => c.id) },
            minItems: 1,
            maxItems: 4,
          },
          reasoning: { type: "STRING" },
        },
        required: ["product_ids", "reasoning"],
      },
    },
  };

  const data = await callGeminiWithRetry(url, body);
  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("Empty Gemini text", { finishReason, candidate });
    throw new Error("AI_PARSE_ERROR");
  }

  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    return JSON.parse(cleaned) as SuggestResponse;
  } catch (parseErr) {
    console.error("Gemini JSON parse failed", {
      finishReason,
      raw: cleaned.slice(0, 400),
      error: parseErr instanceof Error ? parseErr.message : String(parseErr),
    });
    throw new Error("AI_PARSE_ERROR");
  }
}

const RETRY_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

async function callGeminiWithRetry(
  url: string,
  body: unknown,
): Promise<GeminiResponse> {
  let lastError: Error = new Error("Gemini call failed");

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return (await res.json()) as GeminiResponse;
    }

    const errText = await res.text();

    if (!RETRY_STATUSES.has(res.status) || attempt === MAX_ATTEMPTS - 1) {
      if (res.status === 503 || res.status === 429) {
        throw new Error("OVERLOADED");
      }
      throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`);
    }

    lastError = new Error(`Gemini ${res.status}`);
    const delayMs = 500 * Math.pow(2, attempt) + Math.random() * 250;
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw lastError;
}
