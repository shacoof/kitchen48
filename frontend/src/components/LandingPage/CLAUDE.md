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
- Displays recipe thumbnail, title, author
- Reusable across sections
- Props: `image`, `title`, `author`, `time`

### YourRecipes
- Horizontal scrolling carousel
- Multiple RecipeCards
- Placeholder data (needs backend integration)

### MeetOurMasters / ChefCard
- Grid of chef profile cards
- Shows avatar, name, specialty
- Placeholder data (needs backend integration)

### WhatsHot / TrendingCard
- Large featured recipe cards
- Trending/popular recipes section

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

Currently uses external URLs from Google's image hosting as placeholders.
**TODO:** Replace with local assets or CDN for production.

---

## Design Reference

- Original HTML: `misc/style_guide/code.html`
- Color theme: `misc/style_guide/Kithcen48 color theme - Sheet1.csv`
- Screenshot: `misc/style_guide/screen.png`

---

## Known Issues & TODOs

- [ ] Replace placeholder images with real assets
- [ ] Connect Newsletter to backend API
- [ ] Fetch real recipes from API
- [ ] Fetch real chefs from API
- [ ] Add recipe search functionality
- [ ] Add category filtering
- [ ] Improve mobile responsiveness

---

## Implementation Date

2026-01-24
