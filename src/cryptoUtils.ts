import type { EventForm } from "./eventForm";

const te = new TextEncoder();
const td = new TextDecoder();

/** Always return a fresh, plain ArrayBuffer (never SharedArrayBuffer) */
function toAB(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

/** Base64url (URL/query-safe, no padding) */
const b64url = {
  encode(bytes: Uint8Array): string {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  },
  decode(s: string): Uint8Array {
    const b64 =
      s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  },
};

async function deriveKey(
  passkey: string,
  saltU8: Uint8Array,
  iterations = 250_000
) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    toAB(te.encode(passkey)), // force ArrayBuffer
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toAB(saltU8), iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt -> v1.<salt>.<iv>.<iter36>.<ct> (all base64url, query-safe) */
export async function encryptString(
  plaintext: string,
  passkey: string
): Promise<string> {
  if (!crypto?.subtle) throw new Error("Web Crypto API not available.");

  const salt = crypto.getRandomValues(new Uint8Array(16)); // 128-bit
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit (GCM)

  const iterations = 250_000;
  const key = await deriveKey(passkey, salt, iterations);

  const ctBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toAB(iv) }, // ArrayBuffer
    key,
    toAB(te.encode(plaintext)) // ArrayBuffer
  );

  return [
    "v1",
    b64url.encode(salt),
    b64url.encode(iv),
    iterations.toString(36),
    b64url.encode(new Uint8Array(ctBuf)),
  ].join(".");
}

/** Decrypt string created by encryptString */
export async function decryptString(
  payload: string,
  passkey: string
): Promise<string> {
  if (!crypto?.subtle) throw new Error("Web Crypto API not available.");

  const parts = payload.split(".");
  if (parts.length !== 5 || parts[0] !== "v1")
    throw new Error("Invalid payload format.");
  const [, saltB64, ivB64, iter36, ctB64] = parts;

  const salt = b64url.decode(saltB64);
  const iv = b64url.decode(ivB64);
  const iterations = parseInt(iter36, 36);
  if (!Number.isFinite(iterations) || iterations < 100_000)
    throw new Error("Invalid iteration count.");

  const key = await deriveKey(passkey, salt, iterations);

  try {
    const ptBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toAB(iv) }, // ArrayBuffer
      key,
      toAB(b64url.decode(ctB64)) // ArrayBuffer
    );
    return td.decode(ptBuf);
  } catch {
    throw new Error("Decryption failed. Check the passkey or payload.");
  }
}

// Extract share-relevant params from EventForm
export function extractShareParams(form: EventForm): Record<string, string> {
  // Be sure to keep in sync with App/share logic
  return {
    t: form.title || "",
    d: form.description || "",
    l: form.location || "",
    s: form.sDate && form.sTime ? `${form.sDate}T${form.sTime}:00` : "",
    e: form.eDate && form.eTime ? `${form.eDate}T${form.eTime}:00` : "",
    tz: form.timezone || "",
    o: form.isOnline ? "1" : "0",
    a: form.isAllDay ? "1" : "0",
    // do not include password itself
  };
}

export function paramsSerializer(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map(
      (k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k] ?? "")}`
    )
    .join("&");
}

export function paramsDeserializer(query: string): Record<string, string> {
  const out: Record<string, string> = {};

  if (!query) return out;

  for (const part of query.split("&")) {
    const [k, v = ""] = part.split("=");
    out[decodeURIComponent(k)] = decodeURIComponent(v);
  }

  return out;
}
