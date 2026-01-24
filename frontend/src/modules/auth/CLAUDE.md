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
│   ├── LoginForm.tsx      # Login form with validation
│   └── SocialLoginButtons.tsx  # OAuth buttons
├── hooks/
│   └── useAuth.ts         # Re-exports useAuth from context
├── pages/
│   ├── RegisterPage.tsx   # Registration page
│   ├── LoginPage.tsx      # Login page
│   ├── VerifyEmailPage.tsx    # Email verification page
│   └── AuthCallbackPage.tsx   # OAuth callback handler
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

## Components

### RegisterForm
- Uses react-hook-form with zod validation
- Fields: firstName, lastName, email, password, confirmPassword, phone, phoneCountry, description
- Shows success message after registration (user must verify email)

### LoginForm
- Uses react-hook-form with zod validation
- Fields: email, password
- Shows resend verification option if email not verified

### SocialLoginButtons
- Google OAuth button
- Redirects to `/api/auth/google`

---

## State Management

Uses React Context (`AuthContext`) for global auth state:

```tsx
const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();
```

Token is stored in localStorage and sent as Bearer token in API requests.

---

## Dependencies

- `react-router-dom` - Routing
- `react-hook-form` - Form handling
- `@hookform/resolvers` - Zod integration
- `zod` - Schema validation

---

## Styling

Uses Tailwind CSS with orange color scheme:
- Primary: `orange-500` / `orange-600`
- Focus ring: `ring-orange-500`

---

## Known Issues & TODOs

- [ ] Add "Remember me" checkbox
- [ ] Add "Forgot password" flow
- [ ] Add form field error animations
- [ ] Add loading skeletons
- [ ] Add password strength indicator
- [ ] Improve mobile responsiveness

---

## Implementation Date

2026-01-24
