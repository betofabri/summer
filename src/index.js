/*
 * Worker do site "summer" — versão Google Gemini.
 *
 *  - POST /app/api/chat  -> proxy seguro para a API do Gemini (o app de dieta).
 *  - Qualquer outra rota -> serve os arquivos estáticos (env.ASSETS).
 *
 * A chave de API NUNCA aparece aqui. É lida de env.GEMINI_API_KEY,
 * um Secret configurado no painel do Cloudflare.
 *
 * O app (index.html) continua chamando /app/api/chat e enviando mensagens no
 * formato { messages: [{role, content}] }. Este Worker traduz esse formato
 * para o formato do Gemini e traduz a resposta de volta, de modo que o app
 * não precisa saber qual IA está por trás.
 */

const GEMINI_MODEL = "gemini-2.5-flash";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/app/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Use POST." }, 405);
      }
      return handleChat(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleChat(request, env) {
  if (!env.GEMINI_API_KEY) {
    return json({ error: "Secret GEMINI_API_KEY não configurado." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const requested = body.max_tokens || 700;
  const maxTokens = Math.min(Math.max(requested, 2000), 4000);

  /* Traduz as mensagens do formato do app para o formato do Gemini.
     O app envia uma mensagem de usuário; o Gemini espera "contents". */
  const contents = messages
    .filter(m => m && m.role === "user")
    .map(m => ({ role: "user", parts: [{ text: String(m.content || "") }] }));

  /* thinkingConfig com thinkingBudget 0 DESLIGA o raciocínio interno do
     Gemini 2.5 Flash. Sem isso, o "pensamento" consome quase todo o
     orçamento de tokens e a resposta final sai cortada no meio do JSON.
     Para estimar macros não é preciso raciocínio extenso. */
  const geminiBody = {
    contents: contents,
    generationConfig: {
      maxOutputTokens: maxTokens,
      thinkingConfig: { thinkingBudget: 0 }
    }
  };

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    GEMINI_MODEL + ":generateContent";

  let upstream;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify(geminiBody)
    });
  } catch (e) {
    return json({ error: "Falha ao contatar a API do Gemini." }, 502);
  }

  const raw = await upstream.text();
  if (!upstream.ok) {
    /* Repassa o erro do Gemini para facilitar o diagnóstico. */
    return new Response(raw, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" }
    });
  }

  /* Traduz a resposta do Gemini de volta para o formato que o app espera:
     o app lê data.content[].text (formato estilo Anthropic). */
  let geminiData;
  try {
    geminiData = JSON.parse(raw);
  } catch (e) {
    return json({ error: "Resposta inesperada da API do Gemini." }, 502);
  }

  let text = "";
  try {
    const candidate = geminiData.candidates[0];
    const parts = candidate.content.parts;
    text = parts.map(p => p.text || "").join("");
    /* finishReason "MAX_TOKENS" significa que a resposta foi cortada por
       falta de espaço. Avisamos de forma clara em vez de devolver um
       JSON quebrado que o app não consegue interpretar. */
    if (candidate.finishReason === "MAX_TOKENS") {
      return json({ error: "A resposta da IA foi cortada. Tente de novo." }, 502);
    }
  } catch (e) {
    text = "";
  }

  if (!text) {
    return json({ error: "A IA não retornou uma resposta utilizável." }, 502);
  }

  return json({ content: [{ type: "text", text: text }] }, 200);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}
