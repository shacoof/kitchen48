# Media Module (Frontend) - CLAUDE.md

Frontend components for media upload and playback via Cloudflare Stream + Images.

---

## Directory Structure

```
frontend/src/modules/media/
├── CLAUDE.md
├── services/
│   └── media.api.ts        # API client for media endpoints
├── hooks/
│   └── useMediaUpload.ts   # Upload lifecycle state management
└── components/
    ├── ImageUpload.tsx      # Drag-and-drop image upload with preview
    ├── VideoUpload.tsx      # Video upload with TUS resumable + progress
    └── VideoPlayer.tsx      # HLS video player (hls.js + Safari native)
```

---

## Usage Patterns

### Image Upload
```tsx
import { ImageUpload } from '../../media/components/ImageUpload';

<ImageUpload
  context="recipe"
  entityId={recipeId}
  existingAsset={recipe.heroImage}
  onUploadComplete={(asset) => setHeroImageId(asset.id)}
  onRemove={() => setHeroImageId(null)}
/>
```

### Video Upload
```tsx
import { VideoUpload } from '../../media/components/VideoUpload';

<VideoUpload
  context="step"
  entityId={stepId}
  existingAsset={step.video}
  onUploadComplete={(asset) => setVideoId(asset.id)}
  onRemove={() => setVideoId(null)}
/>
```

### Video Player
```tsx
import { VideoPlayer } from '../../media/components/VideoPlayer';

<VideoPlayer
  src={recipe.introVideo?.url || ''}
  poster={recipe.introVideo?.thumbnailUrl}
/>
```

---

## Dependencies

- `hls.js` — HLS video playback for non-Safari browsers (dynamically imported for code splitting)

### Upload Strategy

Videos use simple FormData POST uploads (same as images) to Cloudflare's direct upload URL.
TUS resumable uploads were evaluated but dropped — recipe videos are short (1-3 min, <200MB)
and simple uploads are more reliable with less complexity.

### Fixes Applied

#### 2026-02-14: Video upload TUS 400 error — switched to simple upload
- **Bug**: Video upload failed with "Decoding Error" when tus-js-client POSTed to Cloudflare's direct upload URL
- **Root Cause**: Cloudflare's `/stream/direct_upload` returns a URL for simple form uploads, not TUS creation. tus-js-client sent a TUS creation POST which Cloudflare couldn't decode.
- **Fix**: Replaced TUS upload with simple XHR FormData POST (same pattern as image uploads). Removed `tus-js-client` dependency. Max video size set to 200MB.

---

## Implementation Date

2026-02-14
