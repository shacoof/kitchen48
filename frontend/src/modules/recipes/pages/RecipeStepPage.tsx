/**
 * RecipeStepPage
 * Display a single step of a recipe
 * Accessible via /:nickname/:recipeSlug/:stepSlug
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { recipesApi, Step, RecipeAuthor } from '../services/recipes.api';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('RecipeStepPage');

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

interface RecipeInfo {
  id: string;
  title: string;
  slug: string;
  author: RecipeAuthor;
}

export function RecipeStepPage() {
  const { nickname, recipeSlug, stepSlug } = useParams<{
    nickname: string;
    recipeSlug: string;
    stepSlug: string;
  }>();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState<RecipeInfo | null>(null);
  const [step, setStep] = useState<Step | null>(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nickname || !recipeSlug || !stepSlug) {
      setError('Invalid step URL');
      setLoading(false);
      return;
    }

    const fetchStep = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeBySemanticUrl(nickname, recipeSlug);

      if (result.error) {
        logger.warning(`Failed to load step ${nickname}/${recipeSlug}/${stepSlug}: ${result.error}`);
        setError(
          result.error.includes('not found') ? 'Step not found' : 'Failed to load step'
        );
      } else if (result.recipe) {
        const r = result.recipe;
        setRecipe({ id: r.id, title: r.title, slug: r.slug, author: r.author! });
        setTotalSteps(r.steps.length);

        // Find step by slug or by index (step1, step2, etc.)
        const idx = r.steps.findIndex((s) => s.slug === stepSlug);
        const stepNumMatch = stepSlug?.match(/^step(\d+)$/);
        const foundIndex = idx >= 0 ? idx : stepNumMatch ? parseInt(stepNumMatch[1]) - 1 : -1;

        if (foundIndex >= 0 && foundIndex < r.steps.length) {
          setStep(r.steps[foundIndex]);
          setStepIndex(foundIndex);
        } else {
          setError('Step not found');
        }
      }

      setLoading(false);
    };

    fetchStep();
  }, [nickname, recipeSlug, stepSlug]);

  const goToStep = (index: number) => {
    if (index >= 0 && index < totalSteps) {
      const newSlug = `step${index + 1}`;
      navigate(`/${nickname}/${recipeSlug}/${newSlug}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">Loading step...</div>
      </div>
    );
  }

  if (error || !recipe || !step) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🍳</div>
        <h1 className="text-2xl font-bold text-gray-800">
          {error === 'Step not found' ? 'Step Not Found' : 'Error'}
        </h1>
        <p className="text-gray-600">
          {error === 'Step not found'
            ? "We couldn't find this step"
            : 'Something went wrong loading this step'}
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            to={`/${nickname}/${recipeSlug}`}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            View Recipe
          </Link>
          <Link
            to="/"
            className="px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const authorName = [recipe.author?.firstName, recipe.author?.lastName]
    .filter(Boolean)
    .join(' ') || 'Kitchen48 Chef';

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
          <Link
            to={`/${nickname}/${recipeSlug}`}
            className="flex items-center gap-2 text-white hover:text-accent-orange"
          >
            <span className="material-symbols-outlined">menu_book</span>
            <span className="hidden sm:inline">Full Recipe</span>
          </Link>
        </div>
      </header>

      {/* Recipe Title Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link
              to={`/${nickname}/${recipeSlug}`}
              className="text-lg font-semibold text-gray-800 hover:text-accent-orange"
            >
              {recipe.title}
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to={`/${recipe.author?.nickname}`} className="flex items-center gap-1 hover:text-accent-orange">
                <UserAvatar
                  profilePicture={recipe.author?.profilePicture}
                  name={authorName}
                  size="sm"
                />
                <span>{authorName}</span>
              </Link>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Step {stepIndex + 1} of {totalSteps}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full py-8 px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent-orange text-white rounded-full flex items-center justify-center text-2xl font-bold">
                {stepIndex + 1}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Step {stepIndex + 1}</h1>
                {step.slug && step.slug !== `step${stepIndex + 1}` && (
                  <p className="text-sm text-gray-400">#{step.slug}</p>
                )}
              </div>
            </div>

            {/* Time Info */}
            <div className="flex flex-col gap-1 text-sm text-gray-500">
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
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">grocery</span>
                Ingredients for this step
              </h3>
              <ul className="space-y-1">
                {step.ingredients.map((ing) => (
                  <li key={ing.id} className="text-gray-700">
                    {ing.quantity != null && <span className="font-medium text-amber-700">{ing.quantity} </span>}
                    {ing.unit && <span className="font-medium text-amber-700">{ing.unit} </span>}
                    {ing.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Instruction */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {step.instruction}
            </p>
          </div>

          {/* Step Video */}
          {step.videoUrl && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <a
                href={step.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent-orange hover:underline"
              >
                <span className="material-symbols-outlined">play_circle</span>
                Watch Step Video
              </a>
            </div>
          )}
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="bg-white border-t py-4 px-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => goToStep(stepIndex - 1)}
            disabled={stepIndex === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              stepIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Step Progress */}
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i === stepIndex
                    ? 'bg-accent-orange'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => goToStep(stepIndex + 1)}
            disabled={stepIndex === totalSteps - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              stepIndex === totalSteps - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'bg-accent-orange text-white hover:bg-opacity-90'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default RecipeStepPage;
