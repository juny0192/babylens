export async function searchYouTube(productName, brand, { limit = 10, order = 'date', publishedAfter = null } = {}) {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) throw new Error('Missing VITE_YOUTUBE_API_KEY')

  const query = `${brand} ${productName} review`
  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${limit}&relevanceLanguage=en&order=${order}&key=${apiKey}`
  if (publishedAfter) url += `&publishedAfter=${publishedAfter}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`)
  }

  const json = await res.json()
  return json.items.map((item) => ({
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.default.url,
    videoId: item.id.videoId,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    published: item.snippet.publishedAt,
  }))
}
