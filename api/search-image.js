export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const q = req.query.q
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })

  const googleKey = process.env.VITE_YOUTUBE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID

  if (!googleKey || !cseId) {
    return res.status(500).json({ error: 'Missing VITE_YOUTUBE_API_KEY or GOOGLE_CSE_ID' })
  }

  try {
    // Use regular web search (not searchType=image, which Google deprecated for CSE)
    // and extract images from pagemap data
    const url = `https://www.googleapis.com/customsearch/v1?key=${googleKey}&cx=${cseId}&q=${encodeURIComponent(q)}&num=5`
    const r = await fetch(url)
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      return res.status(r.status).json({ error: err?.error?.message || `Google API error ${r.status}` })
    }
    const data = await r.json()

    // Try to find the best image from search results
    let imageUrl = null
    for (const item of data.items || []) {
      const candidate =
        item.pagemap?.cse_image?.[0]?.src ||
        item.pagemap?.cse_thumbnail?.[0]?.src ||
        item.pagemap?.metatags?.[0]?.['og:image']
      if (candidate && candidate.startsWith('http')) {
        imageUrl = candidate
        break
      }
    }
    res.status(200).json({ imageUrl })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
