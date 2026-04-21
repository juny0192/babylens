import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSaved } from '../context/SavedContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase, mapProduct } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

export default function Saved() {
  const { saved } = useSaved()
  const { user } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      setLoading(true)
      if (saved.size === 0) { setProducts([]); setLoading(false); return }
      const { data } = await supabase
        .from('products')
        .select('*')
        .in('id', [...saved])
        .order('mentions', { ascending: false })
      setProducts((data || []).map(mapProduct))
      setLoading(false)
    }
    load()
  }, [user, saved])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9EC4C5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800">{t('loginToSave')}</h2>
        <p className="text-sm text-gray-400 max-w-xs">{t('createAccountToSave')}</p>
        <button onClick={() => navigate('/auth')} className="bg-brand-500 text-white font-semibold text-sm px-6 py-3 rounded-xl">
          {t('logInOrSignUp')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">{t('savedProducts')}</h1>
        {products.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">{products.length} {products.length !== 1 ? t('itemsSaved') : t('itemSaved')}</p>
        )}
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9EC4C5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">{t('noSavedYet')}</h2>
            <p className="text-sm text-gray-400 max-w-xs">{t('tapHeartToSave')}</p>
            <button onClick={() => navigate('/')} className="mt-6 bg-brand-500 text-white font-semibold text-sm px-6 py-3 rounded-xl">
              {t('browseProducts')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
