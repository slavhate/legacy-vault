const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb, audit } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { validateEmail, validateString, validationError } = require('../validate');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return validationError(res, 'All fields required');
    if (!validateEmail(email)) return validationError(res, 'Invalid email format');
    if (!validateString(name, 1, 200)) return validationError(res, 'Name must be 1-200 characters');
    if (!validateString(password, 8, 128)) return validationError(res, 'Password must be 8-128 characters');

    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim())) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)').run(cleanEmail, hash, name.trim());
    db.prepare('INSERT INTO dead_switch_config (user_id) VALUES (?)').run(result.lastInsertRowid);

    audit(result.lastInsertRowid, 'register', 'user', result.lastInsertRowid, null, req.ip);
    const token = jwt.sign({ id: result.lastInsertRowid, email: cleanEmail, name: name.trim() }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: result.lastInsertRowid, email: cleanEmail, name: name.trim() } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return validationError(res, 'Email and password required');

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      audit(null, 'login_failed', 'user', null, email, req.ip);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    audit(user.id, 'login', 'user', user.id, null, req.ip);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, totp_enabled, created_at, last_check_in FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) return validationError(res, 'Both current and new password required');
    if (!validateString(new_password, 8, 128)) return validationError(res, 'New password must be 8-128 characters');

    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!(await bcrypt.compare(current_password, user.password_hash))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(new_password, 12);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id);
    audit(req.user.id, 'password_change', 'user', req.user.id, null, req.ip);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router;
