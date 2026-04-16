import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

const APP_VERSION = '0.1.0'

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [emailNotif, setEmailNotif] = useState(false)
  const [notifStatus, setNotifStatus] = useState(null) // 'saved' | null
  const [notifLoading, setNotifLoading] = useState(false)

  // Load notification preference from Supabase when logged in
  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('user_settings')
        .select('email_notifications')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) setEmailNotif(!!data.email_notifications)
    }
    load()
  }, [user])

  async function toggleNotif() {
    if (!user) return
    const next = !emailNotif
    setEmailNotif(next)
    setNotifLoading(true)
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, email_notifications: next }, { onConflict: 'user_id' })
    setNotifLoading(false)
    setNotifStatus('saved')
    setTimeout(() => setNotifStatus(null), 1500)
  }

  const cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {t('back')}
        </button>
        <span className="text-sm font-bold text-gray-800">{t('settings')}</span>
        <span className="w-10" />
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Notifications */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-3">{t('notifications')}</h2>
          {!user ? (
            <div className="text-center py-3">
              <p className="text-sm text-gray-400 mb-3">{t('loginToEnableNotifications')}</p>
              <button onClick={() => navigate('/auth')}
                className="bg-brand-500 text-white font-semibold text-xs px-4 py-2 rounded-lg">
                {t('login')}
              </button>
            </div>
          ) : (
            <div
              onClick={toggleNotif}
              className="flex items-center justify-between gap-3 cursor-pointer py-1">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{t('emailNotifications')}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t('emailNotificationsDesc')}</p>
                {notifStatus === 'saved' && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-semibold">✓ {t('notificationsSaved')}</p>
                )}
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${emailNotif ? 'bg-brand-500' : 'bg-gray-200'} ${notifLoading ? 'opacity-50' : ''}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailNotif ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          )}
        </div>

        {/* About */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-2">{t('about')}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{t('aboutText')}</p>
        </div>

        {/* Version */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">{t('version')}</h2>
            <span className="text-sm text-gray-500 font-mono">v{APP_VERSION}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-2">{t('disclaimer')}</h2>
          <p className="text-xs text-gray-500 leading-relaxed">{t('disclaimerText')}</p>
        </div>
      </div>
    </div>
  )
}
