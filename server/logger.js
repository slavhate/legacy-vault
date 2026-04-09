const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[LOG_LEVEL] ?? 2;

function log(level, message, meta = {}) {
  if ((LEVELS[level] ?? 2) > threshold) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...meta
  };
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
  // Express request logger middleware
  requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
      log('info', 'request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Date.now() - start,
        ip: req.ip
      });
    });
    next();
  }
};
