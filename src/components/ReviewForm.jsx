import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getDeviceId } from '../lib/deviceId'

export default function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0 || body.trim().length < 5) return

    setSubmitting(true)
    setError(null)

    const { error: err } = await supabase.from('reviews').upsert(
      {
        product_id: productId,
        device_id: getDeviceId(),
        rating,
        body: body.trim(),
      },
      { onConflict: 'product_id,device_id' }
    )

    setSubmitting(false)

    if (err) {
      setError('Failed to submit review. Please try again.')
      return
    }

    setSubmitted(true)
    onSubmitted?.()
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-semibold text-emerald-700">Review submitted!</p>
          <p className="text-xs text-emerald-500 mt-0.5">Thanks for sharing your experience.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-bold text-gray-800 mb-4">Write a Review</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                className="text-2xl leading-none transition-transform active:scale-90"
              >
                <span style={{ color: star <= (hovered || rating) ? '#f59e0b' : '#e5e7eb' }}>★</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text */}
        <div>
          <p className="text-xs text-gray-500 mb-2">Your experience</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What did you love or hate about this product?"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
          <p className="text-right text-xs text-gray-300 mt-1">{body.length} chars</p>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={rating === 0 || body.trim().length < 5 || submitting}
          className="w-full bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
