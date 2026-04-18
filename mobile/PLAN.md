# Kitchen48 Mobile App — Implementation Plan

**Architecture:** Fully offline-first Expo app. No backend dependency. AI features call Anthropic API directly with a user-provided key stored in `expo-secure-store`.

**Scope:**
- IN: Recipe CRUD (local SQLite), play mode, manual creation, AI photo/URL import, YAML/zip import/export, i18n (EN/HE + RTL), measurement conversion, auto-save
- OUT: Auth, user accounts, explore, community recipes, user profiles, favorites, statistics tracking, backend API

---

## Phases

### Phase A — Foundation ✅ Done (commit `0563cbd`, 2026-04-11)

- Expo SDK 54 + expo-router + TypeScript
- SQLite tables: `recipes`, `steps`, `step_ingredients`, `dietary_tags`, `settings`
- i18n with EN/HE locales, RTL via `I18nManager`
- Tab navigation: My Recipes, Create, Settings
- `createLogger()` adapted for React Native
- Measurement utilities (unit conversion, fractions, timer formatting)
- Media storage service (expo-file-system Paths/File/Directory API)
- Settings hook with SecureStore for API key, language, measurement system

### Phase B — Recipe CRUD ✅ Done (commit `29d8cce`, 2026-04-11)

- Home screen: recipe list with search, empty state
- Recipe detail: hero, metadata, aggregated ingredients, step overview, edit/delete
- Manual creation: multi-step form with inline ingredient editing
- Auto-save (1.5s debounce) with status indicator
- Reusable components: `RecipeCard`, `SearchBar`, `SaveStatus`
- `useAutoSave` hook with initial-load guard + timer cleanup

### Phase C — Media ✅ Done (commit `d8853fe`, 2026-04-11)

- `MediaPicker` component: camera + gallery for images and videos
- `VideoPlayer` component: expo-av with native controls
- Hero image + per-step images and videos
- Media saved to `${documentDirectory}/recipes/{recipeId}/`
- Web stubs (`.web.tsx`) for Expo web preview

### Phase D — Import / Export 🔲 Not started

**Recipe exchange format** (documented in `mobile/CLAUDE.md`):

```
my-recipe/
├── kitchen48-recipe.yaml
├── hero.jpg
├── step-1.jpg
├── step-1-video.mp4
└── ...
```

YAML schema:
```yaml
version: "1.0"
title: "..."
servings: 4
measurementSystem: "metric"
steps:
  - order: 1
    instruction: "..."
    image: "step-1.jpg"
    ingredients:
      - { name: "flour", quantity: 200, unit: "g" }
```

**Import flows:**
- From zip: `expo-document-picker` → extract → parse YAML → copy media to local storage → insert into SQLite
- From folder URL: fetch `{url}/kitchen48-recipe.yaml` → download referenced media → store locally

**Export flow:**
- Generate YAML from SQLite → bundle with local media files into zip → `expo-sharing`

**New deps:** `expo-document-picker`, `expo-sharing`, YAML library

### Phase E — Play Mode 🔲 Not started

Immersive kitchen-optimized cooking screen.

| Feature | Native API |
|---------|-----------|
| Voice commands | `@react-native-voice/voice` |
| Text-to-speech | `expo-speech` |
| Wake lock | `expo-keep-awake` |
| Background timers | `expo-task-manager` + `expo-notifications` |
| Audio alarm | `expo-av` |
| Swipe gestures | `react-native-gesture-handler` |
| Haptic feedback | `expo-haptics` |

**Multi-recipe background timers:**
- Each recipe's timers tracked independently
- Timer state persisted in SQLite for crash recovery
- Local notifications fire when timer reaches zero

### Phase F — AI Import 🔲 Not started

Direct Anthropic API calls from device (key from SecureStore).

**Photo → Recipe:**
1. User takes/picks photos via `expo-image-picker`
2. Convert to base64
3. POST to `api.anthropic.com/v1/messages` with Claude vision + extraction prompt
4. Claude returns structured YAML matching exchange format
5. Parse → save to SQLite + local storage

**URL → Recipe:**
1. User pastes recipe URL
2. Fetch page HTML
3. Send to Claude with extraction prompt
4. Parse returned YAML
5. Download referenced images
6. Save to SQLite + local storage

---

## Dev & Testing

```bash
# WSL2 requires tunnel mode (Metro not reachable on local WiFi otherwise)
cd mobile && npx expo start --tunnel

# Install Expo Go on phone, scan QR code
# TypeScript check:
npx tsc --noEmit
```

## Key Decisions Already Made

- **Offline-first over BFF.** No auth, no backend — eliminates operational burden; each user owns their data and AI costs.
- **User-provided Anthropic key.** Stored in `expo-secure-store`, never in plain storage.
- **Local UUIDs, not `uuid` package.** React Native JS engine lacks `crypto.getRandomValues`; we use a simple local ID generator (see commit `2f957af`).
- **`.web.ts` stubs for native-only modules.** Lets Expo web preview compile despite native-only imports.

---

## Session History

Original plan was in session `0762d2b5-eb6e-4563-82e9-5cf01b07fc13` (2026-04-11). The initial plan assumed a BFF architecture (mobile calls backend); it was revised to fully offline-first at message #390 of that session.
