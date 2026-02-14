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

- `hls.js` — HLS video playback for non-Safari browsers
- `tus-js-client` — Resumable video uploads (TUS protocol)

Both are dynamically imported for code splitting.

---

## Implementation Date

2026-02-14
