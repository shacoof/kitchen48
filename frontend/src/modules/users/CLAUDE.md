# Users Module (Frontend) - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module handles user profile UI for Kitchen48:

1. **Public Profile Page** (`/:nickname`)
   - Display user's public profile
   - Shows name, profile photo (Cloudflare > legacy), intro video via VideoPlayer, description
   - Accessible to anyone via semantic URL

2. **Edit Profile Page** (`/profile/edit`)
   - Edit own profile (nickname, name, description)
   - Upload/change profile photo via Cloudflare ImageUpload
   - Upload/change intro video via Cloudflare VideoUpload
   - Requires authentication

3. **Profile Media (Cloudflare)**
   - Profile photo via `ImageUpload` component (context: "profile")
   - Intro video via `VideoUpload` component
   - Both save immediately on upload (no form submit needed)
   - Backward compat: `profilePicture` (legacy URL string) still displayed as fallback

4. **UserCard Component**
   - Reusable card for displaying users in grids
   - Media priority: profilePhoto > profilePicture > introVideo thumbnail > placeholder
   - Play overlay on hover when video exists; inline VideoPlayer on click

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
    ├── ProfilePictureUpload.tsx  # Legacy upload component (kept for compat)
    └── UserCard.tsx              # Card with media priority + inline video

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
// Get public profile by nickname (includes profilePhoto, introVideo)
usersApi.getPublicProfile(nickname: string)

// Get own full profile (includes profilePhotoId, introVideoId + media assets)
usersApi.getOwnProfile()

// Update own profile (accepts profilePhotoId, introVideoId)
usersApi.updateProfile(data: UpdateProfileInput)

// Upload profile picture (legacy, local file storage)
usersApi.uploadProfilePicture(file: File)
```

---

## Patterns & Conventions

### Media Priority (same pattern as Recipe cards)
- Image source: `profilePhoto.url > profilePicture > introVideo.thumbnailUrl > placeholder`
- Only use Cloudflare assets when `status === 'ready'`

### UserAvatar Component
- Uses `profilePicture` URL if available (accepts Cloudflare URL or legacy URL)
- Falls back to Kitchen48 logo if no picture
- Accepts `size` prop for different sizes (sm, md, lg, xl)

### Profile Media Upload (EditProfilePage)
- Uses Cloudflare `ImageUpload` and `VideoUpload` components from media module
- Auto-saves to backend on upload complete (no form submit required)
- Calls `usersApi.updateProfile({ profilePhotoId })` immediately

### Form Handling
- Uses react-hook-form for form state
- Zod for client-side validation
- Matches backend validation rules

---

## Known Issues & Fixes

### 2026-02-14: Added Cloudflare media support for users
- Added `profilePhotoId` and `introVideoId` fields to User model
- Backend queries join `profilePhoto` and `introVideo` media assets
- EditProfilePage uses `ImageUpload` + `VideoUpload` (Cloudflare)
- UserProfilePage displays Cloudflare photo with legacy fallback + VideoPlayer for intro
- Created `UserCard` component with same media priority as `RecipeCard`

---

## Implementation Date

2026-01-30 (initial), 2026-02-14 (Cloudflare media)
