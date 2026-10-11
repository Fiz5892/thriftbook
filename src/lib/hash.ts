import "server-only";
import { createHmac } from "node:crypto";

/**
 * Hash email untuk daftar blokir (SEC-34). HMAC dengan pepper dari env, sehingga hash
 * tidak bisa di-brute-force dari daftar email UM tanpa pepper.
 */
export function emailHash(email: string): string {
  const pepper = process.env.EMAIL_HASH_PEPPER;
  if (!pepper) throw new Error("EMAIL_HASH_PEPPER belum diatur");
  return createHmac("sha256", pepper).update(email.trim().toLowerCase()).digest("hex");
}
