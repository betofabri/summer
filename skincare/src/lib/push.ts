import { getToken } from "./api.ts";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js`,
      { scope: import.meta.env.BASE_URL },
    );
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

async function bearerPost(path: string, body: unknown): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("No token");
  const res = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error || `HTTP ${res.status}`);
  }
}

export async function getServerVapidKey(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${import.meta.env.BASE_URL}api/push/config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { public_key: string | null };
  return data.public_key;
}

export async function subscribe(): Promise<PushSubscription> {
  const reg = await getRegistration();
  if (!reg) throw new Error("Service worker indisponível");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão negada");
  }

  const publicKey = await getServerVapidKey();
  if (!publicKey) throw new Error("VAPID não configurado no servidor");

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
  });

  const json = sub.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  await bearerPost("/push/subscribe", json);
  return sub;
}

export async function unsubscribe(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await bearerPost("/push/unsubscribe", { endpoint: sub.endpoint });
  await sub.unsubscribe();
}

export async function sendTestPush(): Promise<void> {
  await bearerPost("/push/test", {});
}
