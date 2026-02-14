import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ChefCard from './ChefCard'
import { usersApi } from '../../modules/users/services/users.api'
import type { FeaturedAuthor } from '../../modules/users/services/users.api'
import { createLogger } from '../../lib/logger'

const logger = createLogger('MeetOurMasters')

export default function MeetOurMasters() {
  const { t } = useTranslation('landing')
  const [authors, setAuthors] = useState<FeaturedAuthor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuthors = async () => {
      const result = await usersApi.getFeaturedAuthors(4)
      if (result.data) {
        setAuthors(result.data)
      } else {
        logger.error('Failed to fetch featured authors')
      }
      setLoading(false)
    }
    fetchAuthors()
  }, [])

  if (loading) {
    return (
      <section className="bg-primary/40 rounded-[2rem] p-12">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-white mb-2">{t('meet_our_masters.title')}</h2>
          <p className="text-slate-400">{t('meet_our_masters.subtitle')}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center animate-pulse">
              <div className="w-32 h-32 rounded-full bg-slate-700 mb-4 mx-auto" />
              <div className="h-4 bg-slate-700 rounded w-24 mx-auto mb-2" />
              <div className="h-3 bg-slate-700 rounded w-16 mx-auto" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (authors.length === 0) {
    return null
  }

  return (
    <section className="bg-primary/40 rounded-[2rem] p-12">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl font-bold text-white mb-2">{t('meet_our_masters.title')}</h2>
        <p className="text-slate-400">{t('meet_our_masters.subtitle')}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-12">
        {authors.map((author, index) => (
          <ChefCard
            key={author.id}
            nickname={author.nickname}
            firstName={author.firstName}
            lastName={author.lastName}
            profilePicture={author.profilePicture}
            description={author.description}
            recipeCount={author._count.recipes}
            rotateDirection={index % 2 === 0 ? 'right' : 'left'}
          />
        ))}
      </div>
    </section>
  )
}
