import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const { t } = useLanguage()

  const [tab, setTab] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (tab === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      } else {
        setSuccess(t('checkYourEmail'))
        setEmail('')
        setPassword('')
      }
    }

    setLoading(false)
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-brand-500">Baby</span>
            <span className="text-gray-800">Lens</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t('tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[['login', t('login')], ['signup', t('signUp')]].map(([key, label]) => (
              <button key={key} onClick={() => { setTab(key); setError(null); setSuccess(null) }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === key ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400'
                }`}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('password')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              {tab === 'signup' && (
                <p className="text-[11px] text-gray-400 mt-1">{t('minSixChars')}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700">
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 text-white font-bold text-sm py-3.5 rounded-xl disabled:opacity-40">
              {loading ? (tab === 'login' ? t('loggingIn') : t('creatingAccount')) : (tab === 'login' ? t('login') : t('createAccount'))}
            </button>
          </form>
        </div>

        <div className="flex justify-center gap-6 mt-5">
          <Link to="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-brand-500 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
            <span className="text-xs font-medium">{t('home')}</span>
          </Link>
          <Link to="/discover" className="flex flex-col items-center gap-1 text-gray-400 hover:text-brand-500 transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="text-xs font-medium">{t('discover')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
