/*
 * Worker do site "summer" — versão Google Gemini.
 *
 *  - POST /app/api/chat  -> proxy seguro para a API do Gemini (o app de dieta).
 *  - Qualquer outra rota -> serve os arquivos estáticos (env.ASSETS).
 *
 * O app é servido em dois lugares:
 *   - summer.roberto-fabri.workers.dev/app/...   (workers.dev original)
 *   - betofabri.com/summer/app/...               (route no domínio próprio)
 *
 * Quando o request chega pelo segundo, o pathname começa com /summer/.
 * Aqui retiramos esse prefixo antes de qualquer outro processamento, de modo
 * que o resto da lógica (e os assets) só precisa conhecer o path "/app/...".
 *
 * A chave de API NUNCA aparece aqui. É lida de env.GEMINI_API_KEY,
 * um Secret configurado no painel do Cloudflare.
 */

const GEMINI_MODEL = "gemini-2.5-flash";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const prefix = (url.pathname === "/summer" || url.pathname.startsWith("/summer/")) ? "/summer" : "";

    /* Atalhos para diretórios "nus" — manda direto pra /summer/app/.
       Sem isso, /summer ou /summer/app cairiam num redirect do ASSETS
       que perderia o prefixo /summer no Location. */
    if (url.pathname === "/summer" || url.pathname === "/summer/" || url.pathname === "/summer/app") {
      url.pathname = "/summer/app/";
      return Response.redirect(url.toString(), 302);
    }

    if (prefix) {
      url.pathname = url.pathname.slice(prefix.length);
      request = new Request(url, request);
    }

    /* path = caminho lógico sem o prefixo /summer (se houver). */
    const path = url.pathname;

    if (path === "/app/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "Use POST." }, 405);
      }
      return handleChat(request, env);
    }

    if (path === "/app/api/strava/authorize") {
      return handleStravaAuthorize(request, env, prefix);
    }

    if (path === "/app/api/strava/callback") {
      return handleStravaCallback(request, env, prefix);
    }

    if (path === "/app/api/strava/activities") {
      return handleStravaActivities(request, env);
    }

    if (path === "/app/api/strava/status") {
      return handleStravaStatus(request, env);
    }

    const response = await env.ASSETS.fetch(request);

    /* Se o ASSETS devolveu um redirect (ex.: trailing slash em diretório)
       e a request original veio com prefixo /summer/, re-adiciona o prefixo
       no Location — senão o navegador é mandado pra fora da rota do worker. */
    if (prefix && (response.status === 301 || response.status === 302)) {
      const location = response.headers.get("Location");
      if (location) {
        const target = new URL(location, url);
        if (!target.pathname.startsWith("/summer/")) {
          target.pathname = "/summer" + target.pathname;
          const headers = new Headers(response.headers);
          headers.set("Location", target.toString());
          return new Response(response.body, { status: response.status, headers });
        }
      }
    }

    return response;
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
     Cada mensagem de usuário pode ter:
       - content: texto
       - image: { mimeType, data }  (data = base64 sem o prefixo data:)
     O Gemini aceita texto e imagem juntos em "parts". */
  const contents = messages
    .filter(m => m && m.role === "user")
    .map(m => {
      const parts = [];
      if (m.content) {
        parts.push({ text: String(m.content) });
      }
      if (m.image && m.image.data) {
        parts.push({
          inlineData: {
            mimeType: m.image.mimeType || "image/jpeg",
            data: m.image.data
          }
        });
      }
      return { role: "user", parts: parts };
    });

  /* thinkingConfig com thinkingBudget 0 DESLIGA o raciocínio interno do
     Gemini 2.5 Flash. Sem isso, o "pensamento" consome quase todo o
     orçamento de tokens e a resposta final sai cortada no meio do JSON. */
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

/* ============================================================
 * STRAVA OAuth + atividades
 *
 * Persistência dos tokens (com fallback):
 *   1) Se existir binding env.STRAVA_KV (Cloudflare KV), grava lá. Refresh
 *      atualiza o KV automaticamente — Roberto nunca mais precisa
 *      re-cadastrar Secrets manualmente.
 *   2) Se o KV não estiver ligado, lê dos Secrets STRAVA_ACCESS_TOKEN /
 *      STRAVA_REFRESH_TOKEN / STRAVA_EXPIRES_AT (esquema manual antigo).
 *      Nesse modo, quando o token é renovado, devolvemos os novos valores
 *      pro frontend mostrar e o Roberto cadastrar — só até o KV entrar.
 *
 * Os Secrets STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET continuam sendo
 * Secrets — são fixos do app, não rotativos.
 * ============================================================ */

const STRAVA_SCOPE = "read,activity:read_all";
const STRAVA_KV_KEY = "strava:tokens";

async function readStravaTokens(env) {
  if (env.STRAVA_KV) {
    try {
      const raw = await env.STRAVA_KV.get(STRAVA_KV_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* cai pro fallback */ }
  }
  if (env.STRAVA_ACCESS_TOKEN) {
    return {
      access_token: env.STRAVA_ACCESS_TOKEN,
      refresh_token: env.STRAVA_REFRESH_TOKEN || "",
      expires_at: parseInt(env.STRAVA_EXPIRES_AT || "0", 10)
    };
  }
  return null;
}

async function writeStravaTokens(env, tokens) {
  if (!env.STRAVA_KV) return false;
  await env.STRAVA_KV.put(STRAVA_KV_KEY, JSON.stringify({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: tokens.expires_at
  }));
  return true;
}

function callbackUrl(request, prefix) {
  const url = new URL(request.url);
  return `${url.origin}${prefix}/app/api/strava/callback`;
}

function handleStravaAuthorize(request, env, prefix) {
  if (!env.STRAVA_CLIENT_ID) {
    return json({ error: "STRAVA_CLIENT_ID não configurado." }, 500);
  }
  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: callbackUrl(request, prefix),
    response_type: "code",
    scope: STRAVA_SCOPE,
    approval_prompt: "auto"
  });
  const target = "https://www.strava.com/oauth/authorize?" + params.toString();
  return Response.redirect(target, 302);
}

async function handleStravaCallback(request, env, prefix) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");

  if (err) {
    return htmlPage(
      "Autorização cancelada",
      `<p>O Strava retornou um erro: <code>${escapeHtml(err)}</code>.</p>
       <p><a href="${prefix}/app/">voltar ao app</a></p>`
    );
  }
  if (!code) {
    return htmlPage(
      "Faltou o código",
      `<p>O Strava não enviou um <code>code</code> na URL.</p>
       <p><a href="${prefix}/app/">voltar ao app</a></p>`
    );
  }
  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    return htmlPage(
      "Configuração incompleta",
      `<p>Faltam Secrets no Cloudflare: <code>STRAVA_CLIENT_ID</code> e/ou <code>STRAVA_CLIENT_SECRET</code>.</p>`
    );
  }

  let resp;
  try {
    resp = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code"
      })
    });
  } catch (e) {
    return htmlPage("Falha ao contatar o Strava", `<p>${escapeHtml(String(e))}</p>`);
  }

  const raw = await resp.text();
  if (!resp.ok) {
    return htmlPage(
      "Strava recusou a troca",
      `<p>Status ${resp.status}.</p><pre>${escapeHtml(raw)}</pre>`
    );
  }

  let data;
  try { data = JSON.parse(raw); } catch (e) {
    return htmlPage("Resposta inesperada", `<pre>${escapeHtml(raw)}</pre>`);
  }

  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at
  };
  const persisted = await writeStravaTokens(env, tokens);
  const athleteName = `${data.athlete?.firstname || ""} ${data.athlete?.lastname || ""}`.trim();

  if (persisted) {
    return htmlPage(
      "Conectado!",
      `<p>Strava conectado e tokens salvos no KV. Pode usar o app agora — a renovação automática
         vai cuidar sozinha das próximas 6h em diante.</p>
       ${athleteName ? `<p style="color:#666;font-size:14px;">Atleta: ${escapeHtml(athleteName)}</p>` : ""}
       <p><a href="${prefix}/app/">voltar ao app</a></p>`
    );
  }
  return htmlPage(
    "Conectado! (modo manual)",
    `<p>O KV ainda não está ligado neste Worker. Cadastra estes valores como
       <strong>Secrets</strong> no Cloudflare e faz um redeploy:</p>
     <table>
       <tr><th>STRAVA_ACCESS_TOKEN</th><td><code>${escapeHtml(tokens.access_token || "")}</code></td></tr>
       <tr><th>STRAVA_REFRESH_TOKEN</th><td><code>${escapeHtml(tokens.refresh_token || "")}</code></td></tr>
       <tr><th>STRAVA_EXPIRES_AT</th><td><code>${escapeHtml(String(tokens.expires_at || ""))}</code></td></tr>
     </table>
     ${athleteName ? `<p style="color:#666;font-size:14px;">Atleta: ${escapeHtml(athleteName)}</p>` : ""}
     <p><a href="${prefix}/app/">voltar ao app</a></p>`
  );
}

async function handleStravaStatus(request, env) {
  const t = await readStravaTokens(env);
  if (!t || !t.access_token) return json({ connected: false });
  const expiresAt = t.expires_at || 0;
  return json({
    connected: true,
    storage: env.STRAVA_KV ? "kv" : "secrets",
    expires_at: expiresAt,
    expires_in_seconds: Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
  });
}

async function handleStravaActivities(request, env) {
  let tokenResult;
  try {
    tokenResult = await getStravaAccessToken(env);
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }

  /* Janela larga (9 dias) para garantir que cubra a semana atual
     (segunda → domingo) seja qual for o dia em que o app é aberto.
     O frontend recorta a semana redonda com base no fuso local. */
  const nineDaysAgo = Math.floor(Date.now() / 1000) - 9 * 86400;
  const apiUrl = `https://www.strava.com/api/v3/athlete/activities?after=${nineDaysAgo}&per_page=50`;

  let resp;
  try {
    resp = await fetch(apiUrl, {
      headers: { "Authorization": "Bearer " + tokenResult.accessToken }
    });
  } catch (e) {
    return json({ error: "Falha ao contatar a API do Strava." }, 502);
  }

  const raw = await resp.text();
  if (!resp.ok) {
    return new Response(raw, { status: resp.status, headers: { "Content-Type": "application/json" } });
  }

  let activities;
  try { activities = JSON.parse(raw); } catch (e) {
    return json({ error: "Resposta inesperada do Strava." }, 502);
  }

  const slim = (Array.isArray(activities) ? activities : []).map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    sport_type: a.sport_type,
    distance_m: a.distance,
    moving_time_s: a.moving_time,
    elapsed_time_s: a.elapsed_time,
    start_date: a.start_date,
    start_date_local: a.start_date_local,
    calories: a.calories || null
  }));

  const result = { activities: slim };
  /* Só expomos os tokens novos quando NÃO conseguimos persistir (sem KV).
     Com KV ativo, o refresh é transparente e o frontend não precisa saber. */
  if (tokenResult.refreshed && !tokenResult.persisted) {
    result.refreshed = {
      access_token: tokenResult.accessToken,
      refresh_token: tokenResult.refreshToken,
      expires_at: tokenResult.expiresAt,
      message: "Os tokens foram renovados. Atualize os Secrets STRAVA_ACCESS_TOKEN, STRAVA_REFRESH_TOKEN e STRAVA_EXPIRES_AT no Cloudflare e faça um redeploy. (Pra acabar com essa chatice, ligue o binding KV STRAVA_KV no wrangler.jsonc.)"
    };
  }
  return json(result);
}

async function getStravaAccessToken(env) {
  const t = await readStravaTokens(env);
  if (!t || !t.access_token || !t.refresh_token) {
    throw new Error("Strava não conectado. Visite /app/api/strava/authorize.");
  }

  const now = Math.floor(Date.now() / 1000);

  /* Folga de 60s para evitar 401 por race. */
  if (t.expires_at && t.expires_at > now + 60) {
    return { accessToken: t.access_token, refreshed: false };
  }

  if (!env.STRAVA_CLIENT_ID || !env.STRAVA_CLIENT_SECRET) {
    throw new Error("Faltam STRAVA_CLIENT_ID/STRAVA_CLIENT_SECRET para renovar o token.");
  }

  const resp = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: t.refresh_token,
      grant_type: "refresh_token"
    })
  });
  const raw = await resp.text();
  if (!resp.ok) {
    throw new Error("Falha ao renovar token Strava: " + raw);
  }
  const data = JSON.parse(raw);
  const newTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at
  };
  /* Tenta persistir no KV; se não tiver binding, segue em frente — o
     frontend vai receber os tokens novos no response para o usuário
     cadastrar manualmente. */
  const persisted = await writeStravaTokens(env, newTokens);
  return {
    accessToken: newTokens.access_token,
    refreshToken: newTokens.refresh_token,
    expiresAt: newTokens.expires_at,
    refreshed: true,
    persisted: persisted
  };
}

function htmlPage(title, bodyHtml) {
  const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — Always Summer</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background:#f8faf3; color:#191c18;
         padding: 2rem 1.5rem; max-width: 640px; margin: 0 auto; line-height: 1.55; }
  h1 { font-weight: 600; margin: 0 0 1rem; }
  code { background:#e9ecdc; padding: 2px 6px; border-radius:4px; font-size: 13px; word-break: break-all; }
  table { width:100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { text-align:left; padding: 8px 4px; vertical-align: top; border-bottom: 1px solid #d8dac9; }
  th { width: 38%; font-weight:500; }
  pre { background:#1a1d18; color:#bff443; padding:1rem; border-radius:8px; overflow:auto; font-size:12px; }
  a { color:#001612; }
</style>
</head><body>
<h1>${escapeHtml(title)}</h1>
${bodyHtml}
</body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
