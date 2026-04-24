require('dotenv').config({ debug: false });
const { ensureSecrets } = require('./config');
ensureSecrets();

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { getDb, audit } = require('./db');
const log = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      scriptSrcAttr: ["'none'"]
    }
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(log.requestLogger);

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/beneficiaries/emergency-access', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use('/api/beneficiaries/access', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/health', (req, res) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// Audit log endpoint (owner only)
const { authenticateToken } = require('./middleware/auth');
app.get('/api/audit', authenticateToken, (req, res) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  const { total } = db.prepare('SELECT COUNT(*) as total FROM audit_log WHERE user_id = ? OR user_id IS NULL').get(req.user.id);
  const logs = db.prepare(
    'SELECT * FROM audit_log WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(req.user.id, limit, offset);
  res.json({ logs, total, page, pages: Math.ceil(total / limit) });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/deadswitch', require('./routes/deadswitch'));

// Dead man's switch background check — runs every hour
function checkDeadSwitches() {
  try {
    const db = getDb();
    const triggerSwitch = db.transaction(() => {
      const configs = db.prepare(
        `SELECT dsc.*, u.last_check_in FROM dead_switch_config dsc
         JOIN users u ON dsc.user_id = u.id
         WHERE dsc.is_active = 1 AND dsc.switch_triggered = 0`
      ).all();

      for (const c of configs) {
        const deadline = new Date(c.last_check_in);
        deadline.setDate(deadline.getDate() + c.check_in_interval_days + c.grace_period_days);
        if (new Date() > deadline) {
          db.prepare('UPDATE dead_switch_config SET switch_triggered = 1, switch_triggered_at = CURRENT_TIMESTAMP WHERE id = ?').run(c.id);
          db.prepare('UPDATE beneficiaries SET access_granted = 1, access_granted_at = CURRENT_TIMESTAMP WHERE user_id = ? AND access_granted = 0').run(c.user_id);
          audit(c.user_id, 'deadswitch_triggered', 'dead_switch', c.id, null, null);
          log.warn('Dead man\'s switch triggered', { user_id: c.user_id, switch_id: c.id });
        }
      }
    });
    triggerSwitch();
  } catch (err) {
    log.error('Dead switch check error', { error: err.message });
  }
}

setInterval(checkDeadSwitches, 60 * 60 * 1000);

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

getDb();
app.listen(PORT, () => {
  log.info('Legacy Vault started', { port: PORT });
  checkDeadSwitches();
});
