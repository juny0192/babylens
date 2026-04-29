// Server-side Reddit search using OAuth client_credentials
// No user approval needed — just a script app client ID + secret

const BABY_SUBREDDITS = 'beyondthebump+BabyBumps+NewParents+Parenting+daddit+Mommit+baby'

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const clientId = process.env.REDDIT_CLIENT_ID
  const clientSecret = process.env.REDDIT_CLIENT_SECRET

  if (!clientId || !clientSecret) throw new Error('Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET')

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'MumSaid/1.0 by mumsaid_app',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) throw new Error(`Reddit OAuth error: ${res.status}`)

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { q, sort = 'new', t = 'all', limit = '10' } = req.query
  if (!q) return res.status(400).json({ error: 'Missing query parameter q' })

  try {
    const token = await getAccessToken()
    const headers = {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'MumSaid/1.0 by mumsaid_app',
      'Accept': 'application/json',
    }

    // Search within baby subreddits
    const params = new URLSearchParams({ q, restrict_sr: '1', sort, limit, type: 'link' })
    if (sort === 'top') params.set('t', t)

    const url = `https://oauth.reddit.com/r/${BABY_SUBREDDITS}/search?${params.toString()}`
    const response = await fetch(url, { headers })

    let posts = []
    if (response.ok) {
      const json = await response.json()
      posts = (json?.data?.children || []).map(mapPost)
    }

    // Fallback: broader search across all of Reddit
    if (posts.length === 0) {
      const fbParams = new URLSearchParams({ q: `${q} baby`, sort, limit, type: 'link' })
      if (sort === 'top') fbParams.set('t', t)
      const fbRes = await fetch(`https://oauth.reddit.com/search?${fbParams.toString()}`, { headers })
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
    console.error('Reddit search error:', err.message)
    res.status(200).json({ posts: [], error: err.message })
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
