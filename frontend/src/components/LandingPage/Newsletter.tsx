import { useState, type FormEvent } from 'react'

export default function Newsletter() {
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
        Never miss a <span className="text-accent-green underline decoration-wavy">delicious</span> beat.
      </h2>
      <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
        Join 50,000+ food lovers and get weekly recipes, chef tips, and exclusive kitchen hacks delivered to your inbox.
      </p>
      {!submitted ? (
        <form className="max-w-md mx-auto flex gap-3" onSubmit={handleSubmit}>
          <input
            className="flex-1 bg-slate-800 border-slate-700 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-accent-green focus:border-transparent outline-none transition-all text-white"
            placeholder="Enter your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="bg-accent-green text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all"
            type="submit"
          >
            Subscribe
          </button>
        </form>
      ) : (
        <p className="text-accent-green text-lg font-medium">
          Thanks for subscribing! We'll be in touch soon.
        </p>
      )}
      <p className="mt-4 text-xs text-slate-400">We respect your privacy. Unsubscribe at any time.</p>
    </section>
  )
}
