import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;
const DIGITS = 6;
const ISSUER = "PhDRadar";

export function generateSecret(bytes = 20): string {
  return toBase32(crypto.randomBytes(bytes));
}

export function toBase32(buf: Buffer): string {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const rem = bits.length % 5;
  if (rem !== 0) {
    const last = bits.slice(bits.length - rem).padEnd(5, "0");
    out += BASE32_ALPHABET[parseInt(last, 2)];
    while (out.length % 8 !== 0) out += "=";
  }
  return out;
}

export function fromBase32(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = "";
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("invalid base32 character");
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const mac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    ((mac[offset + 1] & 0xff) << 16) |
    ((mac[offset + 2] & 0xff) << 8) |
    (mac[offset + 3] & 0xff);
  const code = bin % 10 ** DIGITS;
  return code.toString().padStart(DIGITS, "0");
}

export function totpCode(secretBase32: string, nowMs = Date.now()): string {
  const counter = Math.floor(nowMs / 1000 / STEP_SECONDS);
  return hotp(fromBase32(secretBase32), counter);
}

export function verifyTotp(
  secretBase32: string,
  token: string,
  window = 1,
  nowMs = Date.now()
): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const key = fromBase32(secretBase32);
  const counter = Math.floor(nowMs / 1000 / STEP_SECONDS);
  for (let w = -window; w <= window; w++) {
    if (hotp(key, counter + w) === token) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, email: string): string {
  const label = encodeURIComponent(`${ISSUER}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer: ISSUER,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params}`;
}

export function qrCodeImageUrl(otpauth: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex");
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5, 10)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code.toLowerCase().trim()).digest("hex");
}

export function verifyAndConsumeBackupCode(
  hashed: string[],
  input: string
): { ok: false } | { ok: true; remaining: string[] } {
  const h = hashBackupCode(input);
  if (!hashed.includes(h)) return { ok: false };
  return { ok: true, remaining: hashed.filter((x) => x !== h) };
}
