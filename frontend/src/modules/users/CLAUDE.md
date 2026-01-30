# Users Module (Frontend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module handles user profile UI for Kitchen48:

1. **Public Profile Page** (`/:nickname`)
   - Display user's public profile
   - Shows name, profile picture, description
   - Accessible to anyone via semantic URL

2. **Edit Profile Page** (`/profile/edit`)
   - Edit own profile (nickname, name, description)
   - Upload/change profile picture
   - Requires authentication

3. **Profile Picture**
   - Display user avatar with Kitchen48 logo fallback
   - Upload new picture with preview
   - Delete existing picture

---

## Directory Structure

```
frontend/src/modules/users/
├── CLAUDE.md            # This file
├── services/
│   └── users.api.ts     # API service for user operations
├── pages/
│   ├── UserProfilePage.tsx    # Public profile page (/:nickname)
│   └── EditProfilePage.tsx    # Edit own profile (/profile/edit)
└── components/
    └── ProfilePictureUpload.tsx  # Upload component with preview

frontend/src/components/common/
└── UserAvatar.tsx       # Reusable avatar with K48 logo fallback
```

---

## Routes

| Route | Component | Auth | Description |
|-------|-----------|------|-------------|
| `/:nickname` | UserProfilePage | No | Public profile page |
| `/profile/edit` | EditProfilePage | Yes | Edit own profile |

---

## API Service Methods

```typescript
// Get public profile by nickname
usersApi.getPublicProfile(nickname: string)

// Get own full profile
usersApi.getOwnProfile()

// Update own profile
usersApi.updateProfile(data: UpdateProfileInput)

// Upload profile picture
usersApi.uploadProfilePicture(file: File)
```

---

## Patterns & Conventions

### UserAvatar Component
- Uses `profilePicture` URL if available
- Falls back to Kitchen48 logo if no picture
- Accepts `size` prop for different sizes (sm, md, lg)

### Profile Picture Upload
- Preview before upload
- Progress indicator during upload
- Error handling with user feedback
- Auto-updates avatar after successful upload

### Form Handling
- Uses react-hook-form for form state
- Zod for client-side validation
- Matches backend validation rules

---

## Implementation Date

2026-01-30
