import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface RecipeCardProps {
  imageUrl: string | null
  title: string
  description: string | null
  prepTime: number | null
  cookTime: number | null
  tag: string | null
  authorNickname: string | null
  slug: string
}

function formatTime(prepTime: number | null, cookTime: number | null): string {
  const total = (prepTime || 0) + (cookTime || 0)
  if (total === 0) return ''
  if (total >= 60) {
    const hours = Math.floor(total / 60)
    const mins = total % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${total}m`
}

export default function RecipeCard({ imageUrl, title, description, prepTime, cookTime, tag, authorNickname, slug }: RecipeCardProps) {
  const { t } = useTranslation('landing')

  const time = formatTime(prepTime, cookTime)
  const recipeUrl = authorNickname ? `/${authorNickname}/${slug}` : '#'

  return (
    <Link to={recipeUrl} className="group cursor-pointer flex-shrink-0 w-72 block">
      <div className="relative rounded-2xl overflow-hidden mb-4 aspect-[4/5] bg-slate-800">
        {imageUrl ? (
          <img
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={imageUrl}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-600 text-6xl">restaurant</span>
          </div>
        )}
        {tag && (
          <span className="absolute top-4 left-4 bg-accent-green text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
            {t(`recipe_tags.${tag.toLowerCase()}`, tag)}
          </span>
        )}
        {time && (
          <div className="absolute bottom-4 right-4 bg-primary/90 backdrop-blur-md p-2 rounded-lg text-white text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span> {time}
          </div>
        )}
      </div>
      <h3 className="font-bold text-xl text-white group-hover:text-accent-orange transition-colors">
        {title}
      </h3>
      {description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{description}</p>}
    </Link>
  )
}
