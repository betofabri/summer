/*
 * Worker do site "summer".
 *
 *  - POST /app/api/chat  -> proxy seguro para a API da Anthropic (o app de dieta).
 *  - Qualquer outra rota -> serve os arquivos estáticos (env.ASSETS).
 *
 * A chave de API NUNCA aparece aqui. É lida de env.ANTHROPIC_API_KEY,
 * um Secret configurado no painel do Cloudflare.
 *
 * Quando você adicionar outros conteúdos ao site, cada um pode ter sua própria
 * rota de API aqui (ex.: /outra-coisa/api/...), sem conflitar com o app.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/app/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Use POST." }, 405);
      }
      return handleChat(request, env);
    }

    /* Qualquer outra coisa: arquivos estáticos. */
    return env.ASSETS.fetch(request);
  }
};

async function handleChat(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return json({ error: "Secret ANTHROPIC_API_KEY não configurado." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }

  const payload = {
    model: body.model || "claude-sonnet-4-20250514",
    max_tokens: Math.min(body.max_tokens || 700, 1500),
    messages: Array.isArray(body.messages) ? body.messages : []
  };

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(payload)
    });
    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return json({ error: "Falha ao contatar a API da Anthropic." }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}
