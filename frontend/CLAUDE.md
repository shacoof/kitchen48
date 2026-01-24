# Frontend - CLAUDE.md

Module-specific instructions and context for Claude Code.

---

## Key Files & Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage/          # Landing page components
│   │   │   ├── index.tsx         # Main landing page export
│   │   │   ├── Header.tsx        # Sticky navigation header
│   │   │   ├── RecipeCard.tsx    # Reusable recipe card
│   │   │   ├── YourRecipes.tsx   # Horizontal recipe carousel
│   │   │   ├── ChefCard.tsx      # Chef profile card
│   │   │   ├── MeetOurMasters.tsx # Chefs showcase section
│   │   │   ├── TrendingCard.tsx  # Large trending recipe card
│   │   │   ├── WhatsHot.tsx      # Trending recipes section
│   │   │   ├── Newsletter.tsx    # Email subscription form
│   │   │   └── Footer.tsx        # Site footer
│   │   └── UnderConstruction.tsx # (deprecated) placeholder page
│   ├── index.css                 # Global styles & Tailwind
│   ├── main.tsx                  # App entry point
│   └── App.tsx                   # Root component
├── tailwind.config.js            # Tailwind theme configuration
└── postcss.config.js             # PostCSS for Tailwind
```

---

## Patterns & Conventions

### Styling
- **Tailwind CSS** for all styling
- Custom theme colors defined in `tailwind.config.js`:
  - `primary`: #2C3E50 (dark blue-gray for backgrounds/nav)
  - `accent-green`: #4CAF50 (success, eco elements)
  - `accent-orange`: #FF5722 (buttons, highlights)
  - `background-light`: #f8fafc
  - `background-dark`: #1a252f
- Fonts: Inter (sans), Playfair Display (display headings)
- Material Symbols Outlined for icons

### Component Organization
- Group related components in folders (e.g., `LandingPage/`)
- Export main component from `index.tsx`
- Each section of a page is its own component

### Image Handling
- Currently using external URLs from Google's image hosting
- Replace with local assets or CDN when deploying to production

---

## Implementation Notes

### Landing Page - 2026-01-24
- Converted from Google Stitch HTML prototype (`misc/style_guide/code.html`)
- Color theme defined in `misc/style_guide/Kithcen48 color theme - Sheet1.csv`
- Design reference screenshot: `misc/style_guide/screen.png`
- Uses placeholder images from Google - need to replace for production
- Newsletter form currently client-side only - needs backend integration

---
