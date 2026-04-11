import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function Stars({ rating }) {
  return (
    <span className="text-sm leading-none">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? '#f59e0b' : '#e5e7eb' }}>★</span>
      ))}
    </span>
  )
}

export default function ReviewList({ productId, refreshKey }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      setReviews(data || [])
      setLoading(false)
    }
    load()
  }, [productId, refreshKey])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-800">Community Reviews</h2>
        {reviews.length > 0 && (
          <span className="text-xs text-gray-400">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-1.5">
                <Stars rating={review.rating} />
                <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{review.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
