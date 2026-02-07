Each user will be able to post recipes

# General Development Instructions
- We might need to update recipe and steps tables
- I want steps table to be called recipe_steps
- Remove unused columns and add new ones as needed based on the design below
- Don't forget to add scripts for the deployment in production
- Create necessary LOV or update existing ones to meet below requirements

---

# Screens

We need the following screens:
1. **My Recipes** - list of all user's recipes
2. **Recipe Summary** - recipe details & ingredient overview
3. **Recipe Steps** - step-by-step view/edit/play

---

## 1. My Recipes Screen

Accessed from main menu "Recipes". Displays all recipes authored by the logged-in user.

### Layout: Card Grid (not a plain list)

Each recipe card shows:
- **Thumbnail image** (or a placeholder if no image uploaded yet)
- **Recipe name**
- **Status badge**: Draft (grey) / Published (green)
- **Key stats row**: prep time | total time | servings
- **Last edited** timestamp

### Interactions
- Click card → opens Recipe Summary screen
- **"+ New Recipe" button** — prominent CTA, top-right (or centered empty-state CTA for users with zero recipes)
- **Quick actions menu** (three-dot or hover): Edit, Duplicate, Delete
- **Search bar** at the top — filters by recipe name as you type
- **Sort dropdown**: Recently edited (default), Alphabetical, Oldest first
- **Filter chips**: All | Published | Drafts

### Empty State
When user has no recipes, show an inviting illustration with:
- "You haven't created any recipes yet"
- Large "+ Create Your First Recipe" button
- Optional: link to a sample recipe for inspiration

### Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | 3-column card grid, search bar + sort + filters in a single row |
| Tablet (768–1023px) | 2-column card grid, search bar full-width above sort/filter row |
| Mobile (<768px) | Single-column stacked cards (full-width), search bar full-width, sort/filter as horizontal scrollable chips, "+ New Recipe" becomes a floating action button (FAB) bottom-right |

---

## 2. Recipe Summary Screen

Reference design: `misc/main_recipe`

Screen that shows the full overview of a recipe before entering cooking mode.

### Hero Section (top)
- **Recipe name** (large heading, also used for semantic URL)
- **Description** (rich text, expandable if long)
- **Author name** with small avatar (links to author profile)
- **Hero image** — full-width with overlay gradient for text readability
- **Introduction video** — embedded player (play button over hero image, or separate area below)

### Metadata Bar
Horizontal row of key stats with icons:
| Icon | Field | Source |
|------|-------|--------|
| Clock | **Prep time** | sum of all step prep times |
| Hourglass | **Total time** | sum of all prep + wait times |
| Users | **Servings** | user-entered |
| Gauge | **Difficulty** | LOV: Easy / Medium / Hard |

**Serving Size Adjuster**: A +/- stepper next to the serving count. Changing servings dynamically recalculates all ingredient quantities proportionally. Original serving size is kept as reference; quantities scale linearly.

### Tags Row
- **Cuisine type** (LOV: Italian, Japanese, Mexican, etc.)
- **Dietary labels** (LOV, multi-select: Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, etc.)
- **Meal type** (LOV: Breakfast, Lunch, Dinner, Snack, Dessert)
- Tags are clickable — can be used for discovery later

### Bottom Section — Two-Column Layout

**Left column: Aggregated Ingredients List**
- Summary of all ingredients across all steps
- If the same ingredient appears in multiple steps, quantities are summed (e.g., Step 1: 1 cup flour + Step 3: 1 cup flour = **2 cups flour**)
- Quantities reflect the current serving size (adjusted by the stepper above)
- Each ingredient shows: **quantity** | **unit** | **ingredient name**
- Ingredients grouped by category (from master ingredient table) when applicable

**Right column: Cooking Steps Overview**
- Numbered list of step titles/summaries (short description or first line of each step)
- Each step shows its prep time and wait time as small badges
- Clicking a step scrolls to or opens the Recipe Steps screen focused on that step

### Action Bar (sticky footer or bottom of page)
- **"Start Cooking" button** (primary CTA, green) — opens Recipe Steps screen in Play mode
- **"Print Recipe"** — opens print-friendly view (ingredients + all steps on one page, no video)
- **"Save for Later"** (bookmark icon) — adds to user's saved recipes
- **"Share"** — copy link / share to social
- **"Edit Recipe"** — only visible to the recipe author; opens Recipe Steps in Edit mode

### Status Indicator (author view only)
- If recipe is Draft: yellow banner "This recipe is not published yet" with a "Publish" button
- If recipe is Published: small green "Published" badge near the title

### Responsive Behavior

| Viewport | Layout |
|----------|--------|
| Desktop (≥1024px) | Hero image full-width, metadata bar horizontal, two-column bottom (ingredients left + steps right), action bar inline |
| Tablet (768–1023px) | Hero image full-width, metadata bar horizontal (may wrap to 2 rows), two-column bottom with narrower columns, action bar inline or sticky bottom |
| Mobile (<768px) | Hero image full-width, metadata bar stacks vertically (2×2 grid), bottom section stacks: ingredients first then steps overview below, action bar becomes sticky bottom bar with icon-only buttons + labels on primary CTA |

---

## 3. Recipe Steps Screen

Reference design: `misc/play_recipe`

Three modes: **View** (read-only) | **Edit** | **Play**

Mode is indicated by a toggle/segmented control at the top of the screen.

---

### 3a. View Mode (default for non-authors)

Clean reading experience. No editing controls visible.

**Left Pane — Step Navigator**
- Vertical numbered list of all steps
- Each step shows: step number, short title (first ~40 chars of description), prep time badge
- Active step is highlighted (green accent, as in mockup)
- Completed steps show a subtle checkmark (for logged-in users tracking progress)
- Click a step → right pane updates to show that step's details

**Right Pane — Step Detail**
- **Step video** (if available) — embedded player at the top
- **Step title** — "Step N: [short title]"
- **Instructions** — full text description of the step. Key terms (temperatures, times, techniques) in **bold** for scannability
- **Ingredients for this step** — list showing quantity | unit | name. Only ingredients needed for *this* step, not the full recipe
- **Timer display**: if the step has a wait time, show a prominent timer widget:
  - Displays the expected wait time (e.g., "00:30:00" for 30 minutes)
  - "Start Timer" button — counts down with audio alert when done
  - Multiple timers can run concurrently (a step's timer keeps running when you navigate to another step; a small floating badge shows active timers)

**Bottom Bar**
- "Previous Step" / "Next Step" navigation buttons
- Overall progress bar (e.g., "Step 3 of 6 — 45%")

---

### 3b. Edit Mode (author only)

Accessed via "Edit" toggle or the "Edit Recipe" button from Summary screen.

**Left Pane — Step List (editable)**
- Same step list as View mode, plus:
- **Drag handles** on each step for drag-and-drop reordering
- **"+ Add Step" button** at the bottom of the list
- **Delete step** — swipe-left or trash icon with confirmation dialog
- **Duplicate step** — quick-action to clone a step

**Right Pane — Step Editor**
When a step is selected, the right pane becomes an edit form:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Step title | text input | No | Auto-generated from first words of description if left blank |
| Description | rich text editor | Yes | Supports bold, italic, lists. This is the main instruction text |
| Video | file upload / URL | No | Upload or paste Cloudflare Stream URL |
| Prep time | number + unit dropdown | Yes | Unit LOV: seconds, minutes, hours |
| Wait time | number + unit dropdown | No | Unit LOV: seconds, minutes, hours, days |
| Ingredients | inline editable list | Yes | See ingredient editing UX below |

**Ingredient Editing UX (per step)**
- Each ingredient row: [Whole number] [Fraction dropdown] [Unit dropdown] [Ingredient name (autocomplete)]
  - Whole number: numeric input (0, 1, 2, 3...)
  - Fraction dropdown: — (none), 1/8, 1/4, 1/3, 1/2, 2/3, 3/4 (hidden for metric weight/volume units like g, kg, ml, L)
  - Unit dropdown: filtered to show only the recipe's measurement system units + universal units
  - Whole + fraction combined into decimal for storage (e.g., 2 + 1/3 = 2.333)
- Ingredient name field has **autocomplete** from master_ingredients table
- If user types a name not in master table, allow free-text entry (with a subtle "new ingredient" indicator)
- "+ Add Ingredient" button below the list
- Remove ingredient via X button on each row
- Rows are reorderable via drag handles

**Auto-save**: Changes save automatically with a debounce (show "Saving..." / "Saved" indicator in the top bar). No explicit save button needed — reduces friction.

**Validation**: If user tries to switch away from Edit mode with validation errors (e.g., step with no description or no ingredients), show inline errors on the offending fields rather than a modal.

---

### 3c. Play Mode (hands-free cooking)

Full-screen immersive experience optimized for kitchen use. This is the signature Kitchen48 feature.

**Layout changes from View mode:**
- Left pane collapses to a narrow strip showing only step numbers (more screen real estate for content)
- Video player is larger / more prominent
- Text is larger and higher contrast for readability at a distance
- Touch targets are oversized (min 48px) for flour-covered fingers

**Voice Control Bar** (top of screen, always visible in Play mode)
- Visual indicator: microphone icon with animated pulse when listening
- Status text: "Listening for commands..." / "Command recognized: Next"
- Manual override toggle to disable voice and use buttons only

**Supported Voice Commands**
| Command | Action |
|---------|--------|
| "Describe" / "Read step" | Text-to-speech reads the step description aloud |
| "Ingredients" | Text-to-speech reads the step's ingredient list |
| "Play video" | Plays the step video |
| "Stop" | Stops any audio or video playback |
| "Next" | Advances to the next step |
| "Previous" / "Back" | Returns to the previous step |
| "Louder" | Increases volume |
| "Quieter" | Decreases volume |
| "Start timer" / "Activate timer" | Starts the countdown timer for the step's wait time |
| "Timer status" | Reads remaining time aloud |

**Timer Integration**
- When a step has wait time, a large timer widget appears below the instructions
- Timer persists across step navigation (floating mini-timer badge in corner)
- Audio chime + visual flash when timer completes
- Multiple concurrent timers supported (one per step that has wait time)

**Screen Wake Lock**: Prevent device from sleeping during Play mode.

**Progress & Navigation**
- Overall progress bar at the bottom (shows percentage through the recipe)
- Large "Previous Step" / "Next Step" buttons at the bottom
- Step completion: moving to next step marks the current step as complete (green checkmark in the left strip)

**Step Ingredient Checklist**
- In Play mode, ingredients for the current step show as a checklist
- User can tap to check off ingredients as they add them (prevents forgetting)
- Checked state resets when returning to a step

---

### Responsive Behavior (all modes)

| Viewport | View Mode | Edit Mode | Play Mode |
|----------|-----------|-----------|-----------|
| Desktop (≥1024px) | Two-pane side-by-side (left nav 280px + right content) | Same two-pane with editor form in right pane | Collapsed left strip (60px) + full-width content, large text |
| Tablet (768–1023px) | Two-pane with collapsible left nav (hamburger toggle) | Same, with collapsible nav; editor form scrollable | Full-screen content, step numbers as floating overlay, 48px+ touch targets |
| Mobile (<768px) | Single pane — step navigator becomes **horizontal swipeable strip** at top (pill-shaped step numbers); content fills screen; **swipe left/right** to change steps | Single pane — step list as top accordion/dropdown; editor form full-width below; ingredient rows stack vertically (quantity+unit on one line, name on next) | Full-screen, no navigator visible (just prev/next buttons), maximum content area, oversized buttons, voice control bar as slim top strip |

**Mobile step navigation component**: The horizontal swipeable strip is a distinct component from the desktop sidebar — it uses CSS `scroll-snap-type: x mandatory` with pill-shaped step indicators. Swiping the content area also changes steps via touch gesture detection.

---

# Measurement System (Metric / Imperial)

## Design Decision: Store in Original System, Convert on Display

Each recipe is stored with the exact values and units the author entered — no conversion on write. When a viewer's preferred measurement system (from their user profile) differs from the recipe's original system, quantities are converted on the fly at display time.

**Why not "always store metric"?** Double-conversion causes rounding artifacts. "1/3 cup" → 78.86 ml → "0.33 cups" loses the author's clean fraction. Storing originals keeps the clean numbers for at least one system, and conversion only rounds once.

## User Profile Setting

Each user has a `measurementSystem` field in their profile:
- **LOV values**: Metric, Imperial
- **Default**: Metric
- Set during registration or in profile settings
- Determines how all recipe quantities are displayed throughout the app

## Unit Classification

| System | Units | Notes |
|--------|-------|-------|
| **Universal** | cups, tbsp, tsp, pieces, pinch, cloves, slices, whole, bunch | Used in both systems — never converted |
| **Metric** | g, kg, ml, L | |
| **Imperial** | oz, lb, fl oz | |

Each unit in the Measurement Units LOV has a `system` attribute: `universal`, `metric`, or `imperial`.

**Key rule**: Universal units (cups, tbsp, tsp, etc.) are **never converted** regardless of the viewer's preference. Conversion only applies when a recipe uses metric-specific units (g, kg, ml, L) and the viewer prefers imperial, or vice versa.

## Conversion Table

| From | To | Factor |
|------|-----|--------|
| g → oz | ÷ 28.3495 |
| kg → lb | × 2.2046 |
| oz → g | × 28.3495 |
| lb → kg | × 0.4536 |
| ml → fl oz | ÷ 29.5735 |
| L → fl oz | × 33.814 |
| fl oz → ml | × 29.5735 |

Stored as a reference config/table in the backend. Temperatures in step descriptions (e.g., "350°F", "180°C") are text — no automatic conversion (too complex to parse reliably from free text).

## Quantity Storage: Decimal with Fraction Display

Quantities are stored as **decimal numbers** in the database. This enables math operations (serving adjuster multiplication, cross-step ingredient aggregation). Fractions are reconstructed at display time.

### Fraction Lookup Table

Cooking fractions are a small, closed set:

| Decimal | Display |
|---------|---------|
| 0.125 | 1/8 |
| 0.25 | 1/4 |
| 0.333 | 1/3 |
| 0.5 | 1/2 |
| 0.667 | 2/3 |
| 0.75 | 3/4 |

Mixed numbers: separate the whole part, match the fractional part.
- `1.5` → "1 1/2"
- `2.333` → "2 1/3"
- `4.0` → "4"
- `1.15` → "1.15" (no matching fraction — show decimal)

### Display Utility Function

One shared utility (`toFractionDisplay`) handles all quantity formatting:

```
toFractionDisplay(0.333)  → "1/3"
toFractionDisplay(1.5)    → "1 1/2"
toFractionDisplay(2.667)  → "2 2/3"
toFractionDisplay(4.0)    → "4"
toFractionDisplay(1.15)   → "1.15"
```

Matching uses a tolerance window (±0.01) to handle floating-point imprecision from math operations (e.g., `0.333 × 2 = 0.666` should still match "2/3").

### Conversion + Fraction Display Pipeline

When displaying a quantity to a viewer:

```
1. Get stored quantity (decimal) and unit
2. If unit is universal → skip conversion
3. If unit system ≠ viewer system → multiply by conversion factor
4. Apply serving adjuster multiplier (if serving size changed)
5. Pass result through toFractionDisplay()
6. Render: "1 1/2 cups" or "200 g"
```

## Ingredient Quantity Input UX (Edit Mode)

**Fraction picker** — don't require users to type fractions as text:

```
[ 2  ▼ ]  [ 1/3  ▼ ]  [ cups  ▼ ]    flour
  whole     fraction      unit         ingredient name
```

| Field | Type | Values |
|-------|------|--------|
| Whole number | numeric input | 0, 1, 2, 3... |
| Fraction | dropdown | — (none), 1/8, 1/4, 1/3, 1/2, 2/3, 3/4 |
| Unit | dropdown (LOV) | Filtered by recipe's measurement system + universal units |

- Whole + fraction are combined before storage: whole `2` + fraction `1/3` = stored as `2.333`
- The unit dropdown only shows units relevant to the recipe's measurement system (metric + universal, or imperial + universal) — prevents mixing systems within a recipe
- For metric weight/volume quantities (g, kg, ml, L), the fraction picker is hidden and only the numeric input is shown (fractions don't apply to "150 g")

## Recipe-Level Measurement System

| Field | Stored on | Source |
|-------|-----------|--------|
| `measurementSystem` | Recipe table | Copied from author's profile at recipe creation time |

- Determines which units appear in the Edit mode dropdowns
- Determines the "original" system for conversion logic
- Author can override per-recipe if needed (e.g., an Israeli author entering a recipe from an American cookbook might set it to Imperial)

---

# Recipe Data Model

## Recipe (top-level)

| Field | Type | Notes |
|-------|------|-------|
| Name | string | Used as semantic URL slug |
| Description | long rich text | Supports basic formatting |
| Introduction video | URL (Cloudflare) | Optional hero video |
| Image | URL | Hero/thumbnail image |
| Servings | integer | Base serving size |
| Measurement system | LOV | Metric / Imperial — copied from author profile on creation, overridable |
| Difficulty | LOV | Easy / Medium / Hard |
| Cuisine | LOV | Italian, Japanese, Mexican, Indian, French, etc. |
| Meal type | LOV | Breakfast, Lunch, Dinner, Snack, Dessert |
| Dietary tags | LOV (multi) | Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free |
| Is published | boolean | Draft vs public |
| Overall time | calculated | Sum of all wait time + prep time across all steps |
| Overall prep time | calculated | Sum of all prep times across all steps |

## Recipe Step (recipe_steps table)

Each step must have:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Step order | integer | Yes | Determines sequence |
| Title | string | No | Short label; auto-derived from description if blank |
| Description | text | Yes | Main instruction text for this step |
| Video | URL | No | Short clip for this step |
| Prep time | number | Yes | How much active preparation time |
| Prep time unit | LOV | Yes | seconds, minutes, hours |
| Wait time | number | No | Passive waiting time (oven, rising, etc.) |
| Wait time unit | LOV | No | seconds, minutes, hours, days |
| Ingredients | list | Yes | See below |

## Step Ingredient

| Field | Type | Notes |
|-------|------|-------|
| Ingredient name | string (autocomplete) | Autocomplete from master_ingredients table; free-text allowed for unlisted ingredients |
| Quantity | decimal | Stored as decimal (e.g., 0.333 for 1/3). Displayed as fraction via `toFractionDisplay()` |
| Unit | LOV (measurement_units) | Filtered by recipe's measurement system + universal units. Each unit tagged with system attribute |
| Sort order | integer | Display order within the step |

## LOVs Required

| LOV Type | Values | Notes |
|----------|--------|-------|
| Measurement Units | cups, tbsp, tsp, g, kg, ml, L, oz, lb, fl oz, pieces, pinch, bunch, cloves, slices, whole | Each value has `system` attribute: universal / metric / imperial |
| Measurement System | Metric, Imperial | Used on user profile and recipe table |
| Time Units | seconds, minutes, hours, days | |
| Difficulty | Easy, Medium, Hard | |
| Cuisine | Italian, Japanese, Mexican, Indian, French, Thai, Chinese, Mediterranean, American, Middle Eastern | |
| Meal Type | Breakfast, Lunch, Dinner, Snack, Dessert, Appetizer | |
| Dietary Tags | Vegetarian, Vegan, Gluten-Free, Dairy-Free, Nut-Free, Keto, Low-Carb, Halal, Kosher | |

---

# UX Improvements Summary

The following enhancements go beyond the original spec to elevate the Kitchen48 recipe experience:

### 1. Serving Size Adjuster
**What**: +/- control on Summary screen that recalculates all ingredient quantities proportionally.
**Why**: The #1 friction point in recipe apps. Users almost never cook for the exact serving size listed. Eliminates mental math.

### 2. Card-Based Recipe List (replacing plain text list)
**What**: Visual card grid with thumbnails, status badges, and quick actions instead of a name-only text list.
**Why**: Visual recognition is faster than reading text. Users can spot the recipe they want at a glance. Status badges prevent publishing accidents.

### 3. Ingredient Checklist in Play Mode
**What**: Tappable checkboxes on each ingredient during cooking.
**Why**: When cooking, it's easy to lose track of what you've already added, especially with many ingredients. Low-effort interaction (single tap) that prevents mistakes.

### 4. Concurrent Multi-Timer Support
**What**: Each step can have its own running timer; timers persist when navigating between steps with a floating badge.
**Why**: Real cooking often involves parallel tasks — something in the oven while you prep the next step. A single-timer model forces users to track time mentally.

### 5. Kitchen-Optimized Play Mode
**What**: Larger text, oversized touch targets (48px+), high contrast, screen wake lock.
**Why**: Kitchen conditions are hostile to touch interfaces — wet hands, flour, distance from screen, steam. Every tap target needs to be forgiving.

### 6. Auto-Save in Edit Mode
**What**: Changes persist automatically with debounce instead of requiring an explicit save button.
**Why**: Losing work mid-recipe-entry is infuriating. Auto-save is now expected UX (Google Docs, Notion, etc.). A "Saved" indicator provides confidence without adding friction.

### 7. Recipe Metadata Tags (Cuisine, Dietary, Difficulty)
**What**: Structured LOV-based tags on each recipe for cuisine type, dietary restrictions, meal type, and difficulty.
**Why**: Enables discovery, filtering, and helps users quickly assess if a recipe fits their needs. Also critical for future search functionality.

### 8. Step Titles
**What**: Optional short title per step (auto-generated from description if left blank).
**Why**: The left navigator becomes much more useful when steps say "Saut&eacute; the Garlic" instead of "Step 3". Users can jump to the right step without reading full descriptions.

### 9. Print-Friendly View
**What**: Dedicated print layout that combines ingredients + all step instructions on a clean page.
**Why**: Many home cooks still prefer a printed recipe next to the stove. A dedicated layout avoids wasting paper on UI chrome.

### 10. Responsive Mobile-First Step Navigation
**What**: On mobile, replace left/right panes with a horizontal step strip + full-width content area with swipe gestures.
**Why**: Two-pane layouts break on phones. The horizontal strip preserves quick step access while maximizing content space for instructions and video.

### 11. Measurement System with Fraction Support
**What**: User profile stores metric/imperial preference. Recipes store the system they were authored in. Quantities stored as decimals, displayed as clean fractions (1/4, 1/3, 1/2, 2/3, 3/4) via a lookup. Fraction picker input prevents free-text parsing. Universal units (cups, tbsp, tsp) are never converted.
**Why**: Eliminates the #1 internationalization pain point in recipe apps. Storing in the original system avoids double-conversion rounding artifacts ("1/3 cup" stays "1/3 cup"). The fraction picker removes input ambiguity entirely — no parsing "1/3" vs "0.33" vs ".333".
