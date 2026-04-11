export async function searchReddit(productName, brand, limit = 6) {
  const query = `${brand} ${productName}`
  const url = `/api/reddit?q=${encodeURIComponent(query)}&limit=${limit}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Reddit proxy error: ${res.status}`)

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
