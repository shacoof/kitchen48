# Upload Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module handles file uploads for Kitchen48:

1. **Profile Picture Upload**
   - Authenticated users can upload their profile picture
   - Replaces existing picture if one exists
   - Stores URL in user's profilePicture field

2. **File Validation**
   - Allowed types: JPEG, PNG, WebP
   - Max file size: 5MB
   - File type validated by both extension and MIME type

3. **Storage**
   - Development: Local filesystem (`backend/uploads/`)
   - Production: Can be extended to cloud storage (GCS, S3)

---

## Directory Structure

```
backend/src/modules/upload/
├── CLAUDE.md           # This file
├── upload.middleware.ts # Multer configuration and file validation
├── upload.service.ts    # File storage logic
├── upload.controller.ts # Request handlers
└── upload.routes.ts     # Express routes

backend/uploads/         # Local file storage (dev only, gitignored)
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/profile-picture` | Yes | Upload profile picture |

### Request Format

```
POST /api/upload/profile-picture
Content-Type: multipart/form-data

file: <binary image data>
```

### Response Format

```json
{
  "data": {
    "url": "/uploads/profile-abc123.jpg",
    "filename": "profile-abc123.jpg"
  }
}
```

---

## File Naming Convention

Profile pictures: `profile-{userId}-{timestamp}.{ext}`

Example: `profile-clx1abc123-1706608800000.jpg`

---

## Patterns & Conventions

### Multer Configuration
```typescript
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `profile-${req.userId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});
```

### File Validation
```typescript
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};
```

### Error Handling
- File too large: 413 Payload Too Large
- Invalid file type: 400 Bad Request
- No file provided: 400 Bad Request
- Upload failed: 500 Internal Server Error

---

## Static File Serving

Files in `uploads/` are served at `/uploads/*` via Express static middleware.

```typescript
app.use('/uploads', express.static('uploads'));
```

In production with nginx, this can be served directly by nginx for better performance.

---

## Implementation Date

2026-01-30
