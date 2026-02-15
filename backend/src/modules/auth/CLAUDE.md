# Auth Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements user authentication for Kitchen48:

1. **Email/Password Registration**
   - User registers with email, password, and profile info (first name, last name, phone, country, description)
   - Verification email is sent with a token
   - Token expires in 24 hours

2. **Email Verification**
   - User clicks link in email to verify
   - Can request to resend verification email

3. **Login**
   - Email + password authentication
   - Returns JWT token for authenticated requests
   - Requires email to be verified

4. **Google OAuth**
   - One-click sign-in with Google account
   - Automatically creates user if not exists
   - Links Google account to existing user if email matches

---

## Directory Structure

```
backend/src/modules/auth/
├── CLAUDE.md           # This file
├── auth.types.ts       # TypeScript types and Zod validation schemas
├── auth.service.ts     # Business logic (password hashing, JWT, email verification)
├── auth.controller.ts  # Request handlers
├── auth.routes.ts      # Express routes
└── auth.middleware.ts  # JWT verification middleware
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register with email/password |
| POST | `/api/auth/login` | No | Login with email/password |
| POST | `/api/auth/verify-email` | No | Verify email with token |
| POST | `/api/auth/resend-verification` | No | Resend verification email |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/auth/google` | No | Initiate Google OAuth |
| GET | `/api/auth/google/callback` | No | Google OAuth callback |

### Request/Response Examples

**Register:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "phoneCountry": "US",
  "description": "Food lover"
}
```

**Login:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword"
}

Response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "firstName": "...", "lastName": "...", "emailVerified": true },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## Dependencies

- `bcryptjs` - Password hashing (12 rounds)
- `jsonwebtoken` - JWT token generation/verification
- `passport` - OAuth middleware
- `passport-google-oauth20` - Google OAuth strategy
- `zod` - Input validation

---

## Environment Variables

```env
# JWT
JWT_SECRET="..."        # Min 32 characters
JWT_EXPIRES_IN="7d"     # Token expiry

# Email (Gmail SMTP)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="..."
EMAIL_SERVER_PASSWORD="..." # App-specific password
EMAIL_FROM="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

---

## Patterns & Conventions

1. **Password Security**
   - bcrypt with 12 salt rounds
   - Never store plain text passwords
   - Never log passwords

2. **Token Security**
   - JWT tokens expire (default 7 days)
   - Verification tokens expire in 24 hours
   - Tokens stored securely (not in localStorage in production)

3. **Error Handling**
   - Never reveal if email exists (for privacy)
   - Generic error messages for failed auth
   - Detailed validation errors for input

4. **OAuth Flow**
   - Frontend redirects to `/api/auth/google`
   - After OAuth, backend redirects to frontend with token
   - Frontend stores token and fetches user

---

## Known Issues & Fixes

### Fixed: Google OAuth redirect_uri mismatch in production (2026-01-30)
**Symptom:** Google OAuth fails with "redirect_uri mismatch" error in production.
**Root Cause:** The deploy script had a fallback that constructed an incorrect callback URL using `${APP_SERVICE}-${GCP_PROJECT_ID}.${REGION}.run.app` pattern, which is not a valid Cloud Run URL format.
**Fix:**
1. Updated `scripts/deploy.sh` to require `FRONTEND_DOMAIN` when `GOOGLE_CLIENT_ID` is set
2. Removed the incorrect URL fallback
3. The callback URL must be registered in Google Cloud Console OAuth credentials

**Configuration Required:**
- Set `FRONTEND_DOMAIN=www.kitchen48.com` in `scripts/.env.production`
- Register `https://www.kitchen48.com/api/auth/google/callback` in Google Cloud Console

### Fixed: 502 Bad Gateway / "Cannot GET /api/auth/google" on cold start (2026-02-15)
**Symptom:** Intermittent 502 Bad Gateway when clicking Google login in production, followed by "Cannot GET /api/auth/google" on refresh. Resolves after ~1 minute.
**Root Cause:** Cloud Run cold start + async module loading in `backend/src/index.ts`. The backend takes ~51 seconds to fully load all modules. During this window: (1) nginx gets 502 when Node.js hasn't started yet, (2) Express returns "Cannot GET" for routes not yet mounted. Cloud Run's TCP startup probe on port 8080 (nginx) passes immediately, so traffic is routed before the backend is ready.
**Fix:**
1. `backend/src/index.ts` — Health endpoint returns 503 (not 200) when `serverReady === false`; added catch-all middleware returning 503 for all non-health routes during startup
2. `nginx.conf` — Intercepts 502 from proxy and returns clean 503 JSON
3. `frontend/src/components/WakeUpScreen.tsx` — Full-screen animated "waking up" screen shown during cold starts; polls health endpoint every 4 seconds until backend is ready
4. `frontend/src/App.tsx` — Gates all app interaction behind a health check; prevents users from clicking Google login before backend is ready

---

## TODOs

- [ ] Add password reset flow
- [ ] Add Facebook OAuth
- [ ] Add Instagram OAuth
- [ ] Add refresh token mechanism
- [ ] Add rate limiting for login attempts
- [ ] Add session management (optional)
- [ ] Add 2FA support (future)

---

## Implementation Date

2026-01-24
