# Legacy Vault

A self-hosted, encrypted personal data vault designed for estate planning and family continuity. Store your financial accounts, legal documents, insurance policies, and final wishes in one secure place -- and ensure your family can access it when the time comes.

![Node.js](https://img.shields.io/badge/Node.js-22-green)
![Express](https://img.shields.io/badge/Express-5-blue)
![SQLite](https://img.shields.io/badge/SQLite-WAL-lightgrey)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Why Legacy Vault?

When someone passes away unexpectedly, their family often faces a painful scavenger hunt: which banks had accounts? Where are the insurance policies? What are the login credentials? Who is the lawyer?

Legacy Vault solves this by providing a single, encrypted store for all critical personal and financial information, with three secure mechanisms for your family to access it when needed.

## Features

### Vault Storage (15 Sections)
- **Personal Identity** -- IDs, passport, tax numbers
- **Bank Accounts** -- account numbers, branches, nominees
- **Investments** -- stocks, mutual funds, crypto, PPF
- **Retirement** -- EPF, NPS, pension accounts
- **Insurance** -- life, health, auto, property policies
- **Real Estate** -- property details, mortgages, deeds
- **Debts & Liabilities** -- loans, credit cards, informal debts
- **Digital Accounts** -- emails, social media, subscriptions, 2FA details
- **Vehicles** -- registration, VIN, insurance, loans
- **Valuables** -- jewelry, art, safe deposit boxes
- **Important Contacts** -- lawyer, CA, doctor, financial advisor
- **Legal Documents** -- will, power of attorney, certificates
- **Final Wishes** -- funeral, organ donation, messages to family
- **Secure Notes** -- WiFi passwords, alarm codes, anything else
- **Pet Care** -- vet details, dietary needs, rehoming plans

### Three Handover Mechanisms

1. **Dead Man's Switch** -- Set a check-in interval (e.g., 30 days). If you fail to check in within the interval plus a grace period, all beneficiaries are automatically granted access.

2. **Emergency Access Request** -- A beneficiary can request emergency access using their token. The vault owner has a configurable waiting period (1-90 days) to deny the request. If not denied, access is automatically granted.

3. **Direct Token Handover** -- Give a beneficiary their access token directly (e.g., sealed envelope with a lawyer). They can view the vault immediately if you grant access manually.

### Security
- **AES-256-GCM** encryption for all vault data at rest
- **bcrypt** (cost 12) password hashing
- **JWT** authentication with 24-hour expiry
- **Rate limiting** on auth and sensitive endpoints
- **Helmet.js** security headers with strict CSP
- **Audit logging** for all security-relevant actions
- Beneficiary tokens are SHA-256 hashed before storage
- Token expiration (2-year lifetime)
- Transaction-based auto-grant to prevent race conditions

### User Experience
- Dark and light theme with toggle
- Global search across all encrypted entries
- Export vault as printable HTML document
- Backup and restore vault data as JSON
- Toast notifications and loading states
- Onboarding guide for new users
- Responsive design for mobile

## Quick Start

### With Docker (recommended)

```bash
git clone https://github.com/your-username/legacy-vault.git
cd legacy-vault
cp .env.example .env
docker compose up -d
```

The app will be available at `http://localhost:3000`.

### Without Docker

Requires Node.js 20+ and a C/C++ compiler for `better-sqlite3` native bindings.

```bash
git clone https://github.com/your-username/legacy-vault.git
cd legacy-vault
cp .env.example .env
npm install
npm start
```

### Configuration

Edit `.env` to customize:

```env
PORT=3000

# Leave as 'auto' to generate and persist secrets automatically on first run.
# Or set your own values (JWT_SECRET: any string 32+ chars, ENCRYPTION_KEY: 64-char hex).
JWT_SECRET=auto
ENCRYPTION_KEY=auto
```

On first startup, if set to `auto`, the server generates cryptographically secure secrets and persists them to `data/.secrets`. These keys encrypt your vault data -- **back them up** and **never expose them**.

## Demo Data

Seed the vault with fictional sample data to explore all features:

```bash
# 1. Register a user
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo@example.com","password":"DemoPass123!"}'

# 2. Copy the token from the response, then run:
./seed.sh <paste-token-here>
```

> All data in `seed.sh` is entirely fictional. See the disclaimer at the top of the file.

## Project Structure

```
legacy-vault/
├── server/
│   ├── index.js              # Express app, middleware, dead switch scheduler
│   ├── config.js             # Auto-generates and persists secrets
│   ├── crypto.js             # AES-256-GCM encrypt/decrypt
│   ├── db.js                 # SQLite schema, migrations, audit helper
│   ├── logger.js             # Structured JSON logging
│   ├── validate.js           # Input validation utilities
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   └── routes/
│       ├── auth.js           # Register, login, password change
│       ├── vault.js          # CRUD, search, export, backup/restore
│       ├── beneficiaries.js  # Add/remove, grant/revoke, emergency access
│       └── deadswitch.js     # Status, config, check-in
├── public/
│   ├── index.html            # SPA shell
│   ├── css/
│   │   └── style.css         # Dark/light theme, all components
│   └── js/
│       ├── api.js            # API client
│       ├── app.js            # SPA router, views, UI logic
│       └── sections.js       # Vault section definitions and field schemas
├── Dockerfile                # Node 22 Alpine, healthcheck
├── docker-compose.yml        # Single-service with volume mounts
├── backup.sh                 # SQLite backup with integrity check and retention
├── seed.sh                   # Demo data seeder (all fictional)
├── .env.example              # Environment template
├── package.json
├── LICENSE
└── SECURITY.md
```

## API Reference

All endpoints except auth and beneficiary access require a JWT token in the `Authorization: Bearer <token>` header.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/password` | Change password |

### Vault Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vault/entries?section=&page=` | List entries (paginated) |
| GET | `/api/vault/entries/:id` | Get single entry |
| POST | `/api/vault/entries` | Create entry |
| PUT | `/api/vault/entries/:id` | Update entry |
| DELETE | `/api/vault/entries/:id` | Delete entry |
| GET | `/api/vault/summary` | Entry counts by section |
| GET | `/api/vault/search?q=` | Search across all entries |
| GET | `/api/vault/export` | Export all entries (decrypted) |
| GET | `/api/vault/backup` | Download full backup (JSON) |
| POST | `/api/vault/restore` | Restore from backup |

### Beneficiaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beneficiaries` | List beneficiaries |
| POST | `/api/beneficiaries` | Add beneficiary |
| DELETE | `/api/beneficiaries/:id` | Remove beneficiary |
| POST | `/api/beneficiaries/:id/grant` | Grant access |
| POST | `/api/beneficiaries/:id/revoke` | Revoke access |
| POST | `/api/beneficiaries/:id/deny-emergency` | Deny emergency request |
| POST | `/api/beneficiaries/:id/regenerate-token` | Issue new token |
| POST | `/api/beneficiaries/emergency-access` | Request emergency access (no auth) |
| POST | `/api/beneficiaries/access` | Access vault with token (no auth) |

### Dead Man's Switch
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deadswitch/status` | Get switch status and deadlines |
| PUT | `/api/deadswitch/config` | Update interval, grace, active state |
| POST | `/api/deadswitch/checkin` | Check in (reset timer) |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit?page=` | Audit log (paginated) |
| GET | `/health` | Health check (DB connectivity) |

## Backups

### Automated Database Backup

```bash
# Run manually
./backup.sh

# Or schedule via cron (daily at 2 AM, keep 30 backups)
0 2 * * * /path/to/legacy-vault/backup.sh /path/to/backups 30
```

The script uses SQLite's `.backup` command for safe, consistent copies even with WAL mode active, verifies integrity, and prunes old backups beyond the retention count.

### Application-Level Backup

From the UI: **Account Settings > Download Backup** creates a JSON file with all decrypted vault entries, beneficiary list, and dead switch config. Use **Restore from Backup** to import.

> Database backups preserve encrypted data. Application backups contain decrypted data -- handle them with the same care as the vault itself.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 22 (Alpine) |
| Framework | Express 5 |
| Database | SQLite (better-sqlite3) with WAL mode |
| Encryption | AES-256-GCM (Node.js crypto) |
| Auth | JWT + bcrypt |
| Frontend | Vanilla JS SPA |
| Container | Docker (Alpine) |

## Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure no secrets or real personal data are included
5. Open a pull request

See [SECURITY.md](SECURITY.md) for security-related guidelines.

## License

[MIT](LICENSE)

---

> **Disclaimer**: Legacy Vault is a personal project. It is not a substitute for professional estate planning, legal counsel, or financial advice. Use at your own risk. All sample data in this repository is entirely fictional.
