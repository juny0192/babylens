import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  'Wrong product information',
  'Missing product',
  'Image issue',
  'Account problem',
  'App bug or error',
  'Other',
]

export default function ReportModal({ onClose }) {
  const { user } = useAuth()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          userEmail: user?.email || null,
          page: window.location.pathname,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send report')
      setSuccess(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚩</span>
            <h3 className="text-base font-bold text-gray-900">Report an Issue</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center">
            <span className="text-4xl block mb-3">✅</span>
            <p className="text-sm font-semibold text-gray-800">Report sent!</p>
            <p className="text-xs text-gray-400 mt-1">Thank you for helping improve Herdlee.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Category
              </label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
              />
            </div>

            {/* From */}
            <p className="text-[11px] text-gray-400">
              {user ? `Sending as ${user.email}` : 'Sending anonymously'}
            </p>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold text-sm py-3 rounded-xl">
                Cancel
              </button>
              <button type="submit" disabled={loading || !description.trim()}
                className="flex-1 bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40">
                {loading ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
