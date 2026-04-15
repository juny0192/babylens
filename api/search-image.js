export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const q = req.query.q
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })

  const serpApiKey = process.env.SERPAPI_KEY
  if (!serpApiKey) {
    return res.status(500).json({ error: 'Missing SERPAPI_KEY' })
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(q)}&num=3&api_key=${serpApiKey}`
    const r = await fetch(url)
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      return res.status(r.status).json({ error: err?.error || `SerpAPI error ${r.status}` })
    }
    const data = await r.json()
    const imageUrl = data.images_results?.[0]?.thumbnail || data.images_results?.[0]?.original || null
    res.status(200).json({ imageUrl })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
