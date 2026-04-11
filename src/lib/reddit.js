const BABY_SUBREDDITS = [
  'beyondthebump',
  'NewParents',
  'Parenting',
  'BabyBumps',
  'predaddit',
  'daddit',
].join('+')

export async function searchReddit(productName, brand, limit = 6) {
  const query = `${brand} ${productName}`
  const url = `https://www.reddit.com/r/${BABY_SUBREDDITS}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=relevance&limit=${limit}&raw_json=1`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`)

  const json = await res.json()
  return json.data.children.map((c) => ({
    title: c.data.title,
    subreddit: c.data.subreddit,
    score: c.data.score,
    numComments: c.data.num_comments,
    url: `https://reddit.com${c.data.permalink}`,
    created: c.data.created_utc * 1000,
  }))
}
