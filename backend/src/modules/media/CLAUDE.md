# Media Module - CLAUDE.md

Module for managing media assets (images and videos) via Cloudflare Stream and Images.

---

## Requirements

- Upload images and videos for recipes (hero image, intro video, step images, step videos)
- Store media on Cloudflare CDN via their Stream (video) and Images APIs
- Track media assets in database with status (pending → processing → ready / error)
- Direct upload pattern: frontend uploads directly to Cloudflare using signed URLs
- Webhook-based notification when video processing completes

---

## Directory Structure

```
backend/src/modules/media/
├── CLAUDE.md               # This file
├── cloudflare.client.ts    # Cloudflare API wrapper (Stream + Images)
├── media.types.ts          # Zod schemas and TypeScript types
├── media.service.ts        # Business logic and DB operations
└── media.routes.ts         # Express routes
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/media/upload/image` | Yes | Request signed URL for image upload |
| POST | `/api/media/upload/video` | Yes | Request TUS URL for video upload |
| GET | `/api/media/:id` | Yes | Get media asset status/details |
| POST | `/api/media/:id/confirm` | Yes | Confirm image upload completion |
| POST | `/api/media/:id/poll` | Yes | Poll video processing status |
| DELETE | `/api/media/:id` | Yes | Delete media asset (owner only) |
| POST | `/api/media/webhook/stream` | No* | Cloudflare Stream webhook |

*Webhook verified via HMAC signature

---

## Upload Flow

### Images
1. Frontend: `POST /api/media/upload/image` → gets `{ assetId, uploadURL, cfAssetId }`
2. Frontend: Upload file directly to `uploadURL` via form POST
3. Frontend: `POST /api/media/:assetId/confirm` → marks ready, returns CDN URL

### Videos
1. Frontend: `POST /api/media/upload/video` → gets `{ assetId, uploadURL, cfAssetId }`
2. Frontend: Upload file to `uploadURL` via TUS protocol (resumable)
3. Cloudflare processes video (transcoding, HLS generation)
4. Cloudflare: `POST /api/media/webhook/stream` → updates DB with HLS URL
5. Frontend can also poll: `POST /api/media/:assetId/poll` as fallback

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `CF_API_TOKEN` | API token with Stream + Images permissions |
| `CF_STREAM_WEBHOOK_SECRET` | Webhook signing secret for signature verification |
| `CF_IMAGES_ACCOUNT_HASH` | Images delivery hash for CDN URLs |

---

## Patterns & Conventions

- Uses `createLogger('MediaService')` for all logging
- Follows existing module pattern (types → service → routes)
- Statistics tracked: `media.upload.image`, `media.upload.video`, `media.delete`
- All Cloudflare API calls are in `cloudflare.client.ts` (isolated)
- DB operations use Prisma singleton from `@/core/database/prisma`

---

## Known Issues & Fixes

### 2026-02-14: Image/video upload 500 error in production
- **Bug**: All media uploads failed with "Failed to create image upload" (HTTP 500) in production
- **Root Cause**: `deploy.sh` did not pass Cloudflare env vars (`CF_ACCOUNT_ID`, `CF_API_TOKEN`, `CF_IMAGES_ACCOUNT_HASH`, `CF_STREAM_WEBHOOK_SECRET`) to Cloud Run. The cloudflare client throws when `CF_API_TOKEN` or `CF_ACCOUNT_ID` are undefined.
- **Fix**: Updated `deploy.sh` to pass `CF_ACCOUNT_ID` and `CF_IMAGES_ACCOUNT_HASH` as env vars, and `CF_API_TOKEN` and `CF_STREAM_WEBHOOK_SECRET` as Secret Manager secrets. Updated `.env.production.example` with the required variables.

---

## Implementation Date

2026-02-14
