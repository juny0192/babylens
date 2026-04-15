// Uses Reddit's public JSON API — no auth or API key required
// Searches baby-related subreddits for product mentions

const BABY_SUBREDDITS = 'beyondthebump+BabyBumps+NewParents+Parenting+daddit+Mommit+baby'

export async function searchReddit(productName, brand, { limit = 10 } = {}) {
  const query = `${brand} ${productName}`
  const url = `https://www.reddit.com/r/${BABY_SUBREDDITS}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=${limit}&type=link`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Reddit API error: ${res.status}`)
  }

  const json = await res.json()
  const posts = json?.data?.children || []

  if (posts.length === 0) {
    // Fall back to a broader search across all of Reddit
    const fallbackUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}+baby&sort=relevance&limit=${limit}&type=link`
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { Accept: 'application/json' },
    })
    if (fallbackRes.ok) {
      const fallbackJson = await fallbackRes.json()
      return (fallbackJson?.data?.children || []).map(mapPost)
    }
  }

  return posts.map(mapPost)
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
