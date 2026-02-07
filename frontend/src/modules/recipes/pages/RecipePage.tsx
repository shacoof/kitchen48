/**
 * RecipePage
 * Display a full recipe with all steps
 * Accessible via /:nickname/:recipeSlug
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { recipesApi, Recipe } from '../services/recipes.api';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('RecipePage');

// Helper to format time with unit
function formatTime(value: number | null, unit: string | null): string {
  if (!value || !unit) return '';

  const unitLabels: Record<string, string> = {
    SECONDS: 'sec',
    MINUTES: 'min',
    HOURS: 'hr',
    DAYS: 'days',
  };

  return `${value} ${unitLabels[unit] || unit.toLowerCase()}`;
}

export function RecipePage() {
  const { nickname, recipeSlug } = useParams<{ nickname: string; recipeSlug: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nickname || !recipeSlug) {
      setError('Invalid recipe URL');
      setLoading(false);
      return;
    }

    const fetchRecipe = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeBySemanticUrl(nickname, recipeSlug);

      if (result.error) {
        logger.warning(`Failed to load recipe ${nickname}/${recipeSlug}: ${result.error}`);
        setError(result.error === 'Recipe not found' ? 'Recipe not found' : 'Failed to load recipe');
      } else if (result.recipe) {
        setRecipe(result.recipe);
      }

      setLoading(false);
    };

    fetchRecipe();
  }, [nickname, recipeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">Loading recipe...</div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🍳</div>
        <h1 className="text-2xl font-bold text-gray-800">
          {error === 'Recipe not found' ? 'Recipe Not Found' : 'Error'}
        </h1>
        <p className="text-gray-600">
          {error === 'Recipe not found'
            ? "We couldn't find this recipe"
            : 'Something went wrong loading this recipe'}
        </p>
        <Link
          to="/"
          className="mt-4 px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const authorName = [recipe.author?.firstName, recipe.author?.lastName]
    .filter(Boolean)
    .join(' ') || 'Kitchen48 Chef';

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
        </div>
      </header>

      {/* Recipe Content */}
      <main className="max-w-4xl mx-auto py-8 px-6">
        {/* Recipe Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          {/* Recipe Image */}
          {recipe.imageUrl && (
            <div className="w-full h-64 md:h-96 overflow-hidden">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            {/* Title and Author */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {recipe.title}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <Link to={`/${recipe.author?.nickname}`} className="flex items-center gap-3 hover:opacity-80">
                <UserAvatar
                  profilePicture={recipe.author?.profilePicture}
                  name={authorName}
                  size="sm"
                />
                <span className="text-gray-600">by {authorName}</span>
              </Link>
            </div>

            {/* Recipe Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              {recipe.prepTime && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">schedule</span>
                  <span>Prep: {recipe.prepTime} min</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">local_fire_department</span>
                  <span>Cook: {recipe.cookTime} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">restaurant</span>
                  <span>Serves: {recipe.servings}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {recipe.description && (
              <p className="text-gray-700 whitespace-pre-wrap">{recipe.description}</p>
            )}

            {/* Intro Video */}
            {recipe.videoUrl && (
              <div className="mt-6">
                <a
                  href={recipe.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent-orange hover:underline"
                >
                  <span className="material-symbols-outlined">play_circle</span>
                  Watch Intro Video
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Steps</h2>

          {recipe.steps.length === 0 ? (
            <p className="text-gray-500 italic">No steps added yet.</p>
          ) : (
            recipe.steps.map((step, index) => (
              <div
                key={step.id}
                id={step.slug || `step${index + 1}`}
                className="bg-white rounded-xl shadow-md p-6"
              >
                {/* Step Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-orange text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <Link
                      to={`/${nickname}/${recipeSlug}/${step.slug || `step${index + 1}`}`}
                      className="text-sm text-gray-400 hover:text-accent-orange"
                    >
                      #{step.slug || `step${index + 1}`}
                    </Link>
                  </div>

                  {/* Time Info */}
                  <div className="flex gap-4 text-sm text-gray-500">
                    {step.prepTime && step.prepTimeUnit && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">timer</span>
                        <span>Prep: {formatTime(step.prepTime, step.prepTimeUnit)}</span>
                      </div>
                    )}
                    {step.waitTime && step.waitTimeUnit && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base">hourglass_empty</span>
                        <span>Wait: {formatTime(step.waitTime, step.waitTimeUnit)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step Ingredients */}
                {step.ingredients.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Ingredients for this step:</h4>
                    <ul className="list-disc list-inside text-gray-700">
                      {step.ingredients.map((ing) => (
                        <li key={ing.id}>
                          {ing.quantity != null && <span className="font-medium">{ing.quantity} </span>}
                          {ing.unit && <span className="font-medium">{ing.unit} </span>}
                          {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step Instruction */}
                <p className="text-gray-700 whitespace-pre-wrap">{step.instruction}</p>

                {/* Step Video */}
                {step.videoUrl && (
                  <div className="mt-4">
                    <a
                      href={step.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-accent-orange hover:underline text-sm"
                    >
                      <span className="material-symbols-outlined">play_circle</span>
                      Watch Step Video
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-500">
          <Link to="/" className="hover:text-accent-orange">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default RecipePage;
