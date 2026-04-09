# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Legacy Vault, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainers directly or use GitHub's private vulnerability reporting feature.

## Security Architecture

### Encryption
- All vault entry fields and notes are encrypted at rest using **AES-256-GCM**
- Encryption keys are auto-generated on first run and stored in `data/.secrets` (excluded from git)
- Each encrypted value uses a unique random IV

### Authentication
- Passwords are hashed with **bcrypt** (cost factor 12)
- Sessions use **JWT** tokens with 24-hour expiry
- Rate limiting is applied to auth endpoints (20 requests per 15 minutes)

### Access Control
- Beneficiary access tokens are SHA-256 hashed before storage
- Tokens expire after 2 years
- Emergency access has a configurable waiting period (1-90 days)
- The vault owner can deny emergency requests during the waiting period

### Headers & Transport
- **Helmet.js** sets secure HTTP headers including CSP, X-Frame-Options, etc.
- Content Security Policy restricts script and resource origins

## Important Notes

- **Never commit the `data/` directory** -- it contains the database and encryption keys
- **Never commit `.env` files** with real secrets
- The `.gitignore` is configured to exclude sensitive files, but always verify before pushing
- If you suspect encryption keys have been exposed, rotate them immediately (this will make existing encrypted data unreadable)
- All security-relevant actions are recorded in the audit log
