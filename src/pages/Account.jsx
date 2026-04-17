import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaved } from '../context/SavedContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase, mapProduct } from '../lib/supabase'

export default function Account() {
  const navigate = useNavigate()
  const { user, signOut, updatePassword, deleteAccount } = useAuth()
  const { saved } = useSaved()
  const { t, tCategory } = useLanguage()

  const [savedProducts, setSavedProducts] = useState([])
  const [savedLoading, setSavedLoading] = useState(true)

  const [showPwModal, setShowPwModal] = useState(false)
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwStatus, setPwStatus] = useState(null) // 'success' | string error

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      setSavedLoading(true)
      if (saved.size === 0) { setSavedProducts([]); setSavedLoading(false); return }
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', [...saved])
        .order('mentions', { ascending: false })
      setSavedProducts((data || []).map(mapProduct))
      setSavedLoading(false)
    }
    load()
  }, [user, saved])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-gray-500 text-sm">{t('loginToSave')}</p>
        <button onClick={() => navigate('/auth')} className="bg-brand-500 text-white font-semibold text-sm px-6 py-3 rounded-xl">
          {t('login')}
        </button>
      </div>
    )
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwNew !== pwConfirm) { setPwStatus(t('passwordsDoNotMatch')); return }
    if (pwNew.length < 6) { setPwStatus(t('passwordMinLength')); return }
    setPwLoading(true)
    setPwStatus(null)
    const { error } = await updatePassword(pwNew)
    if (error) {
      setPwStatus(error.message)
    } else {
      setPwStatus('success')
      setPwNew('')
      setPwConfirm('')
      setTimeout(() => { setShowPwModal(false); setPwStatus(null) }, 1500)
    }
    setPwLoading(false)
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'DELETE') return
    setDeleteLoading(true)
    // Delete saved products for this user first, then sign out
    await supabase.from('saved_products').delete().eq('device_id', user.id)
    await signOut()
    navigate('/')
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white'
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
        <span className="text-sm font-bold text-gray-800">{t('myAccount')}</span>
        <button onClick={async () => { await signOut(); navigate('/') }}
          className="text-sm font-medium text-gray-400 hover:text-red-500 transition-colors">
          {t('logOut')}
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Profile */}
        <div className={cardClass}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-brand-500">
                {user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{user.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('memberSince')} {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={() => { setShowPwModal(true); setPwNew(''); setPwConfirm(''); setPwStatus(null) }}
                className="text-xs font-semibold text-brand-500 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                {t('changePassword')}
              </button>
              <button onClick={() => { setShowDeleteModal(true); setDeleteConfirm('') }}
                className="text-xs font-semibold text-red-400 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                {t('deleteAccount')}
              </button>
            </div>
          </div>
        </div>

        {/* Saved Products */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-4">
            {t('savedProducts')}
            <span className="ml-2 text-gray-400 font-normal">({saved.size})</span>
          </h2>
          {savedLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : savedProducts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-400">{t('noSavedYet')}</p>
              <button onClick={() => navigate('/')} className="text-xs text-brand-500 font-semibold mt-2">{t('browseProductsLink')}</button>
            </div>
          ) : (
            <div className="space-y-2">
              {savedProducts.map(p => (
                <button key={p.id} onClick={() => navigate(`/product/${p.id}`)}
                  className="w-full flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 text-left">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.brand} · {tCategory(p.category)}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-700">${p.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Change Password modal */}
        {showPwModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
            onClick={e => { if (e.target === e.currentTarget) setShowPwModal(false) }}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-4">{t('changePassword')}</h3>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('newPassword')}</label>
                  <input type="password" className={inputClass} placeholder="••••••••" minLength={6}
                    value={pwNew} onChange={e => setPwNew(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{t('confirmNewPassword')}</label>
                  <input type="password" className={inputClass} placeholder="••••••••" minLength={6}
                    value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} required />
                </div>
                {pwStatus && (
                  <div className={`rounded-xl px-4 py-3 text-xs ${
                    pwStatus === 'success'
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                      : 'bg-red-50 border border-red-100 text-red-600'
                  }`}>
                    {pwStatus === 'success' ? t('passwordUpdated') : pwStatus}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowPwModal(false)}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3 rounded-xl">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={pwLoading}
                    className="flex-1 bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40">
                    {pwLoading ? t('updating') : t('update')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* Delete confirmation modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
            onClick={e => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}>
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h3 className="text-base font-bold text-gray-900 mb-1">{t('deleteAccount')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('deleteAccountConfirm')} <span className="font-bold text-red-500">DELETE</span> {t('toConfirm')}</p>
              <input type="text" className={`${inputClass} border-red-200 mb-4`} placeholder={t('typeDeleteToConfirm')}
                value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} autoFocus />
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3 rounded-xl">
                  {t('cancel')}
                </button>
                <button onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                  className="flex-1 bg-red-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40">
                  {deleteLoading ? t('deleting') : t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
