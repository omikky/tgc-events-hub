// Tiny dependency-free structured logger. Keeps the bot's output readable
// and greppable without pulling in a logging framework.

type Level = "debug" | "info" | "warn" | "error";

const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const threshold = ORDER[(process.env.LOG_LEVEL as Level) ?? "info"] ?? ORDER.info;

function emit(level: Level, msg: string, extra?: Record<string, unknown>) {
  if (ORDER[level] < threshold) return;
  const ts = new Date().toISOString();
  const tail = extra && Object.keys(extra).length ? " " + JSON.stringify(extra) : "";
  const line = `[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}${tail}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (m: string, e?: Record<string, unknown>) => emit("debug", m, e),
  info: (m: string, e?: Record<string, unknown>) => emit("info", m, e),
  warn: (m: string, e?: Record<string, unknown>) => emit("warn", m, e),
  error: (m: string, e?: Record<string, unknown>) => emit("error", m, e),
};
