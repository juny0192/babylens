import { useSaved } from '../context/SavedContext'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import { useNavigate } from 'react-router-dom'

export default function Saved() {
  const { saved } = useSaved()
  const navigate = useNavigate()

  const savedProducts = products
    .filter((p) => saved.has(p.id))
    .sort((a, b) => b.mentions - a.mentions)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">Saved Products</h1>
        {savedProducts.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">{savedProducts.length} item{savedProducts.length !== 1 ? 's' : ''} saved</p>
        )}
      </div>

      <div className="px-4 py-4">
        {savedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ed5e58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No saved products yet</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Tap the heart icon on any product to save it here for easy access.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-brand-500 text-white font-semibold text-sm px-6 py-3 rounded-xl"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
