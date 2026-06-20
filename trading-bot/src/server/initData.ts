import crypto from "node:crypto";

export interface InitDataResult {
  ok: boolean;
  userId?: number;
  username?: string;
}

/**
 * Validates a Telegram Mini App `initData` string per Telegram's spec:
 *   secret_key      = HMAC_SHA256(key="WebAppData", message=bot_token)
 *   expected_hash   = HMAC_SHA256(key=secret_key, message=data_check_string)
 * where data_check_string is every field except `hash`, sorted by key and
 * joined as "key=value" with newlines. This proves the payload really came from
 * Telegram and wasn't forged — essential before honouring any control command.
 *
 * @param maxAgeSeconds reject payloads older than this (replay protection).
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 3600,
): InitDataResult {
  if (!initData) return { ok: false };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false };

  const pairs: string[] = [];
  for (const [key, value] of params) {
    if (key === "hash") continue;
    pairs.push(`${key}=${value}`);
  }
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // Constant-time comparison.
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false };

  // Optional freshness check.
  const authDate = Number(params.get("auth_date") ?? 0);
  if (maxAgeSeconds > 0 && authDate > 0) {
    const ageSeconds = Date.now() / 1000 - authDate;
    if (ageSeconds > maxAgeSeconds) return { ok: false };
  }

  let userId: number | undefined;
  let username: string | undefined;
  const userRaw = params.get("user");
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw) as { id?: number; username?: string };
      userId = user.id;
      username = user.username;
    } catch {
      /* ignore malformed user */
    }
  }

  return { ok: true, userId, username };
}
