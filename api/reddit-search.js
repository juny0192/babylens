// Server-side Reddit search — avoids CORS issues with direct browser requests

const BABY_SUBREDDITS = 'beyondthebump+BabyBumps+NewParents+Parenting+daddit+Mommit+baby'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q, sort = 'new', t = 'all', limit = '10' } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })

  try {
    const params = new URLSearchParams({
      q,
      restrict_sr: '1',
      sort,
      limit,
      type: 'link',
    })
    if (sort === 'top') params.set('t', t)

    const url = `https://www.reddit.com/r/${BABY_SUBREDDITS}/search.json?${params.toString()}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BabyLens/1.0 (product review aggregator)',
        'Accept': 'application/json',
      }
    })

    if (!response.ok) throw new Error(`Reddit API error: ${response.status}`)

    const json = await response.json()
    let posts = (json?.data?.children || []).map(mapPost)

    // Fallback: broader search if no results
    if (posts.length === 0) {
      const fbParams = new URLSearchParams({ q: `${q} baby`, sort, limit, type: 'link' })
      if (sort === 'top') fbParams.set('t', t)
      const fbRes = await fetch(`https://www.reddit.com/search.json?${fbParams.toString()}`, {
        headers: { 'User-Agent': 'BabyLens/1.0', 'Accept': 'application/json' }
      })
      if (fbRes.ok) {
        const fbJson = await fbRes.json()
        posts = (fbJson?.data?.children || []).map(mapPost)
      }
    }

    // Client-side 6-month filter
    if (sort === 'top' && t === '6m') {
      const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000
      posts = posts.filter(p => p.created >= cutoff)
    }

    res.status(200).json({ posts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

function mapPost({ data }) {
  return {
    title: data.title,
    url: `https://www.reddit.com${data.permalink}`,
    subreddit: data.subreddit,
    score: data.score,
    numComments: data.num_comments,
    created: data.created_utc * 1000,
  }
}
