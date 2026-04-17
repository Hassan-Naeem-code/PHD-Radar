import {
  generateSecret,
  totpCode,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
  verifyAndConsumeBackupCode,
  otpauthUrl,
  toBase32,
  fromBase32,
} from "@/lib/totp";

describe("TOTP", () => {
  it("base32 round-trips", () => {
    const original = Buffer.from("hello world");
    const encoded = toBase32(original);
    const decoded = fromBase32(encoded);
    expect(decoded.equals(original)).toBe(true);
  });

  it("generates a valid base32 secret", () => {
    const secret = generateSecret();
    expect(secret).toMatch(/^[A-Z2-7=]+$/);
    expect(secret.length).toBeGreaterThan(15);
  });

  it("computes a 6-digit code", () => {
    const secret = generateSecret();
    const code = totpCode(secret);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("verifies its own code", () => {
    const secret = generateSecret();
    const code = totpCode(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it("rejects an obviously wrong code", () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, "000000")).toBe(false);
  });

  it("rejects non-6-digit input", () => {
    const secret = generateSecret();
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "12345")).toBe(false);
  });

  it("honors the time window", () => {
    const secret = generateSecret();
    const now = Date.now();
    const past = totpCode(secret, now - 30_000);
    expect(verifyTotp(secret, past, 1, now)).toBe(true);
    // Outside ±1 step window
    const distantPast = totpCode(secret, now - 120_000);
    expect(verifyTotp(secret, distantPast, 1, now)).toBe(false);
  });

  it("matches a known RFC 6238 test vector (sha1, 30s, T=59)", () => {
    // RFC 6238 vector: seed "12345678901234567890" in ASCII
    // at T=59 → 94287082 (8-digit); we return 6-digit → "287082"
    const seed = Buffer.from("12345678901234567890");
    const secret = toBase32(seed);
    expect(totpCode(secret, 59 * 1000)).toBe("287082");
  });

  it("otpauth URL shape is valid", () => {
    const url = otpauthUrl("JBSWY3DPEHPK3PXP", "user@example.com");
    expect(url).toMatch(/^otpauth:\/\/totp\//);
    expect(url).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(url).toContain("issuer=PhDRadar");
  });
});

describe("Backup codes", () => {
  it("generates 8 unique codes by default", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
  });

  it("verifies and consumes a backup code", () => {
    const codes = generateBackupCodes(3);
    const hashed = codes.map(hashBackupCode);

    const result = verifyAndConsumeBackupCode(hashed, codes[1]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.remaining).toHaveLength(2);
      expect(result.remaining).not.toContain(hashed[1]);
    }
  });

  it("rejects an unknown backup code", () => {
    const hashed = generateBackupCodes(3).map(hashBackupCode);
    const result = verifyAndConsumeBackupCode(hashed, "not-a-real-code");
    expect(result.ok).toBe(false);
  });

  it("is case-insensitive and trims", () => {
    const codes = generateBackupCodes(1);
    const hashed = codes.map(hashBackupCode);
    const result = verifyAndConsumeBackupCode(hashed, `  ${codes[0].toUpperCase()}  `);
    expect(result.ok).toBe(true);
  });
});
