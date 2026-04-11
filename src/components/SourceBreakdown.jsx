const SOURCE_COLORS = {
  Reddit: '#FF4500',
  YouTube: '#FF0000',
  Amazon: '#FF9900',
  BabyGearLab: '#2563EB',
  'The Bump': '#EC4899',
  "Lucie's List": '#8B5CF6',
  'Consumer Reports': '#059669',
}

export default function SourceBreakdown({ sources }) {
  const entries = Object.entries(sources)
  const total = entries.reduce((sum, [, v]) => sum + v, 0)
  const sorted = [...entries].sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-3">
      {sorted.map(([source, count]) => {
        const pct = Math.round((count / total) * 100)
        const color = SOURCE_COLORS[source] || '#6B7280'
        return (
          <div key={source}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 font-medium">{source}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{count.toLocaleString()}</span>
                <span className="text-xs font-semibold text-gray-600 w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
      <p className="text-xs text-gray-400 pt-1">{total.toLocaleString()} total mentions across all sources</p>
    </div>
  )
}
