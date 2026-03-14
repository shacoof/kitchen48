#!/usr/bin/env node
/**
 * Copy recipes from dev to production database.
 *
 * Usage:
 *   node scripts/copy-recipe-to-prod.js <nickname>/<slug> [<nickname>/<slug> ...]
 *
 * Example:
 *   node scripts/copy-recipe-to-prod.js auser/saturday-borekas auser/simple-bread
 */

const { Client } = require('pg');

const DEV_URL = 'postgresql://kitchen48_user:kitchen48_dev_password@127.0.0.1:5433/kitchen48_dev';
const PROD_URL = 'postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/copy-recipe-to-prod.js <nickname>/<slug> [...]');
    console.error('Example: node scripts/copy-recipe-to-prod.js auser/saturday-borekas');
    process.exit(1);
  }

  // Parse recipe references from args or URLs
  const recipes = args.map((arg) => {
    // Strip URL prefix if provided
    const cleaned = arg.replace(/^https?:\/\/[^/]+\//, '');
    const parts = cleaned.split('/').filter(Boolean);
    if (parts.length < 2) {
      console.error(`Invalid recipe reference: ${arg} (expected nickname/slug)`);
      process.exit(1);
    }
    return { nickname: parts[0], slug: parts[1] };
  });

  const dev = new Client({ connectionString: DEV_URL });
  const prod = new Client({ connectionString: PROD_URL });

  try {
    await dev.connect();
    await prod.connect();
    console.log('Connected to both databases.\n');

    for (const { nickname, slug } of recipes) {
      console.log(`--- Copying ${nickname}/${slug} ---`);
      await copyRecipe(dev, prod, nickname, slug);
      console.log(`--- Done: ${nickname}/${slug} ---\n`);
    }

    console.log('All recipes copied successfully!');
  } catch (err) {
    console.error('FATAL:', err.message);
    process.exit(1);
  } finally {
    await dev.end();
    await prod.end();
  }
}

async function copyRecipe(dev, prod, nickname, slug) {
  // 1. Find author in dev
  const { rows: [devUser] } = await dev.query(
    'SELECT id, email, nickname FROM users WHERE nickname = $1', [nickname]
  );
  if (!devUser) throw new Error(`User "${nickname}" not found in dev`);
  console.log(`  Dev author: ${devUser.email} (${devUser.id})`);

  // 2. Find matching author in prod (by email)
  const { rows: [prodUser] } = await prod.query(
    'SELECT id, email, nickname FROM users WHERE email = $1', [devUser.email]
  );
  if (!prodUser) throw new Error(`User "${devUser.email}" not found in production. Create the user first.`);
  console.log(`  Prod author: ${prodUser.email} (${prodUser.id})`);

  // 3. Fetch recipe from dev
  const { rows: [recipe] } = await dev.query(
    'SELECT * FROM recipes WHERE author_id = $1 AND slug = $2', [devUser.id, slug]
  );
  if (!recipe) throw new Error(`Recipe "${slug}" not found for user "${nickname}" in dev`);
  console.log(`  Recipe: "${recipe.title}" (${recipe.id})`);

  // 4. Fetch steps
  const { rows: steps } = await dev.query(
    'SELECT * FROM recipe_steps WHERE recipe_id = $1 ORDER BY "order"', [recipe.id]
  );
  console.log(`  Steps: ${steps.length}`);

  // 5. Fetch ingredients for all steps
  const stepIds = steps.map((s) => s.id);
  let ingredients = [];
  if (stepIds.length > 0) {
    const { rows } = await dev.query(
      `SELECT * FROM step_ingredients WHERE step_id = ANY($1) ORDER BY "order"`, [stepIds]
    );
    ingredients = rows;
  }
  console.log(`  Ingredients: ${ingredients.length}`);

  // 6. Fetch dietary tags
  const { rows: dietaryTags } = await dev.query(
    'SELECT * FROM recipe_dietary_tags WHERE recipe_id = $1', [recipe.id]
  );

  // 7. Fetch media assets referenced by recipe and steps
  const mediaIds = [
    recipe.hero_image_id,
    recipe.intro_video_id,
    ...steps.map((s) => s.image_id),
    ...steps.map((s) => s.video_id),
  ].filter(Boolean);

  let mediaAssets = [];
  if (mediaIds.length > 0) {
    const { rows } = await dev.query(
      'SELECT * FROM media_assets WHERE id = ANY($1)', [mediaIds]
    );
    mediaAssets = rows;
  }
  console.log(`  Media assets: ${mediaAssets.length}`);

  // 8. Fetch master ingredients
  const masterIds = ingredients.map((i) => i.master_ingredient_id).filter(Boolean);
  let masterIngredients = [];
  if (masterIds.length > 0) {
    const { rows } = await dev.query(
      'SELECT * FROM master_ingredients WHERE id = ANY($1)', [[...new Set(masterIds)]]
    );
    masterIngredients = rows;
  }

  // --- Now write to production ---
  await prod.query('BEGIN');

  try {
    // 9. Upsert media assets
    for (const ma of mediaAssets) {
      await prod.query(`
        INSERT INTO media_assets (id, type, provider, cf_asset_id, url, thumbnail_url, status,
          original_name, mime_type, file_size, duration_seconds, width, height,
          error_message, uploaded_by, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
        ON CONFLICT (id) DO UPDATE SET
          url = EXCLUDED.url, thumbnail_url = EXCLUDED.thumbnail_url,
          status = EXCLUDED.status, updated_at = EXCLUDED.updated_at
      `, [
        ma.id, ma.type, ma.provider, ma.cf_asset_id, ma.url, ma.thumbnail_url, ma.status,
        ma.original_name, ma.mime_type, ma.file_size, ma.duration_seconds, ma.width, ma.height,
        ma.error_message, prodUser.id, ma.created_at, ma.updated_at,
      ]);
    }

    // 10. Upsert master ingredients — map dev IDs to prod IDs
    const masterIdMap = {}; // dev_id -> prod_id
    for (const mi of masterIngredients) {
      // Check if already exists by name in prod
      const { rows: [existing] } = await prod.query(
        'SELECT id FROM master_ingredients WHERE name = $1', [mi.name]
      );
      if (existing) {
        masterIdMap[mi.id] = existing.id;
      } else {
        await prod.query(`
          INSERT INTO master_ingredients (id, name, category, description, is_active, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (id) DO NOTHING
        `, [mi.id, mi.name, mi.category, mi.description, mi.is_active, mi.created_at, mi.updated_at]);
        masterIdMap[mi.id] = mi.id;
      }
    }

    // 11. Upsert recipe (remap author_id to prod user)
    await prod.query(`
      INSERT INTO recipes (id, title, slug, description, prep_time, cook_time, servings,
        image_url, video_url, is_published, measurement_system, difficulty, cuisine,
        meal_type, hero_image_id, intro_video_id, author_id, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, description = EXCLUDED.description,
        prep_time = EXCLUDED.prep_time, cook_time = EXCLUDED.cook_time,
        servings = EXCLUDED.servings, image_url = EXCLUDED.image_url,
        video_url = EXCLUDED.video_url, is_published = EXCLUDED.is_published,
        measurement_system = EXCLUDED.measurement_system, difficulty = EXCLUDED.difficulty,
        cuisine = EXCLUDED.cuisine, meal_type = EXCLUDED.meal_type,
        hero_image_id = EXCLUDED.hero_image_id, intro_video_id = EXCLUDED.intro_video_id,
        updated_at = EXCLUDED.updated_at
    `, [
      recipe.id, recipe.title, recipe.slug, recipe.description,
      recipe.prep_time, recipe.cook_time, recipe.servings,
      recipe.image_url, recipe.video_url, recipe.is_published,
      recipe.measurement_system, recipe.difficulty, recipe.cuisine,
      recipe.meal_type, recipe.hero_image_id, recipe.intro_video_id,
      prodUser.id, recipe.created_at, recipe.updated_at,
    ]);

    // 12. Delete old steps/ingredients in prod (cascade will handle ingredients)
    await prod.query('DELETE FROM recipe_steps WHERE recipe_id = $1', [recipe.id]);

    // 13. Insert steps
    for (const step of steps) {
      await prod.query(`
        INSERT INTO recipe_steps (id, slug, title, instruction, "order", duration, video_url,
          prep_time, prep_time_unit, wait_time, wait_time_unit,
          image_id, video_id, recipe_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      `, [
        step.id, step.slug, step.title, step.instruction, step.order, step.duration,
        step.video_url, step.prep_time, step.prep_time_unit, step.wait_time, step.wait_time_unit,
        step.image_id, step.video_id, recipe.id,
      ]);
    }

    // 14. Insert ingredients
    for (const ing of ingredients) {
      const masterIdProd = ing.master_ingredient_id
        ? (masterIdMap[ing.master_ingredient_id] || null)
        : null;

      await prod.query(`
        INSERT INTO step_ingredients (id, name, quantity, unit, "order", step_id, master_ingredient_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [ing.id, ing.name, ing.quantity, ing.unit, ing.order, ing.step_id, masterIdProd]);
    }

    // 15. Upsert dietary tags
    for (const tag of dietaryTags) {
      await prod.query(`
        INSERT INTO recipe_dietary_tags (id, recipe_id, tag)
        VALUES ($1,$2,$3)
        ON CONFLICT (recipe_id, tag) DO NOTHING
      `, [tag.id, tag.recipe_id, tag.tag]);
    }

    await prod.query('COMMIT');
    console.log('  Committed to production.');
  } catch (err) {
    await prod.query('ROLLBACK');
    throw new Error(`Failed to write to production: ${err.message}`);
  }
}

main();
