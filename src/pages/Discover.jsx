import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CATEGORIES, CATEGORY_ICONS } from '../data/products'
import { supabase, mapProduct } from '../lib/supabase'
import ProductCard from '../components/ProductCard'

const categoryDescriptions = {
  Strollers: 'Full-size, lightweight & travel',
  'Car Seats': 'Infant, convertible & booster',
  Carriers: 'Soft-structured & wraps',
  Feeding: 'Bottles, pumps & nursing',
  Monitors: 'Video, audio & wearable',
  'Nursery & Sleep': 'Cribs, bedding & swaddles',
  'Gear & Travel': 'Bags, bouncers & on-the-go',
  'Toys & Play': 'Infant, toddler & learning',
  'Bath & Potty': 'Tubs, care & potty training',
  'Health & Safety': 'Thermometers, gates & more',
}

const categoryGradients = {
  Strollers: 'from-orange-400 to-amber-300',
  'Car Seats': 'from-red-400 to-rose-300',
  Carriers: 'from-teal-400 to-emerald-300',
  Feeding: 'from-pink-400 to-fuchsia-300',
  Monitors: 'from-sky-400 to-blue-300',
  'Nursery & Sleep': 'from-indigo-400 to-violet-300',
  'Gear & Travel': 'from-amber-400 to-yellow-300',
  'Toys & Play': 'from-yellow-400 to-lime-300',
  'Bath & Potty': 'from-cyan-400 to-teal-300',
  'Health & Safety': 'from-green-400 to-emerald-300',
}

export default function Discover() {
  const navigate = useNavigate()
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
        <h1 className="text-lg font-bold text-gray-900">Discover</h1>
        <p className="text-xs text-gray-400 mt-0.5">Browse by category or see what's trending</p>
      </div>

      <div className="px-4 py-5 space-y-7">
        {/* Category grid */}
        <section>
          <h2 className="text-sm font-bold text-gray-800 mb-3">Browse by Category</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => navigate(`/?category=${encodeURIComponent(cat)}`)}
                className={`bg-gradient-to-br ${categoryGradients[cat]} rounded-2xl p-4 text-left text-white active:scale-95 transition-transform`}
              >
                <span className="text-3xl block mb-2">{CATEGORY_ICONS[cat]}</span>
                <p className="text-sm font-bold">{cat}</p>
                <p className="text-xs opacity-80 mt-0.5">{categoryDescriptions[cat]}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-gray-800">Trending Now</h2>
            <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-semibold">🔥 Top 4</span>
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
