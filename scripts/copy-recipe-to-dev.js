#!/usr/bin/env node
/**
 * Copy recipes from production to dev database.
 *
 * Usage:
 *   node scripts/copy-recipe-to-dev.js <nickname>/<slug> [<nickname>/<slug> ...]
 *
 * Example:
 *   node scripts/copy-recipe-to-dev.js auser/saturday-borekas auser/simple-bread
 *   node scripts/copy-recipe-to-dev.js https://www.kitchen48.com/auser/saturday-borekas
 */

const { Client } = require('pg');
const { execSync, spawn } = require('child_process');
const net = require('net');

const DEV_URL = 'postgresql://kitchen48_user:kitchen48_dev_password@127.0.0.1:5433/kitchen48_dev';
const PROD_URL = 'postgresql://kitchen48_user:k48shacoof123@127.0.0.1:5434/kitchen48_prod';
const PROXY_BIN = '/home/owner/cloud-sql-proxy';
const PROXY_INSTANCE = 'kitchen48-app-1769028672:us-central1:kitchen48-db';
const PROXY_PORT = 5434;

function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(1000);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('error', () => { sock.destroy(); resolve(false); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.connect(port, '127.0.0.1');
  });
}

async function ensureProxy() {
  if (await isPortOpen(PROXY_PORT)) {
    return false; // already running
  }

  console.log('Cloud SQL proxy not running. Starting it...');
  const child = spawn(PROXY_BIN, [
    PROXY_INSTANCE,
    '--port', String(PROXY_PORT),
    '--address', '0.0.0.0',
    '--gcloud-auth',
  ], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  // Wait for proxy to be ready (up to 10 seconds)
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isPortOpen(PROXY_PORT)) {
      console.log('Cloud SQL proxy is ready.\n');
      return true;
    }
  }

  throw new Error('Cloud SQL proxy failed to start. Check gcloud auth: gcloud auth login');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/copy-recipe-to-dev.js <nickname>/<slug> [...]');
    console.error('       node scripts/copy-recipe-to-dev.js ALL');
    console.error('Example: node scripts/copy-recipe-to-dev.js auser/saturday-borekas');
    process.exit(1);
  }

  await ensureProxy();

  const dev = new Client({ connectionString: DEV_URL });
  const prod = new Client({ connectionString: PROD_URL });

  try {
    await dev.connect();
    await prod.connect();
    console.log('Connected to both databases.\n');

    let recipes;

    if (args.length === 1 && args[0].toUpperCase() === 'ALL') {
      // Fetch all recipes from prod with their author nicknames
      const { rows } = await prod.query(`
        SELECT u.nickname, r.slug
        FROM recipes r
        JOIN users u ON u.id = r.author_id
        ORDER BY u.nickname, r.slug
      `);
      recipes = rows;
      console.log(`Found ${recipes.length} recipes in production.\n`);
    } else {
      // Parse recipe references from args or URLs
      recipes = args.map((arg) => {
        const cleaned = arg.replace(/^https?:\/\/[^/]+\//, '');
        const parts = cleaned.split('/').filter(Boolean);
        if (parts.length < 2) {
          console.error(`Invalid recipe reference: ${arg} (expected nickname/slug)`);
          process.exit(1);
        }
        return { nickname: parts[0], slug: parts[1] };
      });
    }

    for (const { nickname, slug } of recipes) {
      console.log(`--- Copying ${nickname}/${slug} (prod → dev) ---`);
      try {
        await copyRecipe(prod, dev, nickname, slug);
        console.log(`--- Done: ${nickname}/${slug} ---\n`);
      } catch (err) {
        console.error(`--- FAILED: ${nickname}/${slug}: ${err.message} ---\n`);
      }
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

async function copyRecipe(prod, dev, nickname, slug) {
  // 1. Find author in prod
  const { rows: [prodUser] } = await prod.query(
    'SELECT id, email, nickname FROM users WHERE nickname = $1', [nickname]
  );
  if (!prodUser) throw new Error(`User "${nickname}" not found in prod`);
  console.log(`  Prod author: ${prodUser.email} (${prodUser.id})`);

  // 2. Find matching author in dev (by email)
  const { rows: [devUser] } = await dev.query(
    'SELECT id, email, nickname FROM users WHERE email = $1', [prodUser.email]
  );
  if (!devUser) throw new Error(`User "${prodUser.email}" not found in dev. Create the user first.`);
  console.log(`  Dev author: ${devUser.email} (${devUser.id})`);

  // 3. Fetch recipe from prod
  const { rows: [recipe] } = await prod.query(
    'SELECT * FROM recipes WHERE author_id = $1 AND slug = $2', [prodUser.id, slug]
  );
  if (!recipe) throw new Error(`Recipe "${slug}" not found for user "${nickname}" in prod`);
  console.log(`  Recipe: "${recipe.title}" (${recipe.id})`);

  // 4. Fetch steps
  const { rows: steps } = await prod.query(
    'SELECT * FROM recipe_steps WHERE recipe_id = $1 ORDER BY "order"', [recipe.id]
  );
  console.log(`  Steps: ${steps.length}`);

  // 5. Fetch ingredients for all steps
  const stepIds = steps.map((s) => s.id);
  let ingredients = [];
  if (stepIds.length > 0) {
    const { rows } = await prod.query(
      `SELECT * FROM step_ingredients WHERE step_id = ANY($1) ORDER BY "order"`, [stepIds]
    );
    ingredients = rows;
  }
  console.log(`  Ingredients: ${ingredients.length}`);

  // 6. Fetch dietary tags
  const { rows: dietaryTags } = await prod.query(
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
    const { rows } = await prod.query(
      'SELECT * FROM media_assets WHERE id = ANY($1)', [mediaIds]
    );
    mediaAssets = rows;
  }
  console.log(`  Media assets: ${mediaAssets.length}`);

  // 8. Fetch master ingredients
  const masterIds = ingredients.map((i) => i.master_ingredient_id).filter(Boolean);
  let masterIngredients = [];
  if (masterIds.length > 0) {
    const { rows } = await prod.query(
      'SELECT * FROM master_ingredients WHERE id = ANY($1)', [[...new Set(masterIds)]]
    );
    masterIngredients = rows;
  }

  // --- Now write to dev ---
  await dev.query('BEGIN');

  try {
    // 9. Upsert media assets
    for (const ma of mediaAssets) {
      await dev.query(`
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
        ma.error_message, devUser.id, ma.created_at, ma.updated_at,
      ]);
    }

    // 10. Upsert master ingredients — map prod IDs to dev IDs
    const masterIdMap = {}; // prod_id -> dev_id
    for (const mi of masterIngredients) {
      // Check if already exists by name in dev
      const { rows: [existing] } = await dev.query(
        'SELECT id FROM master_ingredients WHERE name = $1', [mi.name]
      );
      if (existing) {
        masterIdMap[mi.id] = existing.id;
      } else {
        await dev.query(`
          INSERT INTO master_ingredients (id, name, category, description, is_active, created_at, updated_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7)
          ON CONFLICT (id) DO NOTHING
        `, [mi.id, mi.name, mi.category, mi.description, mi.is_active, mi.created_at, mi.updated_at]);
        masterIdMap[mi.id] = mi.id;
      }
    }

    // 11. Upsert recipe (remap author_id to dev user)
    await dev.query(`
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
      devUser.id, recipe.created_at, recipe.updated_at,
    ]);

    // 12. Delete old steps/ingredients in dev (cascade will handle ingredients)
    await dev.query('DELETE FROM recipe_steps WHERE recipe_id = $1', [recipe.id]);

    // 13. Insert steps
    for (const step of steps) {
      await dev.query(`
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
      const masterIdDev = ing.master_ingredient_id
        ? (masterIdMap[ing.master_ingredient_id] || null)
        : null;

      await dev.query(`
        INSERT INTO step_ingredients (id, name, quantity, unit, "order", step_id, master_ingredient_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [ing.id, ing.name, ing.quantity, ing.unit, ing.order, ing.step_id, masterIdDev]);
    }

    // 15. Upsert dietary tags
    for (const tag of dietaryTags) {
      await dev.query(`
        INSERT INTO recipe_dietary_tags (id, recipe_id, tag)
        VALUES ($1,$2,$3)
        ON CONFLICT (recipe_id, tag) DO NOTHING
      `, [tag.id, tag.recipe_id, tag.tag]);
    }

    await dev.query('COMMIT');
    console.log('  Committed to dev.');
  } catch (err) {
    await dev.query('ROLLBACK');
    throw new Error(`Failed to write to dev: ${err.message}`);
  }
}

main();
