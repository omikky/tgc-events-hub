import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { validateInitData } from "../src/server/initData.js";

const TOKEN = "123456:TEST_TOKEN";

/** Build a correctly-signed initData string the way Telegram would. */
function signInitData(fields: Record<string, string>): string {
  const pairs = Object.entries(fields).map(([k, v]) => `${k}=${v}`);
  pairs.sort();
  const dataCheckString = pairs.join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(TOKEN).digest();
  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  const params = new URLSearchParams(fields);
  params.set("hash", hash);
  return params.toString();
}

describe("validateInitData", () => {
  const now = Math.floor(Date.now() / 1000);

  it("accepts a correctly-signed payload and extracts the user", () => {
    const initData = signInitData({
      auth_date: String(now),
      user: JSON.stringify({ id: 42, username: "trader" }),
      query_id: "abc",
    });
    const res = validateInitData(initData, TOKEN);
    expect(res.ok).toBe(true);
    expect(res.userId).toBe(42);
    expect(res.username).toBe("trader");
  });

  it("rejects a tampered payload", () => {
    const signed = signInitData({ auth_date: String(now), user: JSON.stringify({ id: 42 }) });
    // Change a field after signing, keeping the original (now-invalid) hash.
    const params = new URLSearchParams(signed);
    params.set("user", JSON.stringify({ id: 999 }));
    expect(validateInitData(params.toString(), TOKEN).ok).toBe(false);
  });

  it("rejects a payload signed with the wrong token", () => {
    const initData = signInitData({ auth_date: String(now), user: JSON.stringify({ id: 1 }) });
    expect(validateInitData(initData, "999:WRONG").ok).toBe(false);
  });

  it("rejects a stale payload", () => {
    const initData = signInitData({
      auth_date: String(now - 7200),
      user: JSON.stringify({ id: 1 }),
    });
    expect(validateInitData(initData, TOKEN, 3600).ok).toBe(false);
  });

  it("rejects empty input", () => {
    expect(validateInitData("", TOKEN).ok).toBe(false);
  });
});
