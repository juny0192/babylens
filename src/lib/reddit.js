// Calls our serverless function which proxies Reddit's API (avoids CORS)

export async function searchReddit(productName, brand, { limit = 10, sort = 'new', t = 'all' } = {}) {
  const q = `${brand} ${productName}`
  const params = new URLSearchParams({ q, sort, t, limit: String(limit) })

  const res = await fetch(`/api/reddit-search?${params.toString()}`)
  if (!res.ok) throw new Error(`Reddit search error: ${res.status}`)

  const data = await res.json()
  if (data.error) throw new Error(data.error)

  return data.posts || []
}
