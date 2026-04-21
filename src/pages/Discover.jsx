import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data/products'
import { supabase, mapProduct } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import ProductCard from '../components/ProductCard'

// Clean minimal SVG icons per category
const CATEGORY_SVG = {
  Strollers: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h2l3.5 9H17a2 2 0 002-2V6H9" />
      <circle cx="8.5" cy="18.5" r="1.5" />
      <circle cx="16.5" cy="18.5" r="1.5" />
      <path d="M19 8l2-2" />
    </svg>
  ),
  'Car Seats': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h2" />
      <path d="M19 17h2a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <circle cx="8.5" cy="19" r="1" />
      <circle cx="15.5" cy="19" r="1" />
    </svg>
  ),
  Carriers: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <path d="M7 14s0-5 5-5 5 5 5 5" />
      <path d="M9 21v-7M15 21v-7" />
      <path d="M6 14h12" />
    </svg>
  ),
  Feeding: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4a4 4 0 008 0V2" />
      <path d="M12 10v12" />
      <path d="M10 18h4" />
    </svg>
  ),
  Monitors: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M8 20h8M12 18v2" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  ),
  'Nursery & Sleep': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13V7a2 2 0 012-2h14a2 2 0 012 2v6" />
      <path d="M2 13h20v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3z" />
      <path d="M7 5V3M17 5V3" />
    </svg>
  ),
  'Gear & Travel': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  'Toys & Play': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9h.01M15 9h.01" />
      <path d="M9 14s1 2 3 2 3-2 3-2" />
    </svg>
  ),
  'Bath & Potty': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h16a1 1 0 011 1v2a4 4 0 01-4 4H7a4 4 0 01-4-4v-2a1 1 0 011-1z" />
      <path d="M6 12V6a2 2 0 012-2h1" />
      <circle cx="9" cy="4" r="1" />
    </svg>
  ),
  'Health & Safety': (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.5 5.5H20l-4.5 4 1.5 6L12 14l-5 3.5 1.5-6L4 7.5h5.5L12 2z" />
    </svg>
  ),
}

// Subtle two-tone palette using the app's new mint/peach theme
const CATEGORY_STYLE = {
  Strollers:        { bg: 'bg-brand-100',  icon: 'text-brand-600' },
  'Car Seats':      { bg: 'bg-blush-100',  icon: 'text-rose-500' },
  Carriers:         { bg: 'bg-brand-100',  icon: 'text-brand-600' },
  Feeding:          { bg: 'bg-peach-100',  icon: 'text-orange-400' },
  Monitors:         { bg: 'bg-brand-100',  icon: 'text-brand-600' },
  'Nursery & Sleep':{ bg: 'bg-blush-100',  icon: 'text-rose-400' },
  'Gear & Travel':  { bg: 'bg-peach-100',  icon: 'text-orange-400' },
  'Toys & Play':    { bg: 'bg-brand-100',  icon: 'text-brand-600' },
  'Bath & Potty':   { bg: 'bg-peach-100',  icon: 'text-orange-400' },
  'Health & Safety':{ bg: 'bg-blush-100',  icon: 'text-rose-500' },
}

export default function Discover() {
  const navigate = useNavigate()
  const { t, tCategory, tCategoryDesc } = useLanguage()
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('mentions', { ascending: false })
        .limit(4)
      setTrending((data || []).map(mapProduct))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">{t('discover')}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{t('browseByCategoryOrTrending')}</p>
      </div>

      <div className="px-4 py-5 space-y-7">
        {/* Category grid */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-3">{t('browseByCategory')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const style = CATEGORY_STYLE[cat] || { bg: 'bg-brand-100', icon: 'text-brand-600' }
              return (
                <button
                  key={cat}
                  onClick={() => navigate(`/?category=${encodeURIComponent(cat)}`)}
                  className={`${style.bg} rounded-2xl p-4 text-left active:scale-95 transition-transform`}
                >
                  <span className={`${style.icon} block mb-2.5`}>{CATEGORY_SVG[cat]}</span>
                  <p className="text-sm font-bold text-gray-800">{tCategory(cat)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tCategoryDesc(cat)}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-800">{t('trendingNow')}</h2>
            <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-semibold">{t('top4')}</span>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {trending.map((product, i) => (
                <ProductCard key={product.id} product={product} rank={i + 1} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
