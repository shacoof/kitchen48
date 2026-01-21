import { useState, type FormEvent } from 'react'

function UnderConstruction() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🍳</span>
          <h1 style={styles.logoText}>Kitchen48</h1>
        </div>

        <h2 style={styles.heading}>Coming Soon</h2>

        <p style={styles.description}>
          We're cooking up something special. A new way to discover, save, and share your favorite recipes.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="email"
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <button type="submit" style={styles.button}>
              Notify Me
            </button>
          </form>
        ) : (
          <p style={styles.thankYou}>
            Thanks! We'll let you know when we launch.
          </p>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf9f7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    margin: 0,
  },
  content: {
    textAlign: 'center',
    maxWidth: '500px',
  },
  logo: {
    marginBottom: '40px',
  },
  logoIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px',
  },
  logoText: {
    fontSize: '36px',
    fontWeight: 700,
    color: '#2d3436',
    margin: 0,
  },
  heading: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#e17055',
    marginBottom: '16px',
  },
  description: {
    fontSize: '18px',
    color: '#636e72',
    lineHeight: 1.6,
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  },
  input: {
    padding: '14px 20px',
    fontSize: '16px',
    border: '2px solid #dfe6e9',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '300px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#e17055',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  thankYou: {
    fontSize: '18px',
    color: '#00b894',
    fontWeight: 500,
  },
}

export default UnderConstruction
