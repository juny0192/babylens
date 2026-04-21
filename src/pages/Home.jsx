import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { useLanguage } from '../context/LanguageContext'
import ProductCard from '../components/ProductCard'
import FilterPanel from '../components/FilterPanel'

const DEFAULT_FILTERS = {
  categories: [],
  ages: [],
  tiers: [],
  maxPrice: 1200,
  recallOnly: false,
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-7 h-4 bg-gray-100 rounded mt-1" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-12 bg-gray-100 rounded-full" />
          </div>
          <div className="flex justify-between mt-2">
            <div className="h-4 w-14 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get('category')

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState(() =>
    initialCategory ? { ...DEFAULT_FILTERS, categories: [initialCategory] } : DEFAULT_FILTERS
  )

  const { products, totalCount, loading, error } = useProducts(filters, query)

  // Global rank based on position in full sorted fetch
  const globalRank = useMemo(() => {
    return Object.fromEntries(products.map((p, i) => [p.id, i + 1]))
  }, [products])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <FilterPanel filters={filters} onChange={setFilters} />

      {/* Results */}
      <div className="px-4 py-4">
        {!loading && (
          <>
          <p className="text-[11px] text-gray-400 mb-3 leading-snug border border-brand-400 rounded-lg px-3 py-1.5 inline-block">
            Rankings are based on total community mentions, not product quality.
          </p>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">
              {products.length === totalCount
                ? t('allProducts', { n: products.length })
                : t('nOfTotal', { n: products.length, total: totalCount })}
              {' · '}{t('rankedByMentions')}
            </p>
          </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-600">
            {t('failedToLoad')}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-gray-500 font-medium">{t('noProductsMatch')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('tryAdjusting')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} rank={globalRank[product.id]} />
            ))}
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  )
}
