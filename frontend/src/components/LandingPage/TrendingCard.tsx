import { useTranslation } from 'react-i18next'

interface TrendingCardProps {
  image: string
  title: string
  tags: string[]
  likes: string
  comments: string
}

export default function TrendingCard({ image, title, tags, likes, comments }: TrendingCardProps) {
  const { t } = useTranslation('landing')

  const tagKeyMap: Record<string, string> = {
    'TRENDING': 'trending',
    'SPICY': 'spicy',
    'PREMIUM': 'premium',
  }

  return (
    <div className="relative group h-[400px] rounded-3xl overflow-hidden shadow-2xl">
      <img
        alt={title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        src={image}
      />
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
              {t(`recipe_tags.${tagKeyMap[tag] || tag.toLowerCase()}`)}
            </span>
          ))}
        </div>
        <h3 className="text-3xl font-display text-white mb-2">{title}</h3>
        <div className="flex items-center justify-between text-white/80 text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">favorite</span> {likes}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">mode_comment</span> {comments}
            </span>
          </div>
          <button className="bg-white text-primary px-4 py-2 rounded-lg font-bold text-sm hover:bg-accent-orange hover:text-white transition-colors">
            {t('buttons.get_recipe')}
          </button>
        </div>
      </div>
    </div>
  )
}
