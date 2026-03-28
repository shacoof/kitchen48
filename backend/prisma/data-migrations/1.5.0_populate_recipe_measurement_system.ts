import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const version = '1.5.0';
export const description =
  'Populate null recipe.measurementSystem based on ingredient units. ' +
  'Imperial ingredients are converted to metric. Universal-only recipes default to metric.';

// --------------------------------------------------------------------------
// Unit classification (mirrors backend/src/lib/measurement.ts)
// --------------------------------------------------------------------------

type UnitSystem = 'universal' | 'metric' | 'imperial';

const UNIT_SYSTEMS: Record<string, UnitSystem> = {
  cups: 'universal', tbsp: 'universal', tsp: 'universal',
  pieces: 'universal', pinch: 'universal', cloves: 'universal',
  slices: 'universal', whole: 'universal', bunch: 'universal',
  g: 'metric', kg: 'metric', ml: 'metric', l: 'metric',
  oz: 'imperial', lb: 'imperial', fl_oz: 'imperial',
};

function getUnitSystem(unit: string): UnitSystem {
  return UNIT_SYSTEMS[unit] || 'universal';
}

// --------------------------------------------------------------------------
// Conversion (mirrors backend/src/lib/measurement.ts)
// --------------------------------------------------------------------------

interface ConversionPair {
  metricUnit: string;
  imperialUnit: string;
  toImperial: number;
}

const CONVERSIONS: ConversionPair[] = [
  { metricUnit: 'g', imperialUnit: 'oz', toImperial: 0.035274 },
  { metricUnit: 'kg', imperialUnit: 'lb', toImperial: 2.20462 },
  { metricUnit: 'ml', imperialUnit: 'fl_oz', toImperial: 0.033814 },
  { metricUnit: 'l', imperialUnit: 'fl_oz', toImperial: 33.814 },
];

function convertToMetric(
  quantity: number,
  unit: string
): { quantity: number; unit: string } | null {
  const pair = CONVERSIONS.find((c) => c.imperialUnit === unit);
  if (!pair) return null;
  return {
    quantity: Math.round((quantity / pair.toImperial) * 100) / 100,
    unit: pair.metricUnit,
  };
}

// --------------------------------------------------------------------------
// Migration
// --------------------------------------------------------------------------

export async function run(): Promise<void> {
  // Find all recipes with null measurementSystem
  const recipes = await prisma.recipe.findMany({
    where: { measurementSystem: null },
    select: {
      id: true,
      title: true,
      steps: {
        select: {
          ingredients: {
            select: {
              id: true,
              quantity: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  if (recipes.length === 0) {
    console.log('No recipes with null measurementSystem found. Nothing to do.');
    return;
  }

  console.log(`Found ${recipes.length} recipe(s) with null measurementSystem`);

  let setMetric = 0;
  let ingredientsConverted = 0;

  for (const recipe of recipes) {
    // Collect all ingredients across all steps
    const allIngredients = recipe.steps.flatMap((s) => s.ingredients);

    // Classify units
    const systems = new Set<UnitSystem>();
    for (const ing of allIngredients) {
      if (ing.unit) {
        systems.add(getUnitSystem(ing.unit));
      }
    }

    const hasImperial = systems.has('imperial');

    if (hasImperial) {
      // Convert imperial ingredients to metric in the DB
      for (const ing of allIngredients) {
        if (!ing.unit || !ing.quantity) continue;
        if (getUnitSystem(ing.unit) !== 'imperial') continue;

        const converted = convertToMetric(Number(ing.quantity), ing.unit);
        if (!converted) continue;

        await prisma.stepIngredient.update({
          where: { id: ing.id },
          data: {
            quantity: new Prisma.Decimal(converted.quantity),
            unit: converted.unit,
          },
        });
        ingredientsConverted++;
      }
    }

    // All cases → set metric (universal-only, metric-only, or after converting imperial)
    await prisma.recipe.update({
      where: { id: recipe.id },
      data: { measurementSystem: 'metric' },
    });
    setMetric++;

    const note = hasImperial ? ' (imperial ingredients converted)' : '';
    console.log(`  ✓ "${recipe.title}" → metric${note}`);
  }

  console.log(
    `Done. Set ${setMetric} recipe(s) to metric. Converted ${ingredientsConverted} ingredient(s).`
  );
}
