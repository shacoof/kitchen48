/**
 * RecipeCard
 * Card component for displaying a recipe in the My Recipes grid.
 * Shows thumbnail, title, status badge, stats row, and quick actions menu.
 * Media priority: heroImage > imageUrl > introVideo thumbnail > placeholder.
 * If introVideo exists, shows play overlay; clicking it plays video inline.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RecipeListItem } from '../services/recipes.api';
import { VideoPlayer } from '../../media/components/VideoPlayer';

interface RecipeCardProps {
  recipe: RecipeListItem;
  onEdit: (recipe: RecipeListItem) => void;
  onDuplicate: (recipe: RecipeListItem) => void;
  onDelete: (recipe: RecipeListItem) => void;
  onTogglePublish: (recipe: RecipeListItem) => void;
}

export function RecipeCard({ recipe, onEdit, onDuplicate, onDelete, onTogglePublish }: RecipeCardProps) {
  const { t } = useTranslation('recipes');
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const authorNickname = recipe.author.nickname || '';
  const recipeUrl = `/${authorNickname}/${recipe.slug}`;
  const stepCount = recipe._count.steps;

  const formattedDate = new Date(recipe.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Media priority: heroImage URL > legacy imageUrl > introVideo thumbnail
  const heroImg = recipe.heroImage?.status === 'ready' ? recipe.heroImage : null;
  const introVid = recipe.introVideo?.status === 'ready' ? recipe.introVideo : null;
  const imageSource = heroImg?.url || recipe.imageUrl || introVid?.thumbnailUrl || null;
  const videoSource = introVid?.url || null;
  const hasVideo = !!videoSource;

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(true);
  }, []);

  const handleStopClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(false);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group relative">
      {/* Thumbnail / Video */}
      {playing && videoSource ? (
        <div className="w-full h-44 bg-black relative">
          <VideoPlayer
            src={videoSource}
            poster={imageSource || undefined}
            autoPlay
          />
          <button
            type="button"
            onClick={handleStopClick}
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
        </div>
      ) : (
        <Link to={recipeUrl} className="block">
          <div className="w-full h-44 bg-gray-100 overflow-hidden relative">
            {imageSource ? (
              <img
                src={imageSource}
                alt={recipe.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="material-symbols-outlined text-5xl text-gray-300">restaurant_menu</span>
              </div>
            )}
            {/* Play overlay when video exists */}
            {hasVideo && !playing && (
              <button
                type="button"
                onClick={handlePlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                </div>
              </button>
            )}
          </div>
        </Link>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 left-3">
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            recipe.isPublished
              ? 'bg-accent-green/90 text-white'
              : 'bg-gray-500/80 text-white'
          }`}
        >
          {recipe.isPublished ? t('my_recipes.card.published') : t('my_recipes.card.draft')}
        </span>
      </div>

      {/* Quick Actions Menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <span className="material-symbols-outlined text-gray-600 text-lg">more_vert</span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
            <button
              onClick={() => { onEdit(recipe); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              {t('my_recipes.actions.edit')}
            </button>
            <button
              onClick={() => { onTogglePublish(recipe); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">
                {recipe.isPublished ? 'unpublished' : 'publish'}
              </span>
              {recipe.isPublished ? t('my_recipes.actions.unpublish') : t('my_recipes.actions.publish')}
            </button>
            <button
              onClick={() => { onDuplicate(recipe); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
              {t('my_recipes.actions.duplicate')}
            </button>
            <button
              onClick={() => { onDelete(recipe); setMenuOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100"
            >
              <span className="material-symbols-outlined text-base">delete</span>
              {t('my_recipes.actions.delete')}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Link to={recipeUrl}>
          <h3 className="font-semibold text-gray-800 text-lg leading-snug mb-2 line-clamp-2 hover:text-accent-orange transition-colors">
            {recipe.title}
          </h3>
        </Link>

        {recipe.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{recipe.description}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">format_list_numbered</span>
            {stepCount > 0
              ? `${stepCount} ${stepCount === 1 ? 'step' : 'steps'}`
              : t('my_recipes.card.no_steps')}
          </span>
          <span className="text-gray-300">|</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;
