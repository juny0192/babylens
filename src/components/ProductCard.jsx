import { useNavigate } from 'react-router-dom'
import { useSaved } from '../context/SavedContext'

const tierColors = {
  Budget: 'bg-emerald-100 text-emerald-700',
  Mid: 'bg-blue-100 text-blue-700',
  Premium: 'bg-purple-100 text-purple-700',
}

const categoryColors = {
  Strollers: 'bg-orange-100 text-orange-700',
  Monitors: 'bg-sky-100 text-sky-700',
  'Car Seats': 'bg-red-100 text-red-700',
  Carriers: 'bg-teal-100 text-teal-700',
  Feeding: 'bg-pink-100 text-pink-700',
}

export default function ProductCard({ product, rank }) {
  const navigate = useNavigate()
  const { isSaved, toggleSaved } = useSaved()
  const saved = isSaved(product.id)

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Rank */}
      {rank !== undefined && (
        <div className="flex-shrink-0 w-7 flex items-start pt-0.5">
          <span className={`text-sm font-bold ${rank <= 3 ? 'text-brand-500' : 'text-gray-300'}`}>
            #{rank}
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-gray-400 font-medium truncate">{product.brand}</p>
            <h3 className="text-sm font-semibold text-gray-900 leading-snug">{product.name}</h3>
          </div>

          {/* Save button */}
          <button
            className="flex-shrink-0 p-1.5 -mr-1 -mt-1 rounded-full hover:bg-gray-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              toggleSaved(product.id)
            }}
            aria-label={saved ? 'Remove from saved' : 'Save product'}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={saved ? '#ed5e58' : 'none'}
              stroke={saved ? '#ed5e58' : '#9ca3af'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[product.category] || 'bg-gray-100 text-gray-600'}`}>
            {product.category}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tierColors[product.priceTier]}`}>
            {product.priceTier}
          </span>
          {product.recall && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-1">
              ⚠️ Recall
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-gray-900">${product.price.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 3a3 3 0 00-3 3v12a3 3 0 003 3 3 3 0 003-3 3 3 0 00-3-3H6a3 3 0 00-3 3 3 3 0 003 3 3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3 3 3 0 003 3h12a3 3 0 003-3 3 3 0 00-3-3z" />
            </svg>
            <span className="text-xs font-medium">{product.mentions.toLocaleString()} mentions</span>
          </div>
        </div>
      </div>
    </div>
  )
}
