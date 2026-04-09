const express = require('express');
const { getDb, audit } = require('../db');
const { generateAccessToken, hashToken, decrypt } = require('../crypto');
const { authenticateToken } = require('../middleware/auth');
const { validateString, validateEmail, validateInt, validationError } = require('../validate');

const router = express.Router();

const TOKEN_LIFETIME_DAYS = 730; // 2 years

function tokenExpiresAt() {
  return new Date(Date.now() + TOKEN_LIFETIME_DAYS * 86400000).toISOString();
}

function isTokenExpired(b) {
  return b.token_expires_at && new Date() > new Date(b.token_expires_at);
}

// ── Owner endpoints ──

router.get('/', authenticateToken, (req, res) => {
  const db = getDb();
  res.json(db.prepare(
    `SELECT id, name, email, phone, relationship, emergency_access_requested,
     emergency_access_requested_at, emergency_waiting_days, access_granted,
     access_granted_at, token_expires_at, created_at
     FROM beneficiaries WHERE user_id = ?`
  ).all(req.user.id));
});

router.post('/', authenticateToken, (req, res) => {
  const { name, email, phone, relationship, emergency_waiting_days } = req.body;
  if (!validateString(name, 1, 200)) return validationError(res, 'Name is required (max 200 chars)');
  if (email && !validateEmail(email)) return validationError(res, 'Invalid email format');
  const waitDays = parseInt(emergency_waiting_days) || 7;
  if (waitDays < 1 || waitDays > 90) return validationError(res, 'Wait period must be 1-90 days');

  const db = getDb();
  const token = generateAccessToken();
  const expires = tokenExpiresAt();
  const result = db.prepare(
    'INSERT INTO beneficiaries (user_id, name, email, phone, relationship, access_token, token_expires_at, emergency_waiting_days) VALUES (?,?,?,?,?,?,?,?)'
  ).run(req.user.id, name.trim(), email || null, phone || null, relationship || null, hashToken(token), expires, waitDays);

  audit(req.user.id, 'add_beneficiary', 'beneficiary', result.lastInsertRowid, name.trim(), req.ip);
  res.json({ id: result.lastInsertRowid, name: name.trim(), email, phone, relationship, accessToken: token, token_expires_at: expires, emergency_waiting_days: waitDays });
});

router.delete('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM beneficiaries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  audit(req.user.id, 'remove_beneficiary', 'beneficiary', +req.params.id, null, req.ip);
  res.json({ success: true });
});

router.post('/:id/deny-emergency', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE beneficiaries SET emergency_access_requested = 0, emergency_access_requested_at = NULL WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  audit(req.user.id, 'deny_emergency', 'beneficiary', +req.params.id, null, req.ip);
  res.json({ success: true });
});

router.post('/:id/grant', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE beneficiaries SET access_granted = 1, access_granted_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  audit(req.user.id, 'grant_access', 'beneficiary', +req.params.id, null, req.ip);
  res.json({ success: true });
});

router.post('/:id/revoke', authenticateToken, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE beneficiaries SET access_granted = 0, access_granted_at = NULL, emergency_access_requested = 0, emergency_access_requested_at = NULL WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  audit(req.user.id, 'revoke_access', 'beneficiary', +req.params.id, null, req.ip);
  res.json({ success: true });
});

router.post('/:id/regenerate-token', authenticateToken, (req, res) => {
  const db = getDb();
  const token = generateAccessToken();
  const expires = tokenExpiresAt();
  const r = db.prepare('UPDATE beneficiaries SET access_token = ?, token_expires_at = ? WHERE id = ? AND user_id = ?').run(hashToken(token), expires, req.params.id, req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  audit(req.user.id, 'regenerate_token', 'beneficiary', +req.params.id, null, req.ip);
  res.json({ accessToken: token, token_expires_at: expires });
});

// ── Beneficiary endpoints (no auth, uses access token) ──

function lookupBeneficiary(accessToken) {
  const db = getDb();
  const b = db.prepare('SELECT * FROM beneficiaries WHERE access_token = ?').get(hashToken(accessToken));
  if (!b) return { error: 'Invalid access token' };
  if (isTokenExpired(b)) return { error: 'Access token has expired. Contact the vault owner for a new one.' };
  return { beneficiary: b };
}

router.post('/emergency-access', (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return validationError(res, 'Access token required');

  const { beneficiary: b, error } = lookupBeneficiary(accessToken);
  if (error) return res.status(404).json({ error });
  if (b.access_granted) return res.json({ status: 'already_granted' });
  if (b.emergency_access_requested) return res.json({ status: 'already_requested', requested_at: b.emergency_access_requested_at });

  const db = getDb();
  db.prepare('UPDATE beneficiaries SET emergency_access_requested = 1, emergency_access_requested_at = CURRENT_TIMESTAMP WHERE id = ?').run(b.id);
  audit(null, 'emergency_request', 'beneficiary', b.id, b.name, req.ip);
  res.json({ status: 'requested', waiting_days: b.emergency_waiting_days });
});

router.post('/access', (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return validationError(res, 'Access token required');

  const { beneficiary: b, error } = lookupBeneficiary(accessToken);
  if (error) return res.status(404).json({ error });

  const db = getDb();

  // Use a transaction to prevent race conditions on auto-grant
  const tryAutoGrant = db.transaction(() => {
    // Re-read inside transaction for consistency
    const fresh = db.prepare('SELECT * FROM beneficiaries WHERE id = ?').get(b.id);
    if (fresh.access_granted) return true;

    // Auto-grant if emergency waiting period elapsed
    if (fresh.emergency_access_requested) {
      const waitUntil = new Date(new Date(fresh.emergency_access_requested_at).getTime() + fresh.emergency_waiting_days * 86400000);
      if (new Date() >= waitUntil) {
        db.prepare('UPDATE beneficiaries SET access_granted = 1, access_granted_at = CURRENT_TIMESTAMP WHERE id = ? AND access_granted = 0').run(fresh.id);
        audit(null, 'emergency_auto_grant', 'beneficiary', fresh.id, fresh.name, req.ip);
        return true;
      }
    }

    // Auto-grant if dead man's switch triggered
    const sw = db.prepare('SELECT switch_triggered FROM dead_switch_config WHERE user_id = ?').get(fresh.user_id);
    if (sw && sw.switch_triggered) {
      db.prepare('UPDATE beneficiaries SET access_granted = 1, access_granted_at = CURRENT_TIMESTAMP WHERE id = ? AND access_granted = 0').run(fresh.id);
      audit(null, 'deadswitch_auto_grant', 'beneficiary', fresh.id, fresh.name, req.ip);
      return true;
    }

    return false;
  });

  const granted = tryAutoGrant();

  if (!granted) {
    let waitInfo = null;
    if (b.emergency_access_requested) {
      const waitUntil = new Date(new Date(b.emergency_access_requested_at).getTime() + b.emergency_waiting_days * 86400000);
      waitInfo = { requested_at: b.emergency_access_requested_at, access_at: waitUntil.toISOString() };
    }
    return res.json({ status: b.emergency_access_requested ? 'waiting' : 'no_access', beneficiary: { name: b.name }, waitInfo });
  }

  // Access granted — return full vault
  const owner = db.prepare('SELECT name, email FROM users WHERE id = ?').get(b.user_id);
  const entries = db.prepare('SELECT * FROM vault_entries WHERE user_id = ? ORDER BY section, updated_at DESC').all(b.user_id).map(e => {
    let fields;
    try { fields = JSON.parse(decrypt(e.fields_encrypted)); } catch { fields = { _error: 'Decryption failed' }; }
    return {
      id: e.id, section: e.section, title: e.title, fields,
      notes: e.notes_encrypted ? decrypt(e.notes_encrypted) : '',
      created_at: e.created_at, updated_at: e.updated_at
    };
  });

  audit(null, 'vault_accessed', 'beneficiary', b.id, `${b.name} viewed vault of user ${b.user_id}`, req.ip);
  res.json({ status: 'granted', owner, beneficiary: { name: b.name, relationship: b.relationship }, entries });
});

module.exports = router;
