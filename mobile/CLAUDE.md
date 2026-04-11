# Kitchen48 Mobile App - CLAUDE.md

Standalone Expo (React Native) mobile app for Kitchen48.

---

## Architecture

**Fully offline-first** — no backend dependency. All data stored locally on the device.

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + Expo Router |
| Language | TypeScript |
| Database | SQLite (expo-sqlite) |
| File storage | expo-file-system (images, videos) |
| AI features | Anthropic API called directly from device |
| i18n | i18next + react-i18next (EN, HE + RTL) |
| Forms | react-hook-form + Zod validation |

### No Backend

This app does NOT call the Kitchen48 backend. There is:
- No authentication / user accounts
- No server-side API
- No Cloudflare media — all media is local files
- No community features (explore, profiles, favorites)

### AI Features (Requires Internet)

Photo and URL import use the Anthropic API directly. The user provides their own API key in Settings, stored in `expo-secure-store`.

---

## Directory Structure

```
mobile/
├── app/                        # Expo Router (file-based routing)
│   ├── _layout.tsx             # Root layout
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar: Home, Create, Settings
│   │   ├── index.tsx           # Home (recipe list)
│   │   ├── create.tsx          # Create choice screen
│   │   └── settings.tsx        # App settings
│   ├── recipe/
│   │   ├── [id].tsx            # Recipe detail
│   │   ├── [id]/edit.tsx       # Edit recipe
│   │   ├── [id]/play.tsx       # Play mode
│   │   └── [id]/step/[stepId].tsx
│   └── create/
│       ├── manual.tsx          # Manual creation
│       ├── photos.tsx          # AI photo import
│       ├── url.tsx             # AI URL import
│       └── import.tsx          # Import from folder/zip
├── src/
│   ├── db/                     # SQLite database layer
│   ├── services/               # Anthropic, import/export, media storage
│   ├── hooks/                  # React hooks
│   ├── components/             # Reusable RN components
│   ├── lib/                    # Logger, measurement utils, YAML
│   ├── config/                 # i18n setup
│   └── locales/                # EN + HE translation files
├── assets/                     # App icons, splash screen
├── app.json                    # Expo config
└── package.json
```

---

## Database (SQLite)

Tables: `recipes`, `steps`, `step_ingredients`, `dietary_tags`, `settings`

- All IDs are UUIDs (TEXT)
- Timestamps are ISO strings (TEXT)
- Media references are local file paths (TEXT)
- CASCADE delete from recipe → steps → ingredients

---

## Recipe Exchange Format

Import/export uses `kitchen48-recipe.yaml` + media files in a folder or zip.

```yaml
version: "1.0"
title: "Recipe Name"
steps:
  - order: 1
    instruction: "..."
    image: "step-1.jpg"      # relative path
    ingredients:
      - name: "flour"
        quantity: 200
        unit: "g"
```

---

## Development & Testing

**Dev environment runs on WSL2.** Android SDK is not installed locally.

### Running the app on a physical device

```bash
cd mobile && npx expo start --tunnel
```

- **Always use `--tunnel`** — required because WSL2 networking does not expose the dev server to the local WiFi network. Without `--tunnel`, the phone cannot reach the Metro bundler.
- Install **Expo Go** on the phone (Play Store / App Store)
- Scan the QR code from the terminal with the phone camera (iOS) or Expo Go (Android)
- The `@expo/ngrok` package is required for tunneling (auto-installed on first use)

### TypeScript check

```bash
cd mobile && npx tsc --noEmit
```

---

## Conventions

- **Logging**: Use `createLogger('Name')` — never `console.log`
- **i18n**: All user-facing strings via `t()` — never hardcoded text
- **Auto-save**: Recipe editing uses 1.5s debounced auto-save with status indicator
- **RTL**: Hebrew triggers `I18nManager.forceRTL(true)`
- **Media files**: Stored in `${documentDirectory}/recipes/{recipeId}/`
- **API key**: Stored in `expo-secure-store`, never in plain storage

---

## Implementation Date

2026-04-11
