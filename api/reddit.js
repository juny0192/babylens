const SUBREDDITS = [
  'beyondthebump',
  'NewParents',
  'Parenting',
  'BabyBumps',
  'predaddit',
  'daddit',
].join('+')

export default async function handler(req, res) {
  const { q, limit = 6 } = req.query

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter q' })
  }

  const url = `https://www.reddit.com/r/${SUBREDDITS}/search.json?q=${encodeURIComponent(q)}&restrict_sr=on&sort=relevance&limit=${limit}&raw_json=1`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'BabyLens/1.0 (baby product review aggregator)',
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    return res.status(response.status).json({ error: `Reddit error: ${response.status}` })
  }

  const data = await response.json()

  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
  res.status(200).json(data)
}
