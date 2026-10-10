import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) {
    return false;
  }

  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const actual = Buffer.from(hash, "hex");
  if (actual.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(actual, derived);
}

const SEAL_IV_LENGTH = 12;

function sealKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return createHash("sha256").update(secret).digest();
}

/** Encrypts a password so an admin can read it later. Sign-in still uses the hash. */
export function sealPassword(password: string) {
  const key = sealKey();
  if (!key) {
    throw new Error("AUTH_SECRET is not set");
  }

  const iv = randomBytes(SEAL_IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `seal$${iv.toString("base64url")}$${tag.toString("base64url")}$${ciphertext.toString("base64url")}`;
}

/** Returns the password an admin can show, or null when the sealed value cannot be read. */
export function openPassword(sealed: string) {
  const key = sealKey();
  const [scheme, iv, tag, ciphertext] = sealed.split("$");
  if (!key || scheme !== "seal" || !iv || !tag || !ciphertext) return null;

  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(ciphertext, "base64url")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
