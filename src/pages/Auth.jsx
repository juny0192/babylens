import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, resetPassword, updatePassword } = useAuth()
  const { t } = useLanguage()

  // 'login' | 'signup' | 'forgot' | 'reset'
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Detect password reset redirect from email link
  useEffect(() => {
    if (searchParams.get('reset') === 'true') {
      setTab('reset')
    }
  }, [searchParams])

  function switchTab(next) {
    setTab(next)
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
    setPasswordConfirm('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (tab === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else navigate('/')

    } else if (tab === 'signup') {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else {
        setSuccess(t('checkYourEmail'))
        setEmail('')
        setPassword('')
      }

    } else if (tab === 'forgot') {
      const { error } = await resetPassword(email)
      if (error) setError(error.message)
      else setSuccess('Password reset link sent! Check your email inbox.')

    } else if (tab === 'reset') {
      if (password !== passwordConfirm) {
        setError('Passwords do not match.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        setLoading(false)
        return
      }
      const { error } = await updatePassword(password)
      if (error) setError(error.message)
      else {
        setSuccess('Password updated! You can now log in.')
        setTimeout(() => switchTab('login'), 2000)
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

          {/* Tabs — only show for login/signup */}
          {(tab === 'login' || tab === 'signup') && (
            <div className="flex border-b border-gray-100">
              {[['login', t('login')], ['signup', t('signUp')]].map(([key, label]) => (
                <button key={key} onClick={() => switchTab(key)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                    tab === key ? 'text-brand-500 border-b-2 border-brand-500' : 'text-gray-400'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Forgot / Reset header */}
          {(tab === 'forgot' || tab === 'reset') && (
            <div className="px-6 pt-5 pb-0">
              <button onClick={() => switchTab('login')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 mb-3 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back to Login
              </button>
              <h2 className="text-base font-bold text-gray-800 mb-1">
                {tab === 'forgot' ? 'Forgot Password?' : 'Set New Password'}
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                {tab === 'forgot'
                  ? "Enter your email and we'll send you a reset link."
                  : 'Enter a new password for your account.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Email field — shown for login, signup, forgot */}
            {tab !== 'reset' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('email')}</label>
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass} />
              </div>
            )}

            {/* Password field — shown for login, signup, reset */}
            {tab !== 'forgot' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('password')}</label>
                <input type="password" required minLength={6}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className={inputClass} />
                {(tab === 'signup' || tab === 'reset') && (
                  <p className="text-[11px] text-gray-400 mt-1">{t('minSixChars')}</p>
                )}
              </div>
            )}

            {/* Confirm password — only for reset */}
            {tab === 'reset' && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Confirm New Password</label>
                <input type="password" required minLength={6}
                  value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••" className={inputClass} />
              </div>
            )}

            {/* Forgot password link — only on login tab */}
            {tab === 'login' && (
              <div className="text-right -mt-2">
                <button type="button" onClick={() => switchTab('forgot')}
                  className="text-xs text-brand-500 font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

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
              {loading ? 'Please wait...' : (
                tab === 'login' ? t('login') :
                tab === 'signup' ? t('createAccount') :
                tab === 'forgot' ? 'Send Reset Link' :
                'Update Password'
              )}
            </button>

            {/* Forgot email hint */}
            {tab === 'forgot' && (
              <p className="text-[11px] text-gray-400 text-center pt-1">
                Forgot which email you used? Try your most commonly used email addresses.
              </p>
            )}
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
