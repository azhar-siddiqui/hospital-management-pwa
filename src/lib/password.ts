import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
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
