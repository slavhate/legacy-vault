const express = require('express');
const { getDb, audit } = require('../db');
const { encrypt, decrypt } = require('../crypto');
const { authenticateToken } = require('../middleware/auth');
const { validateSection, validateString, validationError } = require('../validate');

const router = express.Router();
router.use(authenticateToken);

function decryptEntry(e) {
  let fields;
  try {
    const raw = decrypt(e.fields_encrypted);
    fields = JSON.parse(raw);
  } catch {
    fields = { _error: 'Could not decrypt fields' };
  }
  return {
    id: e.id, user_id: e.user_id, section: e.section, title: e.title,
    fields,
    notes: e.notes_encrypted ? decrypt(e.notes_encrypted) : '',
    created_at: e.created_at, updated_at: e.updated_at
  };
}

router.get('/entries', (req, res) => {
  const { section, page, limit } = req.query;
  if (section && !validateSection(section)) return validationError(res, 'Invalid section');

  const db = getDb();
  const pageNum = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const offset = (pageNum - 1) * pageSize;

  const countSql = section
    ? 'SELECT COUNT(*) as total FROM vault_entries WHERE user_id = ? AND section = ?'
    : 'SELECT COUNT(*) as total FROM vault_entries WHERE user_id = ?';
  const countParams = section ? [req.user.id, section] : [req.user.id];
  const { total } = db.prepare(countSql).get(...countParams);

  const sql = section
    ? 'SELECT * FROM vault_entries WHERE user_id = ? AND section = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    : 'SELECT * FROM vault_entries WHERE user_id = ? ORDER BY section, updated_at DESC LIMIT ? OFFSET ?';
  const params = section ? [req.user.id, section, pageSize, offset] : [req.user.id, pageSize, offset];

  const entries = db.prepare(sql).all(...params).map(decryptEntry);
  res.json({ entries, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.get('/entries/:id', (req, res) => {
  const db = getDb();
  const e = db.prepare('SELECT * FROM vault_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!e) return res.status(404).json({ error: 'Not found' });
  res.json(decryptEntry(e));
});

router.post('/entries', (req, res) => {
  const { section, title, fields, notes } = req.body;
  if (!section || !title || !fields) return validationError(res, 'Section, title, and fields required');
  if (!validateSection(section)) return validationError(res, 'Invalid section');
  if (!validateString(title, 1, 500)) return validationError(res, 'Title must be 1-500 characters');
  if (typeof fields !== 'object') return validationError(res, 'Fields must be an object');
  if (notes && !validateString(notes, 0, 10000)) return validationError(res, 'Notes too long (max 10000 chars)');

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO vault_entries (user_id, section, title, fields_encrypted, notes_encrypted) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user.id, section, title.trim(), encrypt(JSON.stringify(fields)), notes ? encrypt(notes) : null);

  audit(req.user.id, 'create_entry', 'vault_entry', result.lastInsertRowid, section, req.ip);
  res.json({ id: result.lastInsertRowid, section, title: title.trim(), fields, notes });
});

router.put('/entries/:id', (req, res) => {
  const { section, title, fields, notes } = req.body;
  if (!section || !title || !fields) return validationError(res, 'Section, title, and fields required');
  if (!validateSection(section)) return validationError(res, 'Invalid section');
  if (!validateString(title, 1, 500)) return validationError(res, 'Title must be 1-500 characters');
  if (typeof fields !== 'object') return validationError(res, 'Fields must be an object');

  const db = getDb();
  const existing = db.prepare('SELECT id FROM vault_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare(
    'UPDATE vault_entries SET section=?, title=?, fields_encrypted=?, notes_encrypted=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?'
  ).run(section, title.trim(), encrypt(JSON.stringify(fields)), notes ? encrypt(notes) : null, req.params.id, req.user.id);

  audit(req.user.id, 'update_entry', 'vault_entry', +req.params.id, section, req.ip);
  res.json({ id: +req.params.id, section, title: title.trim(), fields, notes });
});

router.delete('/entries/:id', (req, res) => {
  const db = getDb();
  const r = db.prepare('DELETE FROM vault_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
  audit(req.user.id, 'delete_entry', 'vault_entry', +req.params.id, null, req.ip);
  res.json({ success: true });
});

router.get('/summary', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT section, COUNT(*) as count FROM vault_entries WHERE user_id = ? GROUP BY section').all(req.user.id));
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) return validationError(res, 'Search query must be at least 2 characters');

  const db = getDb();
  const all = db.prepare('SELECT * FROM vault_entries WHERE user_id = ? ORDER BY section, updated_at DESC').all(req.user.id);
  const query = q.toLowerCase().trim();
  const results = [];

  for (const e of all) {
    const dec = decryptEntry(e);
    const searchable = [dec.title, dec.notes, ...Object.values(dec.fields || {})].join(' ').toLowerCase();
    if (searchable.includes(query)) results.push(dec);
  }
  res.json(results);
});

router.get('/export', (req, res) => {
  const db = getDb();
  const entries = db.prepare('SELECT * FROM vault_entries WHERE user_id = ? ORDER BY section, title').all(req.user.id);
  const decrypted = entries.map(decryptEntry);
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id);

  audit(req.user.id, 'export_vault', null, null, null, req.ip);
  res.json({ owner: user, exported_at: new Date().toISOString(), entries: decrypted });
});

// ── Backup: download all vault data as JSON ──
router.get('/backup', (req, res) => {
  const db = getDb();
  const entries = db.prepare('SELECT * FROM vault_entries WHERE user_id = ? ORDER BY section, title').all(req.user.id);
  const decrypted = entries.map(decryptEntry);
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(req.user.id);
  const beneficiaries = db.prepare(
    'SELECT name, email, phone, relationship, emergency_waiting_days FROM beneficiaries WHERE user_id = ?'
  ).all(req.user.id);
  const switchConfig = db.prepare('SELECT check_in_interval_days, grace_period_days, is_active FROM dead_switch_config WHERE user_id = ?').get(req.user.id);

  audit(req.user.id, 'backup_vault', null, null, `${decrypted.length} entries`, req.ip);
  res.json({
    version: 1,
    owner: user,
    backed_up_at: new Date().toISOString(),
    entries: decrypted.map(e => ({ section: e.section, title: e.title, fields: e.fields, notes: e.notes })),
    beneficiaries,
    dead_switch: switchConfig || null
  });
});

// ── Restore: import vault data from JSON backup ──
router.post('/restore', (req, res) => {
  const { entries, mode } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) return validationError(res, 'No entries to restore');
  if (entries.length > 500) return validationError(res, 'Too many entries (max 500)');

  const db = getDb();
  const restoreEntries = db.transaction(() => {
    let added = 0, skipped = 0;
    for (const e of entries) {
      if (!e.section || !e.title || !e.fields) { skipped++; continue; }
      if (!validateSection(e.section)) { skipped++; continue; }
      if (typeof e.fields !== 'object') { skipped++; continue; }

      // In 'skip' mode, skip entries with the same section+title
      if (mode !== 'overwrite') {
        const existing = db.prepare(
          'SELECT id FROM vault_entries WHERE user_id = ? AND section = ? AND title = ?'
        ).get(req.user.id, e.section, e.title);
        if (existing) { skipped++; continue; }
      } else {
        // In 'overwrite' mode, delete the existing entry first
        db.prepare(
          'DELETE FROM vault_entries WHERE user_id = ? AND section = ? AND title = ?'
        ).run(req.user.id, e.section, e.title);
      }

      db.prepare(
        'INSERT INTO vault_entries (user_id, section, title, fields_encrypted, notes_encrypted) VALUES (?, ?, ?, ?, ?)'
      ).run(req.user.id, e.section, e.title.trim(), encrypt(JSON.stringify(e.fields)), e.notes ? encrypt(e.notes) : null);
      added++;
    }
    return { added, skipped };
  });

  const result = restoreEntries();
  audit(req.user.id, 'restore_vault', null, null, `added=${result.added} skipped=${result.skipped} mode=${mode || 'skip'}`, req.ip);
  res.json({ success: true, ...result });
});

module.exports = router;
