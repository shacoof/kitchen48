/**
 * MyRecipesPage
 * Displays all recipes authored by the logged-in user.
 * Card grid layout (3/2/1 columns responsive), search, sort, filter.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';
import { recipesApi, RecipeListItem } from '../services/recipes.api';
import { RecipeCard } from '../components/RecipeCard';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('MyRecipesPage');

type SortOption = 'recent' | 'alphabetical' | 'oldest';
type FilterOption = 'all' | 'published' | 'drafts';

export function MyRecipesPage() {
  const { t } = useTranslation('recipes');
  const { t: tc } = useTranslation('common');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');
  const [filter, setFilter] = useState<FilterOption>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch recipes
  useEffect(() => {
    if (!user?.nickname) return;

    const fetchRecipes = async () => {
      setLoading(true);
      const result = await recipesApi.getMyRecipes(user.nickname!);

      if (result.success && result.recipes) {
        setRecipes(result.recipes);
      } else {
        logger.error(`Failed to load recipes: ${result.error}`);
      }

      setLoading(false);
    };

    fetchRecipes();
  }, [user?.nickname]);

  // Filter + search + sort
  const displayRecipes = useMemo(() => {
    let filtered = [...recipes];

    // Filter
    if (filter === 'published') {
      filtered = filtered.filter((r) => r.isPublished);
    } else if (filter === 'drafts') {
      filtered = filtered.filter((r) => !r.isPublished);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sort === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'alphabetical') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    return filtered;
  }, [recipes, search, sort, filter]);

  const handleEdit = (recipe: RecipeListItem) => {
    navigate(`/recipes/${recipe.id}/edit`);
  };

  const handleDuplicate = async (recipe: RecipeListItem) => {
    const result = await recipesApi.duplicateRecipe(recipe.id);
    if (result.success && result.recipe) {
      // Refresh the list
      if (user?.nickname) {
        const refreshed = await recipesApi.getMyRecipes(user.nickname);
        if (refreshed.success && refreshed.recipes) {
          setRecipes(refreshed.recipes);
        }
      }
    } else {
      logger.error(`Failed to duplicate recipe: ${result.error}`);
    }
  };

  const handleDelete = async (recipe: RecipeListItem) => {
    const confirmed = window.confirm(t('my_recipes.confirm_delete', { title: recipe.title }));
    if (!confirmed) return;

    const result = await recipesApi.deleteRecipe(recipe.id);
    if (result.success) {
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    } else {
      logger.error(`Failed to delete recipe: ${result.error}`);
    }
  };

  const handleTogglePublish = async (recipe: RecipeListItem) => {
    const result = await recipesApi.togglePublish(recipe.id);
    if (result.success) {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id ? { ...r, isPublished: !r.isPublished } : r
        )
      );
    } else {
      logger.error(`Failed to toggle publish: ${result.error}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-light">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
          <div className="text-gray-500">{t('my_recipes.loading')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {t('my_recipes.title')}
          </h1>
          {/* Desktop: New Recipe button */}
          <Link
            to="/recipes/new"
            className="hidden sm:inline-flex items-center gap-2 bg-accent-orange hover:bg-[#E64A19] text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t('my_recipes.new_recipe')}
          </Link>
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
                placeholder={t('my_recipes.search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent text-sm"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent-orange focus:border-transparent"
            >
              <option value="recent">{t('my_recipes.sort.recent')}</option>
              <option value="alphabetical">{t('my_recipes.sort.alphabetical')}</option>
              <option value="oldest">{t('my_recipes.sort.oldest')}</option>
            </select>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'published', 'drafts'] as FilterOption[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === f
                      ? 'bg-accent-orange text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t(`my_recipes.filter.${f}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {recipes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-5xl text-gray-300">menu_book</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('my_recipes.empty_title')}
            </h2>
            <p className="text-gray-500 mb-8 max-w-md">
              {t('my_recipes.empty_subtitle')}
            </p>
            <Link
              to="/recipes/new"
              className="inline-flex items-center gap-2 bg-accent-orange hover:bg-[#E64A19] text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md text-lg"
            >
              <span className="material-symbols-outlined">add</span>
              {t('my_recipes.create_first')}
            </Link>
          </div>
        ) : displayRecipes.length === 0 ? (
          /* No search results */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">search_off</span>
            <p className="text-gray-500">
              {tc('messages.error')} — {search ? `No recipes match "${search}"` : 'No recipes in this filter'}
            </p>
          </div>
        ) : (
          /* Recipe Card Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <Link
        to="/recipes/new"
        className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-accent-orange text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#E64A19] transition-colors z-40"
        aria-label={t('my_recipes.new_recipe')}
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>
    </div>
  );
}

/**
 * Simple page header (reused from landing pattern)
 */
function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t: tc } = useTranslation('common');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = () => setMenuOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-slate-700/50 shadow-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img alt="Kitchen48 Logo" className="h-10 w-auto object-contain" src="/kitchen48-logo-tight.jpg" />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-white/90 hover:text-white transition-colors font-medium text-sm">
            {tc('navigation.explore')}
          </Link>
          <Link to="/recipes" className="text-white hover:text-white transition-colors font-medium text-sm border-b-2 border-accent-orange pb-0.5">
            {tc('navigation.recipes')}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
              >
                <span className="text-sm font-medium">{displayName}</span>
                <span className="material-symbols-outlined text-lg">
                  {menuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  <Link
                    to="/profile/edit"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">person</span>
                    {tc('navigation.my_profile')}
                  </Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    {tc('buttons.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-accent-orange hover:bg-[#E64A19] text-white px-4 py-2 rounded-full font-semibold text-sm transition-colors"
            >
              {tc('buttons.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default MyRecipesPage;
