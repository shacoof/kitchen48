import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import RecipeCard from './RecipeCard'
import { recipesApi } from '../../modules/recipes/services/recipes.api'
import type { RecipeListItem } from '../../modules/recipes/services/recipes.api'
import { createLogger } from '../../lib/logger'

const logger = createLogger('YourRecipes')

export default function YourRecipes() {
  const { t } = useTranslation('landing')
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecipes = async () => {
      const result = await recipesApi.getRecipes({ isPublished: true, limit: 5 })
      if (result.success && result.recipes) {
        setRecipes(result.recipes)
      } else {
        logger.error('Failed to fetch recipes for landing page')
      }
      setLoading(false)
    }
    fetchRecipes()
  }, [])

  if (loading) {
    return (
      <section>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">{t('your_recipes.title')}</h2>
            <p className="text-slate-400 mt-2">{t('your_recipes.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-8 pb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-72 animate-pulse">
              <div className="rounded-2xl bg-slate-700 aspect-[4/5] mb-4" />
              <div className="h-5 bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (recipes.length === 0) {
    return null
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-white">{t('your_recipes.title')}</h2>
          <p className="text-slate-400 mt-2">{t('your_recipes.subtitle')}</p>
        </div>
        <Link className="text-accent-orange font-semibold flex items-center gap-1 hover:underline" to="/explore">
          {t('your_recipes.view_all')} <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
      <div className="flex overflow-x-auto gap-8 pb-6 custom-scrollbar scroll-smooth">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            imageUrl={recipe.imageUrl}
            title={recipe.title}
            description={recipe.description}
            prepTime={recipe.prepTime}
            cookTime={recipe.cookTime}
            tag={recipe.dietaryTags?.[0]?.tag || recipe.slug.split('-')[0] || null}
            authorNickname={recipe.author.nickname}
            slug={recipe.slug}
          />
        ))}
      </div>
    </section>
  )
}
