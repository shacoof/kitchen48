# Kitchen48 Mobile App - CLAUDE.md

Standalone Expo (React Native) mobile app for Kitchen48.

**Phase plan & status:** see [`PLAN.md`](./PLAN.md) for the offline-first roadmap (Phases A–F).

---

## Architecture

**Fully offline-first** — no backend dependency. All data stored locally on the device.

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 57 + Expo Router |
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

### Native modules → dev client (Expo Go is not enough)

Voice (`expo-speech-recognition`) is a native module that Expo Go does not
include. To test voice, build and install the dev client once, then run Metro:

```bash
./scripts/build-mobile-apk.sh development       # once, and after any native dep change
cd mobile && npx expo start --dev-client --tunnel
```

Expo Go still works for everything else; the voice bar degrades to
"voice unavailable".

### TypeScript check

```bash
cd mobile && npx tsc --noEmit
```

### Building a standalone APK (no Metro, runs offline on phone)

For ongoing use on a phone without desktop dependence, build an APK with the build script. By default it builds **locally** (no EAS cloud quota) and **uploads to Google Drive**:

```bash
./scripts/build-mobile-apk.sh                  # preview APK (default), local build — for sideload
./scripts/build-mobile-apk.sh production       # AAB for Play Store
./scripts/build-mobile-apk.sh development      # dev client APK (connects to Metro)
./scripts/build-mobile-apk.sh --cloud          # build on EAS servers instead of locally
./scripts/build-mobile-apk.sh --no-upload      # skip the Google Drive upload
```

**Every build automatically:**
1. Bumps `expo.version` in `app.json`: `1.0.0` → `1.1` → `1.2` → … (never edit it by hand)
2. Builds and saves `mobile/build-output/kitchen48-v<version>.apk` (git-ignored)
3. Uploads the file to the Drive builds folder: https://drive.google.com/drive/folders/1f6LyPM-VBpw2yD24RFSgwN1UoQFuU2aB (via rclone remote `gdrive`)
4. Commits the bump as `chore(mobile): build v<version> (<profile>)` — the bump is reverted if the build fails

The script refuses to run mid-merge/rebase or with uncommitted `app.json` changes. Uncommitted changes elsewhere in `mobile/` are included in the build.

The `development` and `preview` profiles build native code for `arm64-v8a` only (`ORG_GRADLE_PROJECT_reactNativeArchitectures` in `eas.json`) — the target phone is a Samsung S20 FE 5G, and a single ABI cuts native compile time and APK size. Add ABIs there if the app ever needs to run on an emulator (`x86_64`) or an old 32-bit phone (`armeabi-v7a`). `production` keeps all ABIs, since the Play Store splits the AAB per device.

To install on the phone: open the APK from the Drive app → Install. It installs over the existing app (same EAS signing key) and keeps local data — don't uninstall first.

**When to rebuild:**
- After completing each phase (D/E/F) — full rebuild captures all native module changes
- When adding a new native dependency (Expo Go won't pick it up; a new APK is required)

**OTA updates are not set up** (`expo-updates` is not installed), so every change currently needs a new APK.

Build profiles are defined in [`eas.json`](./eas.json). Project ID is stored in `app.json` under `expo.extra.eas.projectId`.

**Local toolchain (installed in user home, no sudo):**
- JDK 17 (Temurin): `~/.local/jdk/jdk-17.0.21+9`
- Android SDK: `~/Android/Sdk` (platform 36, build-tools 36.0.0, NDK 27.1.12297006, platform-tools)
- rclone: `~/.local/bin/rclone`, remote `gdrive` (`rclone config`, Google Drive, full scope)
- `JAVA_HOME` / `ANDROID_HOME` are exported in `~/.bashrc`; the script falls back to these paths if unset

**One-time setup (already done):** `npx eas-cli@latest login`

---

## Play Mode Voice (Phase E3)

**Requirement: voice is additive.** The Play screen always shows the current
step (title, instruction, ingredients, timers) and all tap controls. Voice
never hides or replaces that content; it adds a bottom voice bar only.

| File | Role |
|------|------|
| `src/voice/commands.ts` | Command ids + EN/HE keywords (ported from web seed), matcher |
| `src/services/tts.ts` | `expo-speech` wrapper: speak/stop, language mapping, speaking state |
| `src/hooks/useVoiceControl.ts` | Recognition lifecycle, continuous vs push-to-talk, pauses while TTS speaks |
| `src/components/VoiceBar.tsx` | Mic toggle, push-to-talk, last-heard feedback, help button |
| `src/components/VoiceHelpModal.tsx` | Lists available commands + auto-read toggle |
| `src/voice/recognizer.ts` | Lazy native-module loader (Expo Go → unavailable) |

Commands target the foreground session; a timer command that names another
active recipe's title ("pause lasagna timer") targets that session.

Setting: `voice_auto_read` (`'1'`/`'0'`, default `'1'`) — read each step aloud when the step changes
(not on first open). Toggled from the voice help sheet.

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
