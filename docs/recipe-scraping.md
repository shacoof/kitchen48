# Recipe Scraping — Strategy & Prompt

How to extract recipes from web pages and create them in Kitchen48.

---

## Strategy (in order)

1. **Try WordPress REST API first** — Most food blogs run WordPress. Convert the URL slug and fetch `/wp-json/wp/v2/posts?slug=<slug>`. This bypasses JS rendering and returns raw HTML content.
2. **If not WordPress**, use WebFetch on the original URL with the prompt below.
3. **NEVER follow links to other pages** — all recipe info is on the page the user gave you. Do not search other sites for the same recipe.

---

## WebFetch Prompt Template

```
This page contains a recipe in Hebrew (or the relevant language). Extract ONLY the recipe data — ignore navigation, ads, comments, links to other recipes, author bio, and social sharing.

Return the following in the ORIGINAL language (do NOT translate):

1. TITLE: The recipe name exactly as written
2. YIELD: How many servings/pieces
3. OVEN TEMP: If mentioned
4. BAKE/COOK TIME: If mentioned

5. INGREDIENTS: List every ingredient with its EXACT quantity and unit. Group by section if the recipe has sections (e.g., "לבצק", "למילוי", "לציפוי"). Format: "- <quantity> <unit> <ingredient name>"

6. STEPS: Every preparation step, numbered, with the FULL original text. Do not summarize or shorten.

IMPORTANT: Return verbatim Hebrew text. Do NOT translate to English. Do NOT summarize. Do NOT omit any ingredient or step.
```

---

## Why This Approach

- JS-heavy food blogs often fail with WebFetch because the recipe content is rendered client-side.
- The WordPress REST API (`/wp-json/wp/v2/posts`) bypasses this entirely and returns the raw post HTML.
- Following links to other recipe sites wastes time and may return a different recipe — the original URL always has all the information needed.

---

## WordPress REST API — How to Use

Given a recipe URL like:

```
https://lizapanelim.com/בוריקיטוסים-בצ'יק/
```

Fetch the post via:

```
https://lizapanelim.com/wp-json/wp/v2/posts?slug=בוריקיטוסים-בצ'יק
```

The slug is the last path segment of the URL (URL-decoded).

---

## Structured JSON Output Format

When extracting a recipe, return ONLY valid JSON with this exact structure (no markdown, no code blocks):

```json
{
  "title": "Recipe Title (in original language)",
  "description": "Brief description of the dish",
  "servings": 4,
  "measurementSystem": "metric",
  "difficulty": "easy",
  "cuisine": "italian",
  "mealType": "dinner",
  "dietaryTags": ["vegetarian"],
  "steps": [
    {
      "instruction": "Full step instruction text (do NOT summarize)",
      "prepTime": 10,
      "prepTimeUnit": "MINUTES",
      "waitTime": null,
      "waitTimeUnit": null,
      "ingredients": [
        { "name": "flour", "quantity": 200, "unit": "g" },
        { "name": "salt", "quantity": 1, "unit": "tsp" }
      ]
    }
  ],
  "warnings": ["List any items that were unclear or guessed"]
}
```

### Field rules

| Field | Rules |
|-------|-------|
| `title` | Recipe name exactly as written on the page, in the original language (do NOT translate) |
| `description` | Short summary; null if not available |
| `servings` | Integer number of servings/portions; null if not mentioned |
| `measurementSystem` | `"metric"` or `"imperial"` based on units used |
| `difficulty` | `"easy"`, `"medium"`, or `"hard"` — best guess from complexity |
| `cuisine` | Cuisine type (e.g., `"italian"`, `"japanese"`); null if unclear |
| `mealType` | Meal type (e.g., `"dinner"`, `"breakfast"`, `"dessert"`); null if unclear |
| `dietaryTags` | Array of tags like `"vegetarian"`, `"gluten-free"`, `"vegan"`; empty array if none |
| `steps[].instruction` | Full original text of the step — do NOT summarize or shorten |
| `steps[].prepTime` | Active work time in minutes (integer); null if not identifiable |
| `steps[].prepTimeUnit` | Always `"MINUTES"` when prepTime is set; null otherwise |
| `steps[].waitTime` | Passive wait time (oven, resting, rising) in minutes; null if not identifiable |
| `steps[].waitTimeUnit` | Always `"MINUTES"` when waitTime is set; null otherwise |
| `ingredients[].name` | Ingredient name in original language |
| `ingredients[].quantity` | Numeric quantity (decimal); null if "to taste" or unspecified |
| `ingredients[].unit` | Standard unit code: `g`, `kg`, `ml`, `l`, `cups`, `tbsp`, `tsp`, `pieces`, `pinch`, `cloves`, `slices`, `whole`, `bunch`, `oz`, `lb`, `fl_oz`; null if unitless |
| `warnings` | Array of strings noting unclear or guessed items; prefix uncertain values with `"[REVIEW] "` |

### Grouping ingredients into steps

If the recipe has sections (e.g., "For the dough", "For the filling"), create a separate step for each section's preparation. Assign ingredients to the step where they are used.
