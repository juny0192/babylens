import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '../hooks/useProduct'
import { useSaved } from '../context/SavedContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import SourceBreakdown from '../components/SourceBreakdown'
import LiveMentions from '../components/LiveMentions'

const tierColors = {
  Budget: 'bg-emerald-100 text-emerald-700',
  Mid: 'bg-blue-100 text-blue-700',
  Premium: 'bg-purple-100 text-purple-700',
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isSaved, toggleSaved } = useSaved()
  const { t, tCategory, tTier } = useLanguage()
  const { product, loading, error } = useProduct(Number(id))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">{t('loadingProduct')}</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-gray-500">{error || t('productNotFound')}</p>
        <button onClick={() => navigate('/')} className="text-brand-500 font-medium text-sm">
          {t('backToHome')}
        </button>
      </div>
    )
  }

  const saved = isSaved(product.id)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {t('back')}
        </button>
        {user ? (
          <button
            onClick={() => toggleSaved(product.id)}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: saved ? '#ed5e58' : '#9ca3af' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {saved ? t('savedLabel') : t('save')}
          </button>
        ) : (
          <button onClick={() => navigate('/auth')}
            className="text-sm font-medium text-gray-400">
            {t('loginToSaveShort')}
          </button>
        )}
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Product header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          {product.imageUrl && (
            <div className="flex justify-center mb-4">
              <img src={product.imageUrl} alt={product.name}
                className="w-40 h-40 object-contain rounded-xl bg-gray-50" />
            </div>
          )}
          <p className="text-xs text-gray-400 font-medium mb-1">{product.brand}</p>
          <h1 className="text-xl font-bold text-gray-900 mb-3">{product.name}</h1>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {tCategory(product.category)}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tierColors[product.priceTier]}`}>
              {tTier(product.priceTier)}
            </span>
            {product.ageRange.map((a) => (
              <span key={a} className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                {a}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">${product.price.toLocaleString()}</span>
            <div className="text-right">
              <p className="text-lg font-bold text-brand-500">{product.mentions.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{t('communityMentions')}</p>
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">💬</span>
            <h2 className="text-sm font-bold text-brand-600 uppercase tracking-wide">{t('communityVerdict')}</h2>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{product.verdict}</p>
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3 flex items-center gap-1">
              <span>👍</span> {t('pros')}
            </h2>
            <ul className="space-y-2">
              {product.pros.map((pro, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-2">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-1">
              <span>👎</span> {t('cons')}
            </h2>
            <ul className="space-y-2">
              {product.cons.map((con, i) => (
                <li key={i} className="text-xs text-gray-600 flex gap-2">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">✗</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Best For */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('bestFor')}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{product.bestFor}</p>
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">{t('mentionsBySource')}</h2>
          <SourceBreakdown sources={product.sources} />
        </div>

        {/* Recall History */}
        <div className={`rounded-2xl border p-5 ${product.recall ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{product.recall ? '⚠️' : '✅'}</span>
            <h2 className="text-sm font-bold text-gray-800">{t('recallHistory')}</h2>
          </div>
          {product.recall && product.recallDetails ? (
            <div className="space-y-3">
              <div className="bg-red-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-700 bg-red-200 px-2 py-0.5 rounded-full">{t('activeRecall')}</span>
                  <span className="text-xs text-red-500">{product.recallDetails.date}</span>
                </div>
                <p className="text-xs text-red-700 font-medium mt-2">{t('reason')}</p>
                <p className="text-sm text-red-800 mt-1">{product.recallDetails.reason}</p>
                <p className="text-xs text-red-700 font-medium mt-3">{t('requiredAction')}</p>
                <p className="text-sm text-red-800 mt-1">{product.recallDetails.action}</p>
              </div>
              <p className="text-xs text-red-500">
                {t('recallSource')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('noRecalls')}</p>
          )}
        </div>

        {/* Live Mentions */}
        <LiveMentions product={product} />
      </div>
    </div>
  )
}
