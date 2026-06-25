// One-shot: gera um par de chaves VAPID (P-256) e imprime no formato
// que o worker e o frontend esperam. Roda uma vez só.
//
//   node scripts/generate-vapid.mjs
//
// Depois:
//   - cola o public key no .env (VITE_VAPID_PUBLIC_KEY=...)
//   - npx wrangler secret put VAPID_PUBLIC_KEY  (cola o mesmo valor)
//   - npx wrangler secret put VAPID_PRIVATE_KEY (cola o private)
//   - npx wrangler secret put VAPID_SUBJECT     (mailto:seu@email.com)

import { generateKeyPairSync, createPrivateKey, createPublicKey } from "node:crypto";

function b64u(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });

// Public key — uncompressed point (65 bytes), starts with 0x04
const pubRaw = publicKey.export({ format: "jwk" });
const pubBytes = Buffer.concat([
  Buffer.from([0x04]),
  Buffer.from(pubRaw.x, "base64"),
  Buffer.from(pubRaw.y, "base64"),
]);

// Private key — 32 bytes
const privRaw = privateKey.export({ format: "jwk" });
const privBytes = Buffer.from(privRaw.d, "base64");

console.log("VAPID_PUBLIC_KEY  =", b64u(pubBytes));
console.log("VAPID_PRIVATE_KEY =", b64u(privBytes));
console.log("");
console.log("→ adiciona VITE_VAPID_PUBLIC_KEY no .env (mesmo valor da public)");
console.log("→ npx wrangler secret put VAPID_PUBLIC_KEY");
console.log("→ npx wrangler secret put VAPID_PRIVATE_KEY");
console.log("→ npx wrangler secret put VAPID_SUBJECT  (mailto:seu@email.com)");
