import { useState, useEffect } from 'react'
import { searchReddit } from '../lib/reddit'
import { searchYouTube } from '../lib/youtube'
import { useLanguage } from '../context/LanguageContext'

function timeAgo(ms) {
  const diff = Date.now() - ms
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(ms).toLocaleDateString()
}

function RedditPost({ post }) {
  const { t } = useLanguage()
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="#FF4500">
          <path d="M10 0C4.478 0 0 4.478 0 10s4.478 10 10 10 10-4.478 10-10S15.522 0 10 0zm4.93 7.37a1.17 1.17 0 011.17 1.17c0 .44-.246.822-.607 1.024.015.15.023.302.023.456 0 2.324-2.706 4.21-6.04 4.21-3.333 0-6.038-1.886-6.038-4.21 0-.154.008-.306.023-.456a1.17 1.17 0 11.563-2.195c.284 0 .543.1.744.264A6.635 6.635 0 018.9 6.37a.418.418 0 01.49-.327l2.35.392c.2.033.35.2.366.403l.006.1a1.17 1.17 0 011.816-.568z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
          {post.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400">r/{post.subreddit}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">↑ {post.score.toLocaleString()}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{post.numComments} {t('comments')}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{timeAgo(post.created)}</span>
        </div>
      </div>
      <svg className="flex-shrink-0 text-gray-300 group-hover:text-brand-400 transition-colors mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  )
}

function YouTubeVideo({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
    >
      <div className="flex-shrink-0 relative">
        <img
          src={video.thumbnail}
          alt=""
          className="w-16 h-12 object-cover rounded-lg bg-gray-100"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
            <svg width="7" height="8" viewBox="0 0 7 8" fill="white">
              <path d="M0 0l7 4-7 4V0z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-brand-500 transition-colors">
          {video.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-gray-400">{video.channel}</span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">
            {new Date(video.published).toLocaleDateString()}
          </span>
        </div>
      </div>
      <svg className="flex-shrink-0 text-gray-300 group-hover:text-brand-400 transition-colors mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
        active
          ? 'border-brand-500 text-brand-500'
          : 'border-transparent text-gray-400'
      }`}
    >
      {children}
    </button>
  )
}

const YOUTUBE_SORTS = [
  { key: 'newest', labelKey: 'newest', order: 'date', publishedAfter: null },
  { key: 'most_viewed', labelKey: 'mostViewed', order: 'viewCount', publishedAfter: null },
  { key: '6months', labelKey: 'mostViewedIn6M', order: 'viewCount', publishedAfter: () => new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() },
]

const REDDIT_SORTS = [
  { key: 'newest', labelKey: 'newest', sort: 'new', timeRange: 'all' },
  { key: 'most_upvoted', labelKey: 'mostUpvoted', sort: 'top', timeRange: 'all' },
  { key: '6months', labelKey: 'mostUpvotedIn6M', sort: 'top', timeRange: '6m' },
]

export default function LiveMentions({ product }) {
  const { t } = useLanguage()
  const [tab, setTab] = useState('reddit')
  const [youtubeSort, setYoutubeSort] = useState('newest')
  const [redditSort, setRedditSort] = useState('newest')
  const [redditPosts, setRedditPosts] = useState([])
  const [youtubePosts, setYoutubePosts] = useState([])
  const [redditLoading, setRedditLoading] = useState(true)
  const [youtubeLoading, setYoutubeLoading] = useState(true)
  const [redditError, setRedditError] = useState(null)
  const [youtubeError, setYoutubeError] = useState(null)

  useEffect(() => {
    setRedditLoading(true)
    setRedditError(null)
    const sort = REDDIT_SORTS.find(s => s.key === redditSort)
    searchReddit(product.name, product.brand, { sort: sort.sort, t: sort.timeRange })
      .then(setRedditPosts)
      .catch((e) => setRedditError(e.message))
      .finally(() => setRedditLoading(false))
  }, [product.id, redditSort])

  useEffect(() => {
    setYoutubeLoading(true)
    setYoutubeError(null)
    const sort = YOUTUBE_SORTS.find(s => s.key === youtubeSort)
    const publishedAfter = typeof sort.publishedAfter === 'function' ? sort.publishedAfter() : sort.publishedAfter
    searchYouTube(product.name, product.brand, { order: sort.order, publishedAfter })
      .then(setYoutubePosts)
      .catch((e) => setYoutubeError(e.message))
      .finally(() => setYoutubeLoading(false))
  }, [product.id, youtubeSort])

  const isLoading = tab === 'reddit' ? redditLoading : youtubeLoading
  const error = tab === 'reddit' ? redditError : youtubeError
  const items = tab === 'reddit' ? redditPosts : youtubePosts

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h2 className="text-sm font-bold text-gray-800">{t('liveMentions')}</h2>
        </div>
        <div className="flex border-b border-gray-100">
          <TabButton active={tab === 'reddit'} onClick={() => setTab('reddit')}>
            {t('reddit')}
            {!redditLoading && !redditError && (
              <span className="ml-1 text-[10px] text-gray-400">({redditPosts.length})</span>
            )}
          </TabButton>
          <TabButton active={tab === 'youtube'} onClick={() => setTab('youtube')}>
            {t('youtube')}
            {!youtubeLoading && !youtubeError && (
              <span className="ml-1 text-[10px] text-gray-400">({youtubePosts.length})</span>
            )}
          </TabButton>
        </div>
        {tab === 'youtube' && (
          <div className="flex gap-1.5 pt-3 pb-1 overflow-x-auto scrollbar-hide">
            {YOUTUBE_SORTS.map(s => (
              <button key={s.key} onClick={() => setYoutubeSort(s.key)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  youtubeSort === s.key
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}>
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        )}
        {tab === 'reddit' && (
          <div className="flex gap-1.5 pt-3 pb-1 overflow-x-auto scrollbar-hide">
            {REDDIT_SORTS.map(s => (
              <button key={s.key} onClick={() => setRedditSort(s.key)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                  redditSort === s.key
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}>
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="py-2">
        {isLoading ? (
          <div className="space-y-1 px-3 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-2 bg-gray-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-gray-400">
              {error.includes('YOUTUBE_API_KEY')
                ? t('addYouTubeKey')
                : `${t('couldNotLoad')} ${error}`}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-sm text-gray-400">{t('noResults')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tab === 'reddit'
              ? items.map((post, i) => <RedditPost key={i} post={post} />)
              : items.map((video, i) => <YouTubeVideo key={i} video={video} />)}
          </div>
        )}
      </div>
    </div>
  )
}
