import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TrendingCard from './TrendingCard'
import { recipesApi } from '../../modules/recipes/services/recipes.api'
import type { RecipeListItem } from '../../modules/recipes/services/recipes.api'
import { createLogger } from '../../lib/logger'

const logger = createLogger('WhatsHot')

export default function WhatsHot() {
  const { t } = useTranslation('landing')
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrending = async () => {
      const result = await recipesApi.getRecipes({ isPublished: true, limit: 2 })
      if (result.success && result.recipes) {
        setRecipes(result.recipes)
      } else {
        logger.error('Failed to fetch trending recipes')
      }
      setLoading(false)
    }
    fetchTrending()
  }, [])

  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-4 mb-8">
          <span className="material-symbols-outlined text-accent-orange">trending_up</span>
          <h2 className="font-display text-3xl font-bold text-white">{t('whats_hot.title')}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-[400px] rounded-3xl bg-slate-700 animate-pulse" />
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
      <div className="flex items-center gap-4 mb-8">
        <span className="material-symbols-outlined text-accent-orange">trending_up</span>
        <h2 className="font-display text-3xl font-bold text-white">{t('whats_hot.title')}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {recipes.map((recipe) => {
          const tags: string[] = ['TRENDING']
          if (recipe.dietaryTags && recipe.dietaryTags.length > 0) {
            tags.push(recipe.dietaryTags[0].tag.toUpperCase())
          }
          return (
            <TrendingCard
              key={recipe.id}
              imageUrl={recipe.imageUrl}
              title={recipe.title}
              tags={tags}
              stepCount={recipe._count.steps}
              authorNickname={recipe.author.nickname}
              slug={recipe.slug}
            />
          )
        })}
      </div>
    </section>
  )
}
