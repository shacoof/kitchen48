import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface ChefCardProps {
  nickname: string | null
  firstName: string | null
  lastName: string | null
  profilePicture: string | null
  description: string | null
  recipeCount: number
  rotateDirection?: 'left' | 'right'
}

export default function ChefCard({ nickname, firstName, lastName, profilePicture, description, recipeCount, rotateDirection = 'right' }: ChefCardProps) {
  const { t } = useTranslation('landing')
  const rotateClass = rotateDirection === 'right' ? 'group-hover:rotate-12' : 'group-hover:-rotate-12'
  const displayName = [firstName, lastName].filter(Boolean).join(' ') || nickname || 'Chef'
  const profileUrl = nickname ? `/${nickname}` : '#'

  return (
    <Link to={profileUrl} className="text-center group block">
      <div className="relative mb-4 inline-block">
        <div className={`w-32 h-32 rounded-full border-4 border-accent-orange p-1 ${rotateClass} transition-transform duration-300`}>
          {profilePicture ? (
            <img
              alt={displayName}
              className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all"
              src={profilePicture}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all">
              <span className="material-symbols-outlined text-slate-400 text-4xl">person</span>
            </div>
          )}
        </div>
      </div>
      <h4 className="font-bold text-white">{displayName}</h4>
      {description ? (
        <p className="text-xs text-slate-500 uppercase tracking-wider">{description}</p>
      ) : (
        <p className="text-xs text-slate-500 uppercase tracking-wider">{t('meet_our_masters.recipes_count', { count: recipeCount })}</p>
      )}
    </Link>
  )
}
