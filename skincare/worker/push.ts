import {
  buildPushPayload,
  type PushSubscription as WebPushSubscription,
  type VapidKeys,
} from "@block65/webcrypto-web-push";

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  [key: string]: string | undefined;
}

interface DbSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export async function sendPush(
  sub: DbSubscription,
  payload: PushPayload,
  vapid: VapidConfig,
): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const subscription: WebPushSubscription = {
    endpoint: sub.endpoint,
    expirationTime: null,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };

  const keys: VapidKeys = {
    subject: vapid.subject,
    publicKey: vapid.publicKey,
    privateKey: vapid.privateKey,
  };

  const { headers, body, method } = await buildPushPayload(
    { data: payload, options: { ttl: 43200, urgency: "normal" } },
    subscription,
    keys,
  );

  const res = await fetch(sub.endpoint, { method, headers, body });

  return {
    ok: res.ok,
    status: res.status,
    gone: res.status === 404 || res.status === 410,
  };
}
