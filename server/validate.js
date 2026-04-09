const VALID_SECTIONS = [
  'personal', 'bank_accounts', 'investments', 'retirement', 'insurance',
  'real_estate', 'debts', 'digital', 'vehicles', 'valuables',
  'contacts', 'legal', 'final_wishes', 'secure_notes'
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  return typeof email === 'string' && EMAIL_RE.test(email);
}

function validateSection(section) {
  return VALID_SECTIONS.includes(section);
}

function validateString(val, minLen = 1, maxLen = 1000) {
  return typeof val === 'string' && val.trim().length >= minLen && val.length <= maxLen;
}

function validateInt(val, min = 0, max = Infinity) {
  const n = parseInt(val, 10);
  return !isNaN(n) && n >= min && n <= max;
}

function validationError(res, msg) {
  return res.status(400).json({ error: msg });
}

module.exports = { VALID_SECTIONS, validateEmail, validateSection, validateString, validateInt, validationError };
