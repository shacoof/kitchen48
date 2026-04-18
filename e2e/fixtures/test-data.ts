/**
 * E2E Test Data Constants
 *
 * Known credentials and identifiers for seeded test data.
 * Must match what e2e/fixtures/seed.ts creates.
 */

export const TEST_USER = {
  email: 'e2e-user@kitchen48.com',
  password: 'E2eTestPass123!',
  firstName: 'E2E',
  lastName: 'TestUser',
  nickname: 'e2etestuser',
};

export const ADMIN_USER = {
  email: 'e2e-admin@kitchen48.com',
  password: 'E2eAdminPass123!',
  firstName: 'E2E',
  lastName: 'Admin',
  nickname: 'e2eadmin',
};

export const OTHER_USER = {
  email: 'e2e-other@kitchen48.com',
  password: 'E2eOtherPass123!',
  firstName: 'Other',
  lastName: 'Chef',
  nickname: 'otherchef',
};

export const RECIPES = {
  published1: {
    title: 'E2E Classic Pancakes',
    slug: 'e2e-classic-pancakes',
    description: 'Fluffy pancakes for E2E testing',
    servings: 4,
    steps: [
      { title: 'Mix dry ingredients', instruction: 'Combine flour, sugar, baking powder, and salt in a large bowl.' },
      { title: 'Add wet ingredients', instruction: 'Whisk milk, egg, and melted butter. Pour into dry mix and stir until just combined.' },
      { title: 'Cook pancakes', instruction: 'Heat a griddle over medium heat. Pour 1/4 cup batter per pancake. Cook until bubbles form, flip, cook 2 more minutes.' },
    ],
  },
  published2: {
    title: 'E2E Garden Salad',
    slug: 'e2e-garden-salad',
    description: 'Fresh garden salad for E2E testing',
    servings: 2,
    steps: [
      { title: 'Prepare vegetables', instruction: 'Wash and chop lettuce, tomatoes, and cucumbers.' },
      { title: 'Make dressing', instruction: 'Whisk olive oil, lemon juice, salt and pepper.' },
      { title: 'Toss and serve', instruction: 'Combine vegetables in a bowl, drizzle with dressing, and toss gently.' },
    ],
  },
  draft: {
    title: 'E2E Draft Recipe',
    slug: 'e2e-draft-recipe',
    description: 'An unpublished draft recipe for testing',
    servings: 1,
    steps: [
      { title: 'Step one', instruction: 'This is a draft step.' },
    ],
  },
  otherUser: {
    title: 'E2E Other Chef Pasta',
    slug: 'e2e-other-chef-pasta',
    description: 'A recipe by another user for bookmark testing',
    servings: 2,
    steps: [
      { title: 'Boil pasta', instruction: 'Bring a large pot of salted water to a boil. Add pasta and cook until al dente.' },
      { title: 'Make sauce', instruction: 'In a pan, sauté garlic in olive oil. Add crushed tomatoes and simmer 15 minutes.' },
      { title: 'Combine', instruction: 'Drain pasta, toss with sauce, garnish with basil and parmesan.' },
    ],
  },
  otherUser2: {
    title: 'E2E Other Chef Soup',
    slug: 'e2e-other-chef-soup',
    description: 'A second recipe by another user',
    servings: 4,
    steps: [
      { title: 'Sauté aromatics', instruction: 'Cook onion, carrot, and celery in butter until soft.' },
      { title: 'Simmer', instruction: 'Add broth and potatoes. Simmer 20 minutes until tender.' },
    ],
  },
};

export const INGREDIENTS = [
  'Flour', 'Sugar', 'Salt', 'Butter', 'Milk', 'Eggs',
  'Olive Oil', 'Garlic', 'Tomatoes', 'Onion', 'Pepper',
  'Lettuce', 'Cucumber', 'Lemon', 'Basil', 'Parmesan',
];
