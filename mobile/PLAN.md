# Kitchen48 Mobile App — Implementation Plan

**Architecture:** Fully offline-first Expo app. No backend dependency. AI features call Anthropic API directly with a user-provided key stored in `expo-secure-store`.

**Scope:**
- IN: Recipe CRUD (local SQLite), play mode, manual creation, AI photo/URL import, YAML/zip import/export, i18n (EN/HE + RTL), measurement conversion, auto-save
- OUT: Auth, user accounts, explore, community recipes, user profiles, favorites, statistics tracking, backend API

---

## Phases

### Phase A — Foundation ✅ Done (commit `0563cbd`, 2026-04-11)

- Expo SDK 57 + expo-router + TypeScript
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
- `VideoPlayer` component: expo-video with native controls
- Hero image + per-step images and videos
- Media saved to `${documentDirectory}/recipes/{recipeId}/`
- Web stubs (`.web.tsx`) for Expo web preview

### Phase D — Import / Export ✅ Done (commit `520efe5`, merged `7459e1b`, 2026-04-18)

YAML exchange format + folder-URL import/export implemented. Zod schema at
`src/services/recipe-yaml-schema.ts`; import at `src/services/recipe-import.ts`.
URL normalization handles Google Drive / Dropbox / GitHub blob links.

**Follow-on: Out-of-box seed recipes ✅ Done (commit `932d4c1`, 2026-04-18)**

11 starter recipes from `~/kitchen48-recipe-export/` ship with the app:
- Build-time codegen (`scripts/build-seed-data.mjs`) reads the export folder,
  copies hero images into `assets/seed-recipes/<slug>/`, and emits
  `src/seed/seed-recipes.ts` (typed static data + `require()` for images).
- Runtime seeder (`src/services/recipe-seeder.ts`) runs on first launch,
  gated by `settings.seed_recipes_loaded_version`. Seeded recipes are fully
  user-owned — editable and deletable like any imported recipe.
- Regenerate with `npm run build:seed`. Bump `SEED_SCHEMA_VERSION` to force
  re-seed on existing installs (note: current seeder appends, doesn't dedupe).

### Phase E — Play Mode 🚧 In progress

**E1 ✅ Done (commit `0482d50`, 2026-04-18)** — multi-session core + dashboard.
**E2 ✅ Done (this commit)** — local notifications, background survival, foreground haptics, deep-link from notification tap.
**E3 🚧** — voice commands + TTS (see "Voice (E3)" below). Gestures deferred to E4.
**E4 🔲** — polish (timer editing mid-cook, session stats, rescheduling).

Immersive kitchen-optimized cooking screen. **Multi-session**: user can have
several recipes playing in parallel (e.g., lasagna baking while bread rises).

| Feature | Native API |
|---------|-----------|
| Voice commands | `expo-speech-recognition` (major version tracks the Expo SDK, e.g. `^57`) |
| Text-to-speech | `expo-speech` |
| Wake lock | `expo-keep-awake` |
| Background timers | `expo-task-manager` + `expo-notifications` |
| Audio alarm | `expo-audio` |
| Swipe gestures | `react-native-gesture-handler` |
| Haptic feedback | `expo-haptics` |

**Parallel sessions + per-recipe timers:**
- Multiple `play_sessions` can be active at once, each bound to a recipe.
- New SQLite tables: `play_sessions` (id, recipe_id, started_at, current_step_id, status) and `step_timers` (id, session_id, step_id, kind=prep|wait, started_at, duration_ms, fires_at, state).
- Timers keyed by (sessionId, stepId, kind) — never global. Persisted so they survive app restarts and crashes.
- Local notifications carry `{ sessionId, stepId }` in payload so tap opens the right session.
- Sessions-dashboard surface (or floating pill) shows all active sessions with a count badge; user can jump between them.
- Leaving a session keeps it running in the background; explicit "End cooking" required to terminate.
- Voice commands target the foreground session by default; "pause lasagna timer" can disambiguate by recipe title.

**Voice (E3):**
- **Voice is additive — it never hides or replaces step content.** The Play
  screen keeps showing the step title, instruction, "For this step"
  ingredients and the Prep/Wait timer cards. Every voice command has a
  tap equivalent that keeps working. Voice only adds a compact bar at the
  bottom (mic toggle, push-to-talk, last-heard command, help).
- The display follows voice: "next"/"back" change the visible step;
  timer commands update the visible timer cards.
- TTS (`expo-speech`) reads exactly what is on screen (instruction, then
  ingredients) in the interface language. Auto-read on step change
  (toggle in the voice help sheet; not on first open).
- Recognition (`expo-speech-recognition`): on-device when available,
  `contextualStrings` seeded with command keywords, `en-US` / `he-IL`.
- Half-duplex: recognition is paused while TTS speaks, so the mic never
  hears the app's own voice.
- Two listening modes: continuous (mic toggle, auto-restarts after
  silence) and push-to-talk (single utterance).
- Command keywords ported from the web `voice_commands` seed (EN + HE),
  bundled in `src/voice/commands.ts` (no backend). Matcher prefers the
  longest matching keyword so "read ingredients" beats "read".
- Native module → requires a dev client / APK; in Expo Go the voice bar
  shows "voice unavailable" and the rest of Play Mode works unchanged.
- Out of scope for E3: Claude fallback for free-form questions (Phase F),
  text-size voice commands (text size is a Settings option),
  video/volume commands.

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

## Build & Distribution ✅ Configured (commit `e9a757d`, 2026-04-18)

EAS Build is set up. Project: `@shacoof/kitchen48` (EAS project id `2061b5ec-d682-4ffa-be6e-84b95a7a8535`).

**Build an APK (standalone, no Metro required):**
```bash
./scripts/build-mobile-apk.sh                  # preview APK (default) — for sideload
./scripts/build-mobile-apk.sh production       # AAB for Play Store
./scripts/build-mobile-apk.sh development      # dev client APK
```

Build profiles are defined in `mobile/eas.json`. First build verified successfully on 2026-04-18 (APK installs and runs standalone on Android).

**Update already-installed APKs with JS-only changes (OTA, APKs from v1.2 onward):**
```bash
cd mobile && npx eas-cli update --channel preview --environment preview --platform android --message "<what changed>"
```
See `mobile/CLAUDE.md` → "OTA updates" for when a new APK is still required.

**Rebuild APK when:** adding native deps, completing a phase, or ready for a clean snapshot.

## Key Decisions Already Made

- **Offline-first over BFF.** No auth, no backend — eliminates operational burden; each user owns their data and AI costs.
- **User-provided Anthropic key.** Stored in `expo-secure-store`, never in plain storage.
- **Local UUIDs, not `uuid` package.** React Native JS engine lacks `crypto.getRandomValues`; we use a simple local ID generator (see commit `2f957af`).
- **`.web.ts` stubs for native-only modules.** Lets Expo web preview compile despite native-only imports.
- **EAS Build for distribution.** Free tier (30 builds/month) is enough for personal/ongoing use. Keystore auto-generated and stored on Expo servers.

---

## Session History

Original plan was in session `0762d2b5-eb6e-4563-82e9-5cf01b07fc13` (2026-04-11). The initial plan assumed a BFF architecture (mobile calls backend); it was revised to fully offline-first at message #390 of that session.
