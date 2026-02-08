# Landing Page Module - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Requirements

This module implements the public landing page for Kitchen48 (www.kitchen48.com):

1. **Hero Section**
   - Welcome message and tagline
   - Call-to-action buttons

2. **Recipe Sections**
   - "Your Recipes" horizontal carousel
   - "What's Hot" trending recipes

3. **Chef Showcase**
   - "Meet Our Masters" section
   - Chef profile cards

4. **Newsletter**
   - Email subscription form

5. **Navigation**
   - Header with auth-aware user menu
   - Footer with links

---

## Directory Structure

```
frontend/src/components/LandingPage/
├── CLAUDE.md          # This file
├── index.tsx          # Main export, composes all sections
├── Header.tsx         # Navigation header with auth menu
├── Footer.tsx         # Site footer
├── RecipeCard.tsx     # Reusable recipe card component
├── YourRecipes.tsx    # Horizontal recipe carousel
├── ChefCard.tsx       # Chef profile card
├── MeetOurMasters.tsx # Chefs showcase section
├── TrendingCard.tsx   # Large trending recipe card
├── WhatsHot.tsx       # Trending recipes section
└── Newsletter.tsx     # Email subscription form
```

---

## Components

### Header
- Sticky navigation at top
- Logo and nav links (Home, Recipes, Chefs)
- Auth-aware user menu:
  - Logged out: "Sign In" button
  - Logged in: User dropdown with "Sign Out"
- Uses `useAuth()` from AuthContext

### RecipeCard
- Displays recipe thumbnail, title, description, time, dietary tag
- Links to recipe page via `/:nickname/:slug`
- Props: `imageUrl`, `title`, `description`, `prepTime`, `cookTime`, `tag`, `authorNickname`, `slug`
- Fallback placeholder when no image

### YourRecipes
- Horizontal scrolling carousel of published recipes
- Fetches from `GET /api/recipes?isPublished=true&limit=5`
- Loading skeleton while fetching
- Hidden when no published recipes exist
- "View All" links to `/explore`

### MeetOurMasters / ChefCard
- Grid of featured author cards (users with published recipes)
- Fetches from `GET /api/users/featured?limit=4`
- ChefCard links to user profile (`/:nickname`)
- Shows description or recipe count as subtitle
- Fallback avatar when no profile picture

### WhatsHot / TrendingCard
- Large featured recipe cards (currently shows most recent published)
- Fetches from `GET /api/recipes?isPublished=true&limit=2`
- Shows dietary tags as badges, step count
- Links to recipe pages

### Newsletter
- Email input + subscribe button
- Client-side only (needs backend integration)

### Footer
- Site links
- Social media icons
- Copyright notice

---

## Styling

Uses Tailwind CSS with custom theme:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | #2C3E50 | Dark backgrounds, nav |
| `accent-green` | #4CAF50 | Success, eco elements |
| `accent-orange` | #FF5722 | Buttons, CTAs |
| `background-light` | #f8fafc | Light backgrounds |
| `background-dark` | #1a252f | Dark backgrounds |

**Fonts:**
- `font-sans` - Inter (body text)
- `font-display` - Playfair Display (headings)

**Icons:**
- Material Symbols Outlined (Google Fonts)

---

## Image Handling

Recipe and chef images come from the database (`imageUrl`, `profilePicture` fields).
Components include fallback placeholders (material icons) when no image is set.

---

## Design Reference

- Original HTML: `misc/style_guide/code.html`
- Color theme: `misc/style_guide/Kithcen48 color theme - Sheet1.csv`
- Screenshot: `misc/style_guide/screen.png`

---

## Known Issues & TODOs

- [ ] Connect Newsletter to backend API
- [ ] Add recipe search functionality
- [ ] Add category filtering
- [ ] Add true "trending" logic (view-based ranking via statistics)
- [ ] Add likes/comments system for social engagement metrics
- [x] ~~Replace placeholder images with real assets~~ (Dynamic data, 2026-02-08)
- [x] ~~Fetch real recipes from API~~ (2026-02-08)
- [x] ~~Fetch real chefs from API~~ (2026-02-08)
- [x] ~~Improve mobile responsiveness~~ (Header mobile nav added 2026-02-07)

## Fixes Applied

### 2026-02-08: Dynamic landing page sections (replaced hardcoded data)
- **Issue**: YourRecipes, WhatsHot, and MeetOurMasters all used hardcoded placeholder arrays
- **Fix**: All three sections now fetch real data from the API:
  - YourRecipes: `recipesApi.getRecipes({ isPublished: true, limit: 5 })`
  - WhatsHot: `recipesApi.getRecipes({ isPublished: true, limit: 2 })`
  - MeetOurMasters: `usersApi.getFeaturedAuthors(4)` (new endpoint)
- **Backend changes**: Added `GET /api/users/featured` endpoint, enhanced recipe list response with `prepTime`, `cookTime`, `dietaryTags`, author `profilePicture`
- **UX**: Loading skeletons while fetching, sections hidden when no data, cards link to real pages

### 2026-02-07: Mobile hamburger menu for Header navigation
- **Bug**: Main nav (Explore, Recipes, Chefs, Community) hidden on mobile (<768px) with no alternative
- **Fix**: Added hamburger button + mobile nav dropdown in `Header.tsx`. Uses `mobileNavOpen` state, material icons, existing i18n keys.

---

## Implementation Date

2026-01-24
