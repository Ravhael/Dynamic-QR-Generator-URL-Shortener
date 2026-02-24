import crypto from 'crypto';

// Minimal TOTP implementation (RFC 6238) to avoid adding external deps.
// Only supports SHA1, 30s step, 6-digit codes—sufficient for initial rollout.

export interface GenerateSecretOptions {
  length?: number; // bytes before base32 (default 20)
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function generateSecret(options: GenerateSecretOptions = {}): string {
  const length = options.length ?? 20;
  const raw = crypto.randomBytes(length);
  return toBase32(raw);
}

function base32ToBuffer(base32: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of base32.replace(/=+$/,'').toUpperCase()) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTOTP(secret: string, timeStepSeconds = 30, digits = 6, forTime: number = Date.now()): string {
  const counter = Math.floor(forTime / 1000 / timeStepSeconds);
  const counterBuf = Buffer.alloc(8);
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuf.writeUInt32BE(counter & 0xffffffff, 4);
  const key = base32ToBuffer(secret);
  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  const str = (code % 10 ** digits).toString().padStart(digits, '0');
  return str;
}

export function verifyTOTP(secret: string, token: string, window = 1, timeStepSeconds = 30, digits = 6): boolean {
  const now = Date.now();
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const time = now + errorWindow * timeStepSeconds * 1000;
    if (generateTOTP(secret, timeStepSeconds, digits, time) === token) return true;
  }
  return false;
}

export function buildOtpAuthURL(secret: string, email: string, issuer = 'Scanly'): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}
