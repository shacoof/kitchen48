/**
 * Recipes Module
 * Public exports for the recipes feature
 */

// Pages
export { RecipePage } from './pages/RecipePage';
export { RecipeStepPage } from './pages/RecipeStepPage';
export { RecipePlayPage } from './pages/RecipePlayPage';
export { CreateRecipePage } from './pages/CreateRecipePage';
export { MyRecipesPage } from './pages/MyRecipesPage';

// Components
export { RecipeCard } from './components/RecipeCard';

// API
export { recipesApi } from './services/recipes.api';
export type {
  Recipe,
  RecipeListItem,
  Step,
  StepIngredient,
  RecipeAuthor,
  DietaryTag,
  AggregatedIngredient,
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateStepInput,
  UpdateStepInput,
  TimeUnit,
} from './services/recipes.api';
