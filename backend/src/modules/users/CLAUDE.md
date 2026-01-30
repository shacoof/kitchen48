# Users Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module manages user profiles and nicknames for Kitchen48:

1. **Public Profile by Nickname**
   - Get user's public profile via semantic URL (e.g., `/api/users/jsmith`)
   - Returns public info only (no sensitive data)

2. **Own Profile Management**
   - Get current user's full profile
   - Update own profile (nickname, etc.)
   - Nickname validation (3-30 chars, alphanumeric + underscore, lowercase)

3. **Nickname Generation**
   - Auto-generated on registration: first letter of firstName + lastName
   - If collision, append incrementing number (jsmith, jsmith2, jsmith3)
   - User can change nickname (must be unique)

4. **Admin User Management**
   - List all users (admin only)
   - Update any user (admin only)
   - View user details (admin only)

---

## Directory Structure

```
backend/src/modules/users/
├── CLAUDE.md           # This file
├── users.types.ts      # TypeScript types and Zod validation schemas
├── users.service.ts    # Business logic (nickname generation, profile CRUD)
├── users.controller.ts # Request handlers
└── users.routes.ts     # Express routes
```

---

## API Endpoints

### Public Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/:nickname` | No | Get public profile by nickname |

### Authenticated Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/profile` | Yes | Get own full profile |
| PUT | `/api/users/me/profile` | Yes | Update own profile |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/users/:id` | Admin | Get user by ID |
| PUT | `/api/admin/users/:id` | Admin | Update user |

---

## Patterns & Conventions

### Nickname Validation
- Length: 3-30 characters
- Characters: lowercase alphanumeric and underscore only
- Pattern: `/^[a-z][a-z0-9_]{2,29}$/`
- Must start with a letter
- Must be unique

### Nickname Generation Algorithm
```typescript
function generateNickname(firstName: string, lastName: string): string {
  // 1. Base: first letter of firstName + full lastName
  const base = (firstName[0] + lastName).toLowerCase().replace(/[^a-z0-9]/g, '');

  // 2. Check if exists
  let nickname = base;
  let counter = 2;

  while (await nicknameExists(nickname)) {
    nickname = `${base}${counter}`;
    counter++;
  }

  return nickname;
}
```

### Public vs Private Data
**Public Profile (returned to anyone):**
- id, firstName, lastName, nickname, profilePicture, description

**Full Profile (returned to owner/admin):**
- All public fields + email, phone, phoneCountry, emailVerified, userType, createdAt

---

## Known Issues & Fixes

### 2026-01-30: Admin user update validation failing for cleared fields

**Symptom:** Admin users screen updates not saving to database. Tabulator shows "Error updating user" toast.

**Root Cause:** Zod validation schema rejected empty strings. When a user clears a field in Tabulator's inline editor, it sends `""` (empty string), but the schema used `.min(1)` which fails for empty strings. The schema didn't account for this Tabulator behavior.

**Technical Details:**
- Tabulator sends `""` when a field is cleared
- `z.string().min(1).optional().nullable()` fails for `""` because:
  - Empty string is not `undefined` (so `.optional()` doesn't help)
  - Empty string is not `null` (so `.nullable()` doesn't help)
  - Empty string fails `.min(1)` validation

**Fix Applied:** Added `z.preprocess()` layer to convert empty strings to null before validation:

```typescript
const emptyStringToNull = (val: unknown) => (val === '' ? null : val);

export const adminUpdateUserSchema = z.object({
  firstName: z.preprocess(emptyStringToNull, z.string().min(1).optional().nullable()),
  // ... other fields
});
```

**Files Modified:**
- `users.types.ts` - Added `emptyStringToNull` helper and updated all schemas

**Lesson Learned:** When integrating with Tabulator (or any grid that sends empty strings for cleared fields), always use `z.preprocess()` to normalize input before Zod validation.

---

## Implementation Date

2026-01-30
