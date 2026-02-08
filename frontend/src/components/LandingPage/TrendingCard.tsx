import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

interface TrendingCardProps {
  imageUrl: string | null
  title: string
  tags: string[]
  stepCount: number
  authorNickname: string | null
  slug: string
}

export default function TrendingCard({ imageUrl, title, tags, stepCount, authorNickname, slug }: TrendingCardProps) {
  const { t } = useTranslation('landing')

  const recipeUrl = authorNickname ? `/${authorNickname}/${slug}` : '#'

  return (
    <Link to={recipeUrl} className="relative group h-[400px] rounded-3xl overflow-hidden shadow-2xl block">
      {imageUrl ? (
        <img
          alt={title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          src={imageUrl}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <span className="material-symbols-outlined text-slate-600 text-8xl">restaurant</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-8 w-full">
        <div className="flex gap-2 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`text-white text-[10px] font-bold px-2 py-1 rounded ${
                index === 0 ? 'bg-accent-orange' : 'bg-white/20 backdrop-blur-sm'
              }`}
            >
              {t(`recipe_tags.${tag.toLowerCase()}`, tag)}
            </span>
          ))}
        </div>
        <h3 className="text-3xl font-display text-white mb-2">{title}</h3>
        <div className="flex items-center justify-between text-white/80 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">format_list_numbered</span> {t('whats_hot.steps', { count: stepCount })}
            </span>
          </div>
          <span className="bg-white text-primary px-4 py-2 rounded-lg font-bold text-sm group-hover:bg-accent-orange group-hover:text-white transition-colors">
            {t('buttons.get_recipe')}
          </span>
        </div>
      </div>
    </Link>
  )
}
