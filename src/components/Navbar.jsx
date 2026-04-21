import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useSaved } from '../context/SavedContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import ReportModal from './ReportModal'

export default function Navbar() {
  const { saved } = useSaved()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [showReport, setShowReport] = useState(false)

  const tabs = [
    { to: '/', label: t('home'), icon: HomeIcon },
    { to: '/discover', label: t('discover'), icon: DiscoverIcon },
    ...(user ? [{ to: '/saved', label: t('saved'), icon: HeartIcon, badge: true }] : []),
    user
      ? { to: '/account', label: t('account'), icon: AccountIcon }
      : { to: '/auth', label: t('login'), icon: LoginIcon },
  ]

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center justify-between px-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          {/* Herdlee logo mark */}
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Dashed outer ring — dark teal dashes */}
            <circle cx="16" cy="16" r="14" stroke="#2D6A6A" strokeWidth="2.2" strokeDasharray="3.6 2.6" strokeLinecap="round" opacity="0.85" />
            {/* Dashed outer ring — light sage dashes offset */}
            <circle cx="16" cy="16" r="14" stroke="#84b5b7" strokeWidth="2.2" strokeDasharray="3.6 2.6" strokeDashoffset="6.2" strokeLinecap="round" opacity="0.6" />
            {/* Inner peach/terracotta circle */}
            <circle cx="16" cy="16" r="10" fill="#C4836A" />
            {/* Highlight spot */}
            <circle cx="13" cy="13" r="2.8" fill="#DFA892" opacity="0.75" />
          </svg>
          <span className="text-2xl text-brand-500 tracking-tight" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}>
            Herd<span className="text-gray-700">lee</span>
          </span>
          <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-medium">{t('beta')}</span>
        </button>
        <div className="flex items-center gap-1">
          {/* Report button */}
          <button onClick={() => setShowReport(true)}
            className="p-2 text-gray-400 hover:text-brand-500 transition-colors"
            aria-label="Report an issue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
          {/* Settings button */}
          <button onClick={() => navigate('/settings')}
            className="p-2 -mr-2 text-gray-400 hover:text-brand-500 transition-colors"
            aria-label={t('settings')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {showReport && <ReportModal onClose={() => setShowReport(false)} />}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 flex">
        {tabs.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-brand-500' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative mb-0.5">
                  <Icon active={isActive} />
                  {badge && saved.size > 0 && (
                    <span className="absolute -top-1 -right-2 bg-brand-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                      {saved.size > 99 ? '99+' : saved.size}
                    </span>
                  )}
                </div>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function DiscoverIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function HeartIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  )
}

function AccountIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LoginIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: active ? 1 : 0.6 }}>
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  )
}
