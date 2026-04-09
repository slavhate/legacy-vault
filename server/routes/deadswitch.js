const express = require('express');
const { getDb, audit } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { validateInt, validationError } = require('../validate');

const router = express.Router();
router.use(authenticateToken);

router.get('/status', (req, res) => {
  const db = getDb();
  const config = db.prepare('SELECT * FROM dead_switch_config WHERE user_id = ?').get(req.user.id);
  const user = db.prepare('SELECT last_check_in FROM users WHERE id = ?').get(req.user.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });

  const last = new Date(user.last_check_in);
  const next = new Date(last.getTime() + config.check_in_interval_days * 86400000);
  const grace = new Date(next.getTime() + config.grace_period_days * 86400000);

  res.json({
    ...config,
    last_check_in: user.last_check_in,
    next_check_in: next.toISOString(),
    grace_deadline: grace.toISOString(),
    is_overdue: new Date() > next,
    is_past_grace: new Date() > grace
  });
});

router.put('/config', (req, res) => {
  const { check_in_interval_days, grace_period_days, is_active } = req.body;
  const interval = parseInt(check_in_interval_days) || 30;
  const grace = parseInt(grace_period_days) || 7;
  if (!validateInt(interval, 1, 365)) return validationError(res, 'Check-in interval must be 1-365 days');
  if (!validateInt(grace, 1, 90)) return validationError(res, 'Grace period must be 1-90 days');

  const db = getDb();
  db.prepare(
    'UPDATE dead_switch_config SET check_in_interval_days=?, grace_period_days=?, is_active=? WHERE user_id=?'
  ).run(interval, grace, is_active ? 1 : 0, req.user.id);

  if (is_active) {
    db.prepare('UPDATE users SET last_check_in = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);
    db.prepare('UPDATE dead_switch_config SET switch_triggered = 0, switch_triggered_at = NULL WHERE user_id = ?').run(req.user.id);
  }
  audit(req.user.id, is_active ? 'deadswitch_activate' : 'deadswitch_deactivate', 'dead_switch', null, `interval=${interval}d grace=${grace}d`, req.ip);
  res.json({ success: true });
});

router.post('/checkin', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET last_check_in = CURRENT_TIMESTAMP WHERE id = ?').run(req.user.id);
  db.prepare('UPDATE dead_switch_config SET switch_triggered = 0, switch_triggered_at = NULL WHERE user_id = ?').run(req.user.id);
  audit(req.user.id, 'checkin', 'dead_switch', null, null, req.ip);
  res.json({ success: true, checked_in_at: new Date().toISOString() });
});

module.exports = router;
