import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

export default function Newsletter() {
  const { t } = useTranslation('landing')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
    }
  }

  return (
    <section className="bg-accent-green/10 border border-accent-green/20 rounded-[2.5rem] p-16 text-center">
      <h2 className="font-display text-5xl text-white mb-6">
        {t('newsletter.heading', { defaultValue: 'Never miss a <1>delicious</1> beat.' }).split(t('newsletter.delicious')).map((part, i, arr) =>
          i < arr.length - 1 ? (
            <span key={i}>{part}<span className="text-accent-green underline decoration-wavy">{t('newsletter.delicious')}</span></span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </h2>
      <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
        {t('newsletter.description')}
      </p>
      {!submitted ? (
        <form className="max-w-md mx-auto flex gap-3" onSubmit={handleSubmit}>
          <input
            className="flex-1 bg-slate-800 border-slate-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-accent-green focus:border-transparent outline-none transition-all text-white"
            placeholder={t('newsletter.placeholder')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="bg-accent-green text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all"
            type="submit"
          >
            {t('newsletter.subscribe')}
          </button>
        </form>
      ) : (
        <p className="text-accent-green text-lg font-medium">
          {t('newsletter.success')}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-400">{t('newsletter.privacy')}</p>
    </section>
  )
}
