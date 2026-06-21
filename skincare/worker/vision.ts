import { CATEGORIES, ACTIVES } from "./catalogs.ts";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

export interface AnalyzedProduct {
  name: string;
  brand: string;
  category: string;
  actives: string[];
  intensity: 1 | 2 | 3;
  notes: string;
  confidence: "high" | "medium" | "low";
}

const PROMPT = `Você é um especialista em skincare. Identifique este produto pela foto da embalagem.

Devolva APENAS um JSON com:
- name: nome do produto (sem a marca)
- brand: fabricante
- category: uma das categorias listadas no schema (escolha a que melhor representa a função principal)
- actives: lista de ativos identificados (do enum permitido — pule ativos não listados)
- intensity: 1 (suave), 2 (médio), 3 (forte) baseado nos ativos
- notes: observação curta (1 frase) sobre uso/restrições/horário recomendado
- confidence: "high" se tudo legível na foto, "medium" se inferiu alguns campos, "low" se imagem pouco clara

Se a foto não mostra um produto de skincare, retorne campos vazios e confidence "low".`;

const MIME_RE = /^data:(image\/[a-z+]+);base64,(.+)$/;

export async function analyzeProductPhoto(
  apiKey: string,
  imageDataUrl: string,
): Promise<AnalyzedProduct> {
  const match = MIME_RE.exec(imageDataUrl);
  if (!match) throw new Error("INVALID_IMAGE");
  const [, mimeType, imageData] = match;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: imageData } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 },
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          brand: { type: "STRING" },
          category: { type: "STRING", enum: [...CATEGORIES, ""] },
          actives: {
            type: "ARRAY",
            items: { type: "STRING", enum: [...ACTIVES] },
            maxItems: 6,
          },
          intensity: { type: "INTEGER", enum: [1, 2, 3] },
          notes: { type: "STRING" },
          confidence: {
            type: "STRING",
            enum: ["high", "medium", "low"],
          },
        },
        required: [
          "name",
          "brand",
          "category",
          "actives",
          "intensity",
          "notes",
          "confidence",
        ],
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 503 || res.status === 429) throw new Error("OVERLOADED");
    throw new Error(`Vision ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("AI_PARSE_ERROR");

  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned) as AnalyzedProduct;
    if (!parsed.intensity || parsed.intensity < 1 || parsed.intensity > 3) {
      parsed.intensity = 1;
    }
    return parsed;
  } catch {
    throw new Error("AI_PARSE_ERROR");
  }
}
