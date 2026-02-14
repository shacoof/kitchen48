/**
 * ExplorePage
 * Browse all published recipes, sorted by most recent first.
 * Accessible without authentication via /explore.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { recipesApi, RecipeListItem } from '../services/recipes.api';
import { createLogger } from '../../../lib/logger';
import Header from '../../../components/LandingPage/Header';

const logger = createLogger('ExplorePage');

type SortOption = 'recent' | 'alphabetical' | 'oldest';

export function ExplorePage() {
  const { t } = useTranslation('recipes');
  const { t: tc } = useTranslation('common');

  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');

  // Fetch published recipes
  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      const result = await recipesApi.getRecipes({ isPublished: true, limit: 100 });

      if (result.success && result.recipes) {
        setRecipes(result.recipes);
      } else {
        logger.error(`Failed to load recipes: ${result.error}`);
      }

      setLoading(false);
    };

    fetchRecipes();
  }, []);

  // Search + sort
  const displayRecipes = useMemo(() => {
    let filtered = [...recipes];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return filtered;
  }, [recipes, search, sort]);

  return (
    <div className="min-h-screen bg-background-light">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {t('explore.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{t('explore.subtitle')}</p>
          </div>
        </div>

        {/* Controls Row */}
        {recipes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <span className="material-symbols-outlined text-lg">search</span>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('explore.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent text-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent-orange focus:border-transparent"
            >
              <option value="recent">{t('explore.sort.recent')}</option>
              <option value="alphabetical">{t('explore.sort.alphabetical')}</option>
              <option value="oldest">{t('explore.sort.oldest')}</option>
            </select>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">{tc('messages.loading')}</div>
          </div>
        ) : recipes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-gray-300">restaurant_menu</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('explore.empty_title')}
            </h2>
            <p className="text-gray-500 max-w-md">
              {t('explore.empty_subtitle')}
            </p>
          </div>
        ) : displayRecipes.length === 0 ? (
          /* No search results */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">search_off</span>
            <p className="text-gray-500">{t('explore.no_results')}</p>
          </div>
        ) : (
          /* Recipe Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecipes.map((recipe) => {
              const authorNickname = recipe.author.nickname || '';
              const recipeUrl = `/${authorNickname}/${recipe.slug}`;
              const stepCount = recipe._count.steps;
              const formattedDate = new Date(recipe.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <Link
                  key={recipe.id}
                  to={recipeUrl}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Thumbnail with media priority: heroImage > imageUrl > introVideo thumbnail */}
                  <div className="w-full h-44 bg-gray-100 overflow-hidden relative">
                    {(() => {
                      const heroImg = recipe.heroImage?.status === 'ready' ? recipe.heroImage : null;
                      const introVid = recipe.introVideo?.status === 'ready' ? recipe.introVideo : null;
                      const imgSrc = heroImg?.url || recipe.imageUrl || introVid?.thumbnailUrl || null;
                      const hasVid = !!(introVid?.url);

                      return (
                        <>
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={recipe.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <span className="material-symbols-outlined text-5xl text-gray-300">restaurant_menu</span>
                            </div>
                          )}
                          {hasVid && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                  play_arrow
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 text-lg leading-snug mb-2 line-clamp-2 group-hover:text-accent-orange transition-colors">
                      {recipe.title}
                    </h3>

                    {recipe.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
                    )}

                    {/* Meta Row */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {recipe.author.firstName || authorNickname}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">format_list_numbered</span>
                        {stepCount > 0 ? `${stepCount} ${stepCount === 1 ? 'step' : 'steps'}` : t('my_recipes.card.no_steps')}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ExplorePage;
