import { useState } from 'react'
import { CATEGORIES, SOURCES, AGE_RANGES, PRICE_TIERS } from '../data/products'
import { useLanguage } from '../context/LanguageContext'

function Chip({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
        active
          ? 'bg-brand-500 border-brand-500 text-white'
          : 'bg-white border-gray-200 text-gray-600 hover:border-brand-400'
      }`}
    >
      {label}
    </button>
  )
}

export default function FilterPanel({ filters, onChange }) {
  const [open, setOpen] = useState(false)
  const { t, tCategory, tTier } = useLanguage()

  function toggle(key, value) {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    onChange({ ...filters, [key]: next })
  }

  const activeCount =
    filters.categories.length +
    filters.ages.length +
    filters.tiers.length +
    (filters.recallOnly ? 1 : 0) +
    (filters.maxPrice < 1200 ? 1 : 0)

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Filter toggle row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {t('filters')}
          {activeCount > 0 && (
            <span className="bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            onClick={() =>
              onChange({
                sources: [],
                categories: [],
                ages: [],
                tiers: [],
                maxPrice: 1200,
                recallOnly: false,
              })
            }
            className="text-xs text-brand-500 font-medium"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-50">
            {/* Categories */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('category')}</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c} label={tCategory(c)} active={filters.categories.includes(c)} onClick={() => toggle('categories', c)} />
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('ageRange')}</p>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((a) => (
                <Chip key={a} label={a} active={filters.ages.includes(a)} onClick={() => toggle('ages', a)} />
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('maxPrice')}</p>
              <span className="text-xs font-bold text-gray-700">
                {filters.maxPrice >= 1200 ? t('any') : `$${filters.maxPrice}`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1200}
              step={50}
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex gap-2 mt-2">
              {PRICE_TIERS.map((tier) => (
                <Chip key={tier} label={tTier(tier)} active={filters.tiers.includes(tier)} onClick={() => toggle('tiers', tier)} />
              ))}
            </div>
          </div>

          {/* Recall toggle */}
          <div
            onClick={() => onChange({ ...filters, recallOnly: !filters.recallOnly })}
            className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5 cursor-pointer select-none"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">{t('hideRecalledProducts')}</p>
              <p className="text-xs text-gray-400">{t('onlyShowNoRecall')}</p>
            </div>
            <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
              filters.recallOnly ? 'bg-brand-500' : 'bg-gray-200'
            }`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                filters.recallOnly ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
