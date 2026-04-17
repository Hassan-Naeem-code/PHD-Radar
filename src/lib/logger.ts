type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): Level {
  const raw = (process.env.LOG_LEVEL ?? "").toLowerCase() as Level;
  if (raw && raw in LEVEL_ORDER) return raw;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function shouldLog(level: Level): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel()];
}

function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (/password|secret|token|cookie|authorization/i.test(k)) {
      out[k] = "[redacted]";
    } else if (v && typeof v === "object") {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level: Level, msg: string, fields?: Fields) {
  if (!shouldLog(level)) return;

  const record = {
    level,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "development",
    msg,
    ...(fields ? (redact(fields) as Fields) : {}),
  };

  const line = JSON.stringify(record);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields & { err?: unknown }): void;
  child(fields: Fields): Logger;
}

function makeLogger(baseFields: Fields = {}): Logger {
  const merge = (f?: Fields) => ({ ...baseFields, ...(f ?? {}) });
  return {
    debug: (m, f) => emit("debug", m, merge(f)),
    info: (m, f) => emit("info", m, merge(f)),
    warn: (m, f) => emit("warn", m, merge(f)),
    error: (m, f) => {
      const out = merge(f);
      if (f?.err instanceof Error) {
        out.err = {
          name: f.err.name,
          message: f.err.message,
          stack: f.err.stack,
        };
      }
      emit("error", m, out);
    },
    child: (fields) => makeLogger({ ...baseFields, ...fields }),
  };
}

export const logger = makeLogger();
