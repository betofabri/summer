# Meu dia · app de dieta inteligente

App de dieta com visual "Organic Electric" (design system do Stitch), cardápio em
abas, motor de ciclo de calorias sensível ao treino e cálculo de macros por IA.
Pronto para o **Cloudflare Pages**.

## Estrutura dos arquivos

```
dieta-app/
├── index.html              o app (frontend)
└── functions/
    └── api/
        └── chat.js          a Pages Function — proxy seguro da IA
```

A pasta `functions/` é o que o Cloudflare Pages usa para o backend. O arquivo
`functions/api/chat.js` é automaticamente publicado na rota `/api/chat`, e o
`index.html` já chama essa rota.

## O que o app faz

- **Treino do dia**: descanso, hot yoga, corrida (com distância) ou musculação
  (com duração). Pode combinar vários.
- **Ciclo de calorias**: o alvo de calorias e macros se ajusta sozinho ao treino.
  Descanso = déficit firme, carbo baixo. Treino = mais energia, foco no carbo.
  Proteína sempre alta.
- **Refeições em abas**: cada uma traz a sugestão do cardápio. Confirmar ·
  Alterar (descreve em texto, a IA calcula) · Pulei.
- **Recalcular o dia**: a IA considera o que já foi comido e o treino, e sugere
  o restante para fechar os macros.

## Segurança da chave de API — leia primeiro

Se você compartilhou uma chave da Anthropic em qualquer lugar (chat, e-mail,
captura de tela), **gere uma nova** no console da Anthropic e descarte a antiga.
Uma chave que vazou deve ser considerada comprometida.

A chave NUNCA fica no `index.html` nem no `chat.js`. Ela mora apenas como um
Secret no Cloudflare Pages, e a Pages Function a lê de `context.env`.

## Deploy no Cloudflare Pages — passo a passo

### 1. Suba o projeto

Opção A — Git: suba a pasta `dieta-app` para um repositório (GitHub/GitLab).
No painel Cloudflare: Workers & Pages > Create > Pages > conecte o repositório.
Como é um site estático com pasta `functions/`, não precisa de build command;
o diretório de saída é a raiz do projeto.

Opção B — Wrangler CLI: instale com `npm i -g wrangler` e rode, dentro da pasta:
`wrangler pages deploy .`

### 2. Cadastre a chave como Secret

No painel: Workers & Pages > seu projeto > Settings > Variables and Secrets > Add.

- Nome da variável: `ANTHROPIC_API_KEY`
- Valor: sua chave nova da Anthropic
- Tipo: **Secret** (marque "Encrypt"). Secrets ficam criptografados e não podem
  ser lidos depois — é o lugar correto para uma chave de API.

Depois de adicionar o Secret, faça um novo deploy (ou clique em redeploy) para
que a Pages Function passe a enxergar a variável.

### 3. Teste

Abra a URL do projeto. Marque um treino, confirme uma refeição: se os macros
forem calculados, o proxy está funcionando. Se aparecer erro de cálculo, confira
se o Secret tem exatamente o nome `ANTHROPIC_API_KEY` e se houve redeploy.

## Desenvolvimento local

`wrangler pages dev .` roda o app e a Pages Function localmente. Para a IA
funcionar no local, passe a chave assim:
`wrangler pages dev . --binding ANTHROPIC_API_KEY=suachave`
(use uma chave de teste; não comite isso em lugar nenhum).

## Ajustes — bloco CONFIG no topo do `<script>` em index.html

- `PROFILE` — idade, altura, peso.
- `BASE_DEFICIT` — agressividade do emagrecimento (500 ≈ 0,5 kg/semana).
- `REFEED_RATIO` — fração da energia do treino devolvida como comida (0.65 = 65%).
- `PROTEIN_PER_KG`, `FAT_PER_KG` — gramas por kg de peso.
- `WORKOUTS` — gasto estimado de cada treino (corrida 75 kcal/km, musculação
  5 kcal/min, hot yoga 320 kcal). Calibre à sua intensidade real.

## Importante

Os valores de gasto energético e de macros são estimativas e variam por pessoa,
intensidade e metabolismo. A estratégia de ciclo de calorias e o tamanho do
déficit valem ser validados com um nutricionista ou educador físico. Este app é
uma ferramenta de apoio, não um substituto de orientação profissional.
