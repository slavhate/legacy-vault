const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SECRETS_FILE = path.join(DATA_DIR, '.secrets');

function ensureSecrets() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  let secrets = {};
  if (fs.existsSync(SECRETS_FILE)) {
    secrets = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'auto') {
    process.env.JWT_SECRET = secrets.jwt_secret || crypto.randomBytes(32).toString('hex');
    secrets.jwt_secret = process.env.JWT_SECRET;
  }

  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'auto') {
    process.env.ENCRYPTION_KEY = secrets.encryption_key || crypto.randomBytes(32).toString('hex');
    secrets.encryption_key = process.env.ENCRYPTION_KEY;
  }

  fs.writeFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2));
}

module.exports = { ensureSecrets };
