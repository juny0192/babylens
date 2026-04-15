// Uses Reddit's public JSON API — no auth or API key required
// Searches baby-related subreddits for product mentions

const BABY_SUBREDDITS = 'beyondthebump+BabyBumps+NewParents+Parenting+daddit+Mommit+baby'

export async function searchReddit(productName, brand, { limit = 10, sort = 'new', t = 'all' } = {}) {
  const query = `${brand} ${productName}`
  const params = new URLSearchParams({
    q: query,
    restrict_sr: '1',
    sort,
    limit: String(limit),
    type: 'link',
  })
  if (sort === 'top') params.set('t', t)

  const url = `https://www.reddit.com/r/${BABY_SUBREDDITS}/search.json?${params.toString()}`

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`)

  const json = await res.json()
  let posts = (json?.data?.children || []).map(mapPost)

  // If no results, try broader search across all of Reddit
  if (posts.length === 0) {
    const fbParams = new URLSearchParams({
      q: `${query} baby`,
      sort,
      limit: String(limit),
      type: 'link',
    })
    if (sort === 'top') fbParams.set('t', t)
    const fbUrl = `https://www.reddit.com/search.json?${fbParams.toString()}`
    const fbRes = await fetch(fbUrl, { headers: { Accept: 'application/json' } })
    if (fbRes.ok) {
      const fbJson = await fbRes.json()
      posts = (fbJson?.data?.children || []).map(mapPost)
    }
  }

  // Client-side filter for "last 6 months" since Reddit only supports year/month time ranges
  if (sort === 'top' && t === '6m') {
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000
    posts = posts.filter(p => p.created >= cutoff)
  }

  return posts
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
