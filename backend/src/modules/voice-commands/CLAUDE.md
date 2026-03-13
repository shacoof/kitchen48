# Voice Commands Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module manages voice commands for Recipe Play Mode:

1. **Public API** — Returns active voice commands with translated display text for play mode
2. **Admin CRUD** — Full management of voice commands (keywords, icons, translations)
3. **Multi-language translations** — Each command has per-language display keyword and description

---

## Directory Structure

```
backend/src/modules/voice-commands/
├── CLAUDE.md                    # This file
├── voice-commands.types.ts      # TypeScript types and Zod validation schemas
├── voice-commands.service.ts    # Business logic (CRUD operations)
└── voice-commands.routes.ts     # API routes (public + admin)
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/voice-commands?lang=en` | No | Get active commands with translations for a language |
| GET | `/api/voice-commands/admin` | Admin | Get all commands with all translations |
| POST | `/api/voice-commands` | Admin | Create a new voice command |
| PUT | `/api/voice-commands/:id` | Admin | Update a voice command |
| DELETE | `/api/voice-commands/:id` | Admin | Delete a voice command |
| PUT | `/api/voice-commands/:id/translations` | Admin | Upsert a translation |

---

## Database Tables

- `voice_commands` — command key, keywords array, icon, sort order, active flag
- `voice_command_translations` — per-language display keyword and description

---

## Patterns & Conventions

- `command` field is the action key that maps to frontend switch cases (e.g., "next", "describe")
- `keywords` is a Postgres text[] array containing trigger words in ALL languages
- The frontend switch statement that handles actions stays hardcoded — only keywords and display text are DB-driven
- Adding a brand new command action requires a code change in RecipePlayPage.tsx

---

## Implementation Date

2026-03-08
