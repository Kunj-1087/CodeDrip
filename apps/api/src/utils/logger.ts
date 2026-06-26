// =============================================================================
// Structured logger. Emits one JSON object per line (machine-parseable for any
// log aggregator) instead of free-form console strings — the same shape Pino
// produces, without the dependency. Kept zero-dep to match this codebase's style
// (custom .env loader, no ORM); swap in Pino later by re-implementing these four
// methods if richer transport/sampling is needed.
//
// Critical guarantee: secrets are NEVER written. Any field whose key looks
// sensitive (password, token, cookie, secret, card, cvv...) is redacted
// recursively before serialization, so accidentally logging a request body or
// auth payload can't leak credentials.
// =============================================================================
type Level = 'debug' | 'info' | 'warn' | 'error';
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Minimum level is LOG_LEVEL (default info). Read straight from process.env so we
// don't have to widen the validated env schema for an operational knob.
const MIN = ORDER[(process.env.LOG_LEVEL as Level) in ORDER ? (process.env.LOG_LEVEL as Level) : 'info'];

// Substring match (case-insensitive) against object keys we must never log.
const SENSITIVE = /pass(word)?|token|secret|cookie|authorization|auth|cvv|card(number)?|otp|pin/i;
const REDACTED = '[redacted]';

// Recursively copy a context object, masking sensitive keys. Depth-bounded so a
// cyclic or pathological object can't hang the logger.
function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE.test(k) ? REDACTED : redact(v, depth + 1);
  }
  return out;
}

function emit(level: Level, msg: string, context?: Record<string, unknown>) {
  if (ORDER[level] < MIN) return;
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    msg,
    ...(context ? (redact(context) as Record<string, unknown>) : {}),
  });
  // Errors/warnings to stderr, the rest to stdout — standard 12-factor streams.
  if (level === 'error' || level === 'warn') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => emit('debug', msg, context),
  info: (msg: string, context?: Record<string, unknown>) => emit('info', msg, context),
  warn: (msg: string, context?: Record<string, unknown>) => emit('warn', msg, context),
  error: (msg: string, context?: Record<string, unknown>) => emit('error', msg, context),
};
