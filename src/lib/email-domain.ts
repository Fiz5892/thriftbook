/**
 * Cocokkan domain email dengan allowlist secara PERSIS (bukan endsWith),
 * supaya "x@evilum.ac.id" dan "x@students.um.ac.id.evil.com" ditolak. (AC-01.3)
 */
export function isAllowedEmail(
  email: string | null | undefined,
  allowed: string = process.env.ALLOWED_EMAIL_DOMAINS ?? "",
): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at < 1 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  const list = allowed
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(domain);
}
