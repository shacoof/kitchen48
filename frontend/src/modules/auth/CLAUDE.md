# Auth Module (Frontend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements the frontend for user authentication:

1. **Registration**
   - Form with validation (email, password, name, phone, country, description)
   - Shows success message after registration
   - Redirects to login after email verification

2. **Login**
   - Email/password form
   - Shows error for unverified emails with resend option
   - Redirects to home after successful login

3. **Email Verification**
   - Handles verification link from email
   - Shows success/error status
   - Links to login page

4. **Google OAuth**
   - One-click sign-in button
   - Handles OAuth callback with token

---

## Directory Structure

```
frontend/src/modules/auth/
├── CLAUDE.md              # This file
├── components/
│   ├── RegisterForm.tsx   # Registration form with validation
│   ├── LoginForm.tsx      # Login form
│   └── SocialLoginButtons.tsx  # Google OAuth button
├── hooks/
│   └── useAuth.ts         # Re-exports useAuth from context
├── pages/
│   ├── RegisterPage.tsx   # /register route
│   ├── LoginPage.tsx      # /login route
│   ├── VerifyEmailPage.tsx    # /verify-email route
│   └── AuthCallbackPage.tsx   # /auth/callback (OAuth return)
└── services/
    └── auth.api.ts        # API client for auth endpoints
```

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/register` | RegisterPage | User registration |
| `/login` | LoginPage | User login |
| `/verify-email` | VerifyEmailPage | Email verification (from email link) |
| `/auth/callback` | AuthCallbackPage | OAuth callback (receives token) |

---

## API Service (`auth.api.ts`)

Singleton class that handles all auth API calls:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `register(input)` | POST `/api/auth/register` | Register new user |
| `login(input)` | POST `/api/auth/login` | Login, stores token |
| `logout()` | (client-side) | Clears token from localStorage |
| `verifyEmail(token)` | POST `/api/auth/verify-email` | Verify email |
| `resendVerification(email)` | POST `/api/auth/resend-verification` | Resend verification |
| `getCurrentUser()` | GET `/api/auth/me` | Get current user |
| `getGoogleAuthUrl()` | (returns URL) | Returns `/api/auth/google` |

Token is stored in `localStorage` as `auth_token`.

---

## State Management

Uses React Context (`AuthContext`) for global auth state:

```tsx
import { useAuth } from '../../context/AuthContext';

const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();
```

---

## Patterns & Conventions

### Form Validation
- Uses `react-hook-form` with `zod` schemas
- Validation errors shown inline under each field

### OAuth Flow
1. User clicks "Sign in with Google" → redirects to `/api/auth/google`
2. Google authenticates → redirects to `/api/auth/google/callback`
3. Backend generates JWT → redirects to `/auth/callback?token=...`
4. `AuthCallbackPage` extracts token, stores it, redirects to home

### Styling
- Tailwind CSS with custom theme colors
- Primary action: `bg-accent-orange` / `hover:bg-orange-600`
- Focus: `ring-accent-orange`

---

## Known Issues & TODOs

- [ ] Add "Forgot password" flow
- [ ] Add password strength indicator
- [ ] Add "Remember me" checkbox
- [ ] Improve mobile responsiveness

---

## Implementation Date

2026-01-24
