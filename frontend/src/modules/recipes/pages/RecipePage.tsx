/**
 * RecipePage — Recipe Summary Screen
 * Full overview of a recipe: hero section, metadata bar, tags,
 * two-column ingredients + steps, action bar, and status indicator.
 * Accessible via /:nickname/:recipeSlug
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';
import { recipesApi, Recipe, AggregatedIngredient } from '../services/recipes.api';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { formatQuantity } from '../../../utils/measurement';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('RecipePage');

/** Normalize all step times to minutes for aggregation */
function toMinutes(value: number | null, unit: string | null): number {
  if (!value || !unit) return 0;
  switch (unit) {
    case 'SECONDS': return value / 60;
    case 'MINUTES': return value;
    case 'HOURS': return value * 60;
    case 'DAYS': return value * 1440;
    default: return value;
  }
}

/** Format a total-minutes value to a human-friendly string */
function formatTotalTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '—';
  if (totalMinutes < 1) return '<1 min';
  if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function RecipePage() {
  const { nickname, recipeSlug } = useParams<{ nickname: string; recipeSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('recipes');

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<AggregatedIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [servingCount, setServingCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Is current user the recipe author?
  const isAuthor = user && recipe && user.id === recipe.authorId;

  // Serving multiplier relative to original
  const servingMultiplier = useMemo(() => {
    if (!recipe?.servings || servingCount === 0) return 1;
    return servingCount / recipe.servings;
  }, [recipe?.servings, servingCount]);

  // Calculate total prep time and total time from steps
  const { totalPrepMinutes, totalTimeMinutes } = useMemo(() => {
    if (!recipe) return { totalPrepMinutes: 0, totalTimeMinutes: 0 };
    let prep = 0;
    let total = 0;
    for (const step of recipe.steps) {
      const stepPrep = toMinutes(step.prepTime, step.prepTimeUnit);
      const stepWait = toMinutes(step.waitTime, step.waitTimeUnit);
      prep += stepPrep;
      total += stepPrep + stepWait;
    }
    return { totalPrepMinutes: prep, totalTimeMinutes: total };
  }, [recipe]);

  useEffect(() => {
    if (!nickname || !recipeSlug) {
      setError('Invalid recipe URL');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeBySemanticUrl(nickname, recipeSlug);

      if (result.error) {
        logger.warning(`Failed to load recipe ${nickname}/${recipeSlug}: ${result.error}`);
        setError(result.error === 'Recipe not found' ? 'Recipe not found' : 'Failed to load recipe');
        setLoading(false);
        return;
      }

      if (result.recipe) {
        setRecipe(result.recipe);
        setServingCount(result.recipe.servings || 0);

        // Fetch aggregated ingredients
        const ingResult = await recipesApi.getIngredientSummary(result.recipe.id);
        if (ingResult.ingredients) {
          setIngredients(ingResult.ingredients);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [nickname, recipeSlug]);

  const handlePublish = async () => {
    if (!recipe) return;
    const result = await recipesApi.togglePublish(recipe.id);
    if (result.recipe) {
      setRecipe(result.recipe);
    }
  };

  const handleSave = async () => {
    if (!recipe || !user) return;
    if (isSaved) {
      await recipesApi.unsaveRecipe(recipe.id);
      setIsSaved(false);
    } else {
      await recipesApi.saveRecipe(recipe.id);
      setIsSaved(true);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">{t('summary.loading')}</div>
      </div>
    );
  }

  // Error state
  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🍳</div>
        <h1 className="text-2xl font-bold text-gray-800">
          {error === 'Recipe not found' ? t('summary.not_found') : t('summary.error')}
        </h1>
        <p className="text-gray-600">
          {error === 'Recipe not found'
            ? t('summary.not_found_message')
            : t('summary.error_message')}
        </p>
        <Link
          to="/"
          className="mt-4 px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90"
        >
          {t('summary.go_home')}
        </Link>
      </div>
    );
  }

  const authorName = [recipe.author?.firstName, recipe.author?.lastName]
    .filter(Boolean)
    .join(' ') || 'Kitchen48 Chef';

  return (
    <div className="min-h-screen bg-background-light pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
          {user && (
            <Link to="/recipes" className="text-white/80 hover:text-white flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              My Recipes
            </Link>
          )}
        </div>
      </header>

      {/* Draft Banner (author only) */}
      {isAuthor && !recipe.isPublished && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <span className="material-symbols-outlined text-lg">visibility_off</span>
              <span className="text-sm font-medium">{t('summary.draft_banner')}</span>
            </div>
            <button
              onClick={handlePublish}
              className="px-4 py-1.5 bg-accent-green text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              {t('summary.publish_button')}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative">
        {recipe.imageUrl ? (
          <div className="relative w-full h-64 md:h-[420px] overflow-hidden">
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            {/* Hero overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="max-w-5xl mx-auto">
                {isAuthor && recipe.isPublished && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-green/90 text-white text-xs font-medium rounded-full mb-3">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {t('summary.published_badge')}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                  {recipe.title}
                </h1>
                <Link
                  to={`/${recipe.author?.nickname}`}
                  className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <UserAvatar
                    profilePicture={recipe.author?.profilePicture}
                    name={authorName}
                    size="sm"
                  />
                  <span className="text-white/90 text-sm">
                    {t('summary.by')} {authorName}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-primary/10 py-10 px-6">
            <div className="max-w-5xl mx-auto">
              {isAuthor && recipe.isPublished && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-green text-white text-xs font-medium rounded-full mb-3">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {t('summary.published_badge')}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-3">
                {recipe.title}
              </h1>
              <Link
                to={`/${recipe.author?.nickname}`}
                className="inline-flex items-center gap-2 hover:opacity-80"
              >
                <UserAvatar
                  profilePicture={recipe.author?.profilePicture}
                  name={authorName}
                  size="sm"
                />
                <span className="text-gray-600 text-sm">
                  {t('summary.by')} {authorName}
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-5xl mx-auto px-6">
        {/* Description + Video */}
        {(recipe.description || recipe.videoUrl) && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            {recipe.description && (
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {recipe.description}
              </p>
            )}
            {recipe.videoUrl && (
              <a
                href={recipe.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-accent-orange hover:underline font-medium"
              >
                <span className="material-symbols-outlined">play_circle</span>
                {t('summary.watch_intro_video')}
              </a>
            )}
          </div>
        )}

        {/* Metadata Bar */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Prep Time */}
            <div className="flex flex-col items-center text-center p-3">
              <span className="material-symbols-outlined text-2xl text-accent-orange mb-1">schedule</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('summary.prep_time')}</span>
              <span className="text-lg font-bold text-gray-800 mt-0.5">
                {formatTotalTime(totalPrepMinutes)}
              </span>
            </div>

            {/* Total Time */}
            <div className="flex flex-col items-center text-center p-3">
              <span className="material-symbols-outlined text-2xl text-accent-orange mb-1">hourglass_top</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('summary.total_time')}</span>
              <span className="text-lg font-bold text-gray-800 mt-0.5">
                {formatTotalTime(totalTimeMinutes)}
              </span>
            </div>

            {/* Servings with +/- adjuster */}
            <div className="flex flex-col items-center text-center p-3">
              <span className="material-symbols-outlined text-2xl text-accent-orange mb-1">group</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('summary.servings')}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={() => setServingCount(Math.max(1, servingCount - 1))}
                  disabled={servingCount <= 1}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease servings"
                >
                  <span className="material-symbols-outlined text-base">remove</span>
                </button>
                <span className="text-lg font-bold text-gray-800 w-8 text-center">
                  {servingCount || '—'}
                </span>
                <button
                  onClick={() => setServingCount(servingCount + 1)}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Increase servings"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                </button>
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col items-center text-center p-3">
              <span className="material-symbols-outlined text-2xl text-accent-orange mb-1">speed</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('summary.difficulty')}</span>
              <span className="text-lg font-bold text-gray-800 mt-0.5">
                {recipe.difficulty || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tags Row */}
        {(recipe.cuisine || recipe.mealType || (recipe.dietaryTags && recipe.dietaryTags.length > 0)) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {recipe.cuisine && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                <span className="material-symbols-outlined text-base">restaurant</span>
                {recipe.cuisine}
              </span>
            )}
            {recipe.mealType && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200">
                <span className="material-symbols-outlined text-base">brunch_dining</span>
                {recipe.mealType}
              </span>
            )}
            {recipe.dietaryTags?.map((dt) => (
              <span
                key={dt.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200"
              >
                <span className="material-symbols-outlined text-base">eco</span>
                {dt.tag}
              </span>
            ))}
          </div>
        )}

        {/* Two-Column: Ingredients + Steps Overview */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column: Aggregated Ingredients */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-orange">grocery</span>
                {t('summary.ingredients')}
              </h2>

              {ingredients.length === 0 ? (
                <p className="text-gray-400 italic text-sm">{t('summary.no_ingredients')}</p>
              ) : (
                <ul className="space-y-3">
                  {ingredients.map((ing, idx) => (
                    <li key={idx} className="flex items-baseline gap-2 text-gray-700">
                      <span className="w-1.5 h-1.5 bg-accent-orange rounded-full flex-shrink-0 mt-2" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {formatQuantity(ing.totalQuantity, ing.unit, servingMultiplier)}
                        </span>
                        {' '}
                        <span>{ing.name}</span>
                        {ing.stepReferences.length > 1 && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({t('summary.used_in_steps', {
                              steps: ing.stepReferences.map((s) => s.stepOrder + 1).join(', '),
                            })})
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right column: Cooking Steps Overview */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-accent-orange">menu_book</span>
              {t('summary.cooking_steps')}
            </h2>

            {recipe.steps.length === 0 ? (
              <p className="text-gray-400 italic text-sm">{t('summary.no_steps')}</p>
            ) : (
              <div className="space-y-3">
                {recipe.steps.map((step, index) => {
                  const stepPrepMin = toMinutes(step.prepTime, step.prepTimeUnit);
                  const stepWaitMin = toMinutes(step.waitTime, step.waitTimeUnit);
                  const stepTitle = step.title || step.instruction.slice(0, 60) + (step.instruction.length > 60 ? '...' : '');

                  return (
                    <Link
                      key={step.id}
                      to={`/${nickname}/${recipeSlug}/${step.slug || `step${index + 1}`}`}
                      className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md hover:border-accent-orange/30 border border-transparent transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-accent-orange text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-medium group-hover:text-accent-orange transition-colors">
                            {stepTitle}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1.5">
                            {stepPrepMin > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-xs">timer</span>
                                {t('summary.prep_label')} {formatTotalTime(stepPrepMin)}
                              </span>
                            )}
                            {stepWaitMin > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-amber-50 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-xs">hourglass_empty</span>
                                {t('summary.wait_label')} {formatTotalTime(stepWaitMin)}
                              </span>
                            )}
                            {step.ingredients.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-green-50 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-xs">grocery</span>
                                {step.ingredients.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-accent-orange transition-colors">
                          chevron_right
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Action Bar */}
        <div className="hidden md:flex mt-8 bg-white rounded-xl shadow-sm p-4 items-center justify-between">
          <button
            onClick={() => navigate(`/${nickname}/${recipeSlug}/step1`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent-green text-white font-semibold rounded-lg hover:bg-green-600 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            {t('summary.start_cooking')}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <span className="material-symbols-outlined text-lg">print</span>
              {t('summary.print_recipe')}
            </button>

            {user && (
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isSaved
                    ? 'bg-accent-orange/10 text-accent-orange'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isSaved ? 'bookmark' : 'bookmark_border'}
                </span>
                {isSaved ? t('summary.saved') : t('summary.save_for_later')}
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm relative"
            >
              <span className="material-symbols-outlined text-lg">share</span>
              {linkCopied ? t('summary.link_copied') : t('summary.share')}
            </button>

            {isAuthor && (
              <Link
                to={`/recipes/${recipe.id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
                {t('summary.edit_recipe')}
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(`/${nickname}/${recipeSlug}/step1`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-green text-white font-semibold rounded-lg text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            {t('summary.start_cooking')}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              aria-label={t('summary.print_recipe')}
            >
              <span className="material-symbols-outlined">print</span>
            </button>
            {user && (
              <button
                onClick={handleSave}
                className={`p-2 rounded-lg ${isSaved ? 'text-accent-orange' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label={t('summary.save_for_later')}
              >
                <span className="material-symbols-outlined">
                  {isSaved ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
            )}
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
              aria-label={t('summary.share')}
            >
              <span className="material-symbols-outlined">share</span>
            </button>
            {isAuthor && (
              <Link
                to={`/recipes/${recipe.id}/edit`}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                aria-label={t('summary.edit_recipe')}
              >
                <span className="material-symbols-outlined">edit</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Footer (hidden in print) */}
      <footer className="bg-gray-100 py-8 mt-12 print:hidden">
        <div className="max-w-5xl mx-auto px-6 text-center text-gray-500">
          <Link to="/" className="hover:text-accent-orange">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default RecipePage;
