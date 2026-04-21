import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { CATEGORIES, AGE_RANGES, PRICE_TIERS } from '../data/products'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234'
const SOURCES = ['Reddit', 'YouTube', 'BabyGearLab', 'The Bump', "Lucie's List", 'Consumer Reports']
const BULK_CATEGORIES = ['All', 'Strollers', 'Car Seats', 'Carriers', 'Feeding', 'Monitors', 'Nursery & Sleep', 'Gear & Travel', 'Toys & Play', 'Bath & Potty', 'Health & Safety']
const BULK_TIERS = ['All', 'Budget', 'Mid', 'Premium']

const EMPTY_FORM = {
  name: '',
  brand: '',
  image_url: '',
  category: '',
  price: '',
  price_tier: '',
  age_range: [],
  mentions: '0',
  sources: { Reddit: '', YouTube: '', BabyGearLab: '', 'The Bump': '', "Lucie's List": '', 'Consumer Reports': '' },
  verdict: '',
  pros: ['', '', ''],
  cons: ['', ''],
  best_for: '',
  recall: false,
  recall_details: null,
}

const tierColors = { Budget: 'bg-emerald-100 text-emerald-700 border-emerald-200', Mid: 'bg-blue-100 text-blue-700 border-blue-200', Premium: 'bg-purple-100 text-purple-700 border-purple-200' }
const categoryColors = { Strollers: 'bg-orange-100 text-orange-700', 'Car Seats': 'bg-red-100 text-red-700', Carriers: 'bg-teal-100 text-teal-700', Feeding: 'bg-pink-100 text-pink-700', Monitors: 'bg-sky-100 text-sky-700', 'Nursery & Sleep': 'bg-indigo-100 text-indigo-700', 'Gear & Travel': 'bg-amber-100 text-amber-700', 'Toys & Play': 'bg-yellow-100 text-yellow-700', 'Bath & Potty': 'bg-cyan-100 text-cyan-700', 'Health & Safety': 'bg-green-100 text-green-700' }

const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white'
const labelClass = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block'
const cardClass = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-5'

export default function Admin() {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success' | 'error'

  const [products, setProducts] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [findingImages, setFindingImages] = useState(false)
  const [imageProgress, setImageProgress] = useState('')

  // --- Users state ---
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState(null)

  // --- Service Usage state ---
  const [usageRows, setUsageRows] = useState([])
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageError, setUsageError] = useState(null)

  // --- Bulk Generate state ---
  const [activeTab, setActiveTab] = useState('single') // 'single' | 'bulk' | 'users' | 'usage'
  const [bulkCategory, setBulkCategory] = useState('All')
  const [bulkTier, setBulkTier] = useState('All')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkError, setBulkError] = useState(null)
  const [bulkResults, setBulkResults] = useState([])
  const [bulkSelected, setBulkSelected] = useState(new Set())
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkImportStatus, setBulkImportStatus] = useState(null) // { success: n, fail: n }

  // --- PIN ---
  function handlePinChange(val) {
    setPin(val)
    if (val.length === 4) {
      if (val === ADMIN_PIN) {
        setUnlocked(true)
      } else {
        setShake(true)
        setTimeout(() => { setShake(false); setPin('') }, 600)
      }
    }
  }

  // --- Products list ---
  const loadProducts = useCallback(async () => {
    setListLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, brand, category, price_tier, image_url')
      .order('id', { ascending: false })
    setProducts(data || [])
    setListLoading(false)
  }, [])

  useEffect(() => { if (unlocked) loadProducts() }, [unlocked, loadProducts])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const res = await fetch('/api/list-users')
      if (!res.ok) throw new Error((await res.json()).error || `Error ${res.status}`)
      const data = await res.json()
      setUsers(data.users)
    } catch (err) {
      setUsersError(err.message)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => { if (unlocked && activeTab === 'users') loadUsers() }, [unlocked, activeTab, loadUsers])

  // --- Usage ---
  const loadUsage = useCallback(async () => {
    setUsageLoading(true)
    setUsageError(null)
    try {
      // Pull last 35 days — enough for monthly aggregates
      const since = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('service_usage')
        .select('service, units, cost_usd, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      if (error) throw error
      setUsageRows(data || [])
    } catch (err) {
      setUsageError(err.message)
    } finally {
      setUsageLoading(false)
    }
  }, [])

  useEffect(() => { if (unlocked && activeTab === 'usage') loadUsage() }, [unlocked, activeTab, loadUsage])

  // --- Auto-sum mentions ---
  function recalcMentions(sources) {
    const total = Object.values(sources).reduce((sum, v) => sum + (Number(v) || 0), 0)
    setFormData(prev => ({ ...prev, mentions: String(total), sources }))
  }

  // --- AI Auto-fill ---
  async function handleAutoFill() {
    if (!formData.name.trim() || !formData.brand.trim()) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, brand: formData.brand }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setFormData(prev => ({
        ...prev,
        image_url: data.image_url || prev.image_url || '',
        category: data.category || '',
        price: String(data.price || ''),
        price_tier: data.price_tier || '',
        age_range: data.age_range || [],
        mentions: String(data.mentions || '0'),
        sources: Object.fromEntries(
          SOURCES.map(s => [s, String(data.sources?.[s] || '')])
        ),
        verdict: data.verdict || '',
        pros: data.pros?.length ? data.pros : ['', '', ''],
        cons: data.cons?.length ? data.cons : ['', ''],
        best_for: data.best_for || '',
        recall: data.recall || false,
        recall_details: data.recall_details || null,
      }))
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  // --- Edit ---
  async function handleEdit(p) {
    const { data } = await supabase.from('products').select('*').eq('id', p.id).single()
    if (!data) return
    setEditingId(data.id)
    setFormData({
      name: data.name,
      brand: data.brand,
      image_url: data.image_url || '',
      category: data.category,
      price: String(data.price),
      price_tier: data.price_tier,
      age_range: data.age_range || [],
      mentions: String(data.mentions),
      sources: Object.fromEntries(SOURCES.map(s => [s, String(data.sources?.[s] || '')])),
      verdict: data.verdict || '',
      pros: data.pros?.length ? data.pros : ['', '', ''],
      cons: data.cons?.length ? data.cons : ['', ''],
      best_for: data.best_for || '',
      recall: data.recall || false,
      recall_details: data.recall_details || null,
    })
    setActiveTab('single')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setSaveStatus(null)
  }

  // --- Save ---
  async function handleSave() {
    setSaveLoading(true)
    setSaveStatus(null)
    const row = {
      id: editingId || Date.now(),
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      image_url: formData.image_url.trim() || null,
      category: formData.category,
      price: Number(formData.price),
      price_tier: formData.price_tier,
      age_range: formData.age_range,
      mentions: Number(formData.mentions),
      sources: Object.fromEntries(
        Object.entries(formData.sources).map(([k, v]) => [k, Number(v) || 0])
      ),
      verdict: formData.verdict.trim(),
      pros: formData.pros.filter(Boolean),
      cons: formData.cons.filter(Boolean),
      best_for: formData.best_for.trim(),
      recall: formData.recall,
      recall_details: formData.recall ? formData.recall_details : null,
    }
    let error
    if (editingId) {
      // Use explicit UPDATE for edits (upsert + RLS can silently fail)
      const { id, ...updates } = row
      const result = await supabase.from('products').update(updates).eq('id', editingId)
      error = result.error
      console.log('Update result:', { editingId, error: result.error, status: result.status, count: result.count })
    } else {
      const result = await supabase.from('products').insert(row)
      error = result.error
    }
    if (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
    } else {
      setSaveStatus('success')
      setFormData(EMPTY_FORM)
      setEditingId(null)
      loadProducts()
      setTimeout(() => setSaveStatus(null), 3000)
    }
    setSaveLoading(false)
  }

  // --- Bulk Generate ---
  async function handleBulkFind() {
    setBulkLoading(true)
    setBulkError(null)
    setBulkResults([])
    setBulkSelected(new Set())
    setBulkImportStatus(null)
    try {
      const res = await fetch('/api/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: bulkCategory, priceTier: bulkTier }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Error ${res.status}`)
      }
      const data = await res.json()
      setBulkResults(data.products || [])
      // Pre-select all
      setBulkSelected(new Set(data.products.map((_, i) => i)))
    } catch (err) {
      setBulkError(err.message)
    } finally {
      setBulkLoading(false)
    }
  }

  function toggleBulkSelect(index) {
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  async function handleBulkImport() {
    if (bulkSelected.size === 0) return
    setBulkImporting(true)
    setBulkImportStatus(null)
    const toImport = [...bulkSelected].map(i => bulkResults[i])
    let success = 0, fail = 0
    const base = Date.now()
    for (let i = 0; i < toImport.length; i++) {
      const p = toImport[i]
      const row = {
        id: base + i,
        name: p.name,
        brand: p.brand,
        image_url: p.image_url || null,
        category: p.category,
        price: Number(p.price),
        price_tier: p.price_tier,
        age_range: p.age_range,
        mentions: Number(p.mentions),
        sources: Object.fromEntries(
          Object.entries(p.sources || {}).map(([k, v]) => [k, Number(v) || 0])
        ),
        verdict: p.verdict,
        pros: p.pros,
        cons: p.cons,
        best_for: p.best_for,
        recall: p.recall || false,
        recall_details: p.recall_details || null,
      }
      const { error } = await supabase.from('products').upsert(row)
      if (error) fail++
      else success++
    }
    setBulkImportStatus({ success, fail })
    setBulkImporting(false)
    if (success > 0) loadProducts()
  }

  // --- Delete ---
  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  // --- Batch find images for products missing one ---
  async function handleFindImages() {
    const missing = products.filter(p => !p.image_url)
    if (missing.length === 0) { setImageProgress('All products already have images!'); return }
    setFindingImages(true)
    let found = 0
    for (let i = 0; i < missing.length; i++) {
      const p = missing[i]
      setImageProgress(`Searching ${i + 1}/${missing.length}: ${p.brand} ${p.name}...`)
      try {
        const res = await fetch(`/api/search-image?q=${encodeURIComponent(`${p.brand} ${p.name} baby product`)}`)
        const data = await res.json()
        if (data.imageUrl) {
          await supabase.from('products').update({ image_url: data.imageUrl }).eq('id', p.id)
          found++
        }
      } catch {}
    }
    setImageProgress(`Done! Found images for ${found}/${missing.length} products.`)
    setFindingImages(false)
    loadProducts()
  }

  // --- PIN screen ---
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className={`w-full max-w-xs text-center ${shake ? 'animate-bounce' : ''}`}>
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9EC4C5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Access</h1>
          <p className="text-sm text-gray-400 mb-6">Enter your 4-digit PIN</p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={e => handlePinChange(e.target.value)}
            placeholder="••••"
            autoFocus
            className="w-full text-center text-2xl tracking-[0.5em] border-2 border-gray-200 rounded-xl py-4 focus:outline-none focus:border-brand-400 bg-white"
          />
          {shake && <p className="text-xs text-red-500 mt-3">Incorrect PIN. Try again.</p>}
          <button onClick={() => navigate('/')} className="mt-6 text-sm text-gray-400">← Back to app</button>
        </div>
      </div>
    )
  }

  // --- Main admin ---
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <span className="text-sm font-bold text-brand-500">Admin</span>
        <div className="w-12" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Tab bar */}
        <div className="flex bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
          {[['single', 'Add Product'], ['bulk', 'Bulk'], ['users', 'Users'], ['usage', 'Used Service']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}>{label}</button>
          ))}
        </div>

        {/* Bulk Generate tab */}
        {activeTab === 'bulk' && (
          <>
            <div className={cardClass}>
              <h2 className="text-sm font-bold text-gray-800 mb-1">Find Products Automatically</h2>
              <p className="text-xs text-gray-400 mb-4">AI will find 10 real baby products and fill in all the details for you.</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select className={inputClass} value={bulkCategory} onChange={e => setBulkCategory(e.target.value)}>
                    {BULK_CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Price Tier</label>
                  <select className={inputClass} value={bulkTier} onChange={e => setBulkTier(e.target.value)}>
                    {BULK_TIERS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tiers' : t}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleBulkFind} disabled={bulkLoading}
                className="w-full bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2">
                {bulkLoading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 01-9-9"/>
                    </svg>
                    Searching for products...
                  </>
                ) : '🔍 Find Products'}
              </button>
              {bulkError && <p className="text-xs text-red-500 mt-2">{bulkError}</p>}
            </div>

            {bulkResults.length > 0 && (
              <>
                <div className="flex items-center justify-between px-1">
                  <p className="text-sm font-bold text-gray-700">{bulkResults.length} products found</p>
                  <div className="flex gap-3">
                    <button onClick={() => setBulkSelected(new Set(bulkResults.map((_, i) => i)))}
                      className="text-xs text-brand-500 font-semibold">Select all</button>
                    <button onClick={() => setBulkSelected(new Set())}
                      className="text-xs text-gray-400 font-semibold">Deselect all</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {bulkResults.map((p, i) => (
                    <div key={i}
                      onClick={() => toggleBulkSelect(i)}
                      className={`${cardClass} cursor-pointer transition-all ${
                        bulkSelected.has(i) ? 'ring-2 ring-brand-400 border-brand-200' : 'opacity-60'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          bulkSelected.has(i) ? 'bg-brand-500 border-brand-500' : 'border-gray-200'
                        }`}>
                          {bulkSelected.has(i) && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2 6 5 9 10 3" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-bold text-gray-800">{p.brand} {p.name}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[p.category] || 'bg-gray-100 text-gray-600'}`}>
                              {p.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tierColors[p.price_tier] || ''}`}>
                              {p.price_tier}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">${p.price} · {p.mentions} mentions</p>
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{p.verdict}</p>
                          {p.pros?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {p.pros.slice(0, 2).map((pro, j) => (
                                <span key={j} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{pro}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {bulkImportStatus && (
                  <div className={`rounded-2xl p-4 text-center text-sm font-semibold ${
                    bulkImportStatus.fail === 0
                      ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                      : 'bg-amber-50 border border-amber-100 text-amber-700'
                  }`}>
                    {bulkImportStatus.fail === 0
                      ? `✅ ${bulkImportStatus.success} products imported!`
                      : `⚠️ ${bulkImportStatus.success} imported, ${bulkImportStatus.fail} failed (check RLS policies)`}
                  </div>
                )}

                <button onClick={handleBulkImport}
                  disabled={bulkImporting || bulkSelected.size === 0}
                  className="w-full bg-brand-500 text-white font-bold text-sm py-4 rounded-2xl disabled:opacity-40 shadow-sm">
                  {bulkImporting
                    ? `Importing ${bulkSelected.size} products...`
                    : `Import ${bulkSelected.size} Selected Product${bulkSelected.size !== 1 ? 's' : ''}`}
                </button>
              </>
            )}
          </>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800">
                Accounts
                {!usersLoading && <span className="ml-2 text-gray-400 font-normal">({users.length})</span>}
              </h2>
              <button onClick={loadUsers} className="text-xs text-brand-500 font-semibold">Refresh</button>
            </div>

            {usersLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : usersError ? (
              <p className="text-sm text-red-500 text-center py-4">{usersError}</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No users found.</p>
            ) : (
              <div className="space-y-2">
                {users.map((u, i) => (
                  <div key={u.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-500">{u.email?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{u.email}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="text-[11px] text-gray-400">
                          Joined {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {u.lastSignIn && (
                          <span className="text-[11px] text-gray-400">
                            Last login {new Date(u.lastSignIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          u.emailConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {u.emailConfirmed ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0 mt-1">#{i + 1}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Used Service tab */}
        {activeTab === 'usage' && (
          <UsageView rows={usageRows} loading={usageLoading} error={usageError} onRefresh={loadUsage} />
        )}

        {/* Single product tab */}
        {activeTab === 'single' && (
        <>

        {/* Edit mode banner */}
        {editingId && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">✏️</span>
              <p className="text-sm font-semibold text-amber-700">Editing existing product</p>
            </div>
            <button onClick={handleCancelEdit} className="text-xs font-semibold text-amber-600 hover:text-amber-800">
              Cancel
            </button>
          </div>
        )}

        {/* Section 1 — Identity + AI */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-4">Product Identity</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelClass}>Product Name</label>
              <input className={inputClass} placeholder="e.g. VISTA V2" value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input className={inputClass} placeholder="e.g. UPPAbaby" value={formData.brand}
                onChange={e => setFormData(p => ({ ...p, brand: e.target.value }))} />
            </div>
          </div>
          <button
            onClick={handleAutoFill}
            disabled={aiLoading || !formData.name.trim() || !formData.brand.trim()}
            className="w-full bg-brand-500 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {aiLoading ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 01-9-9"/>
                </svg>
                Generating with AI...
              </>
            ) : (
              <>✨ Auto-fill with AI</>
            )}
          </button>
          {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
        </div>

        {/* Section 1.5 — Product Image */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-4">Product Image</h2>
          <label className={labelClass}>Image URL</label>
          <div className="flex gap-2 mb-3">
            <input className={inputClass} placeholder="https://example.com/product.jpg" value={formData.image_url}
              onChange={e => setFormData(p => ({ ...p, image_url: e.target.value }))} />
            {formData.name && formData.brand && !formData.image_url && (
              <button type="button"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/search-image?q=${encodeURIComponent(`${formData.brand} ${formData.name} baby product`)}`)
                    const data = await res.json()
                    if (data.imageUrl) setFormData(p => ({ ...p, image_url: data.imageUrl }))
                  } catch {}
                }}
                className="flex-shrink-0 bg-brand-500 text-white text-xs font-semibold px-3 rounded-xl whitespace-nowrap">
                Find
              </button>
            )}
          </div>
          {formData.image_url && (
            <div className="relative">
              <img src={formData.image_url} alt="Product preview"
                className="w-full h-48 object-contain bg-gray-50 rounded-xl border border-gray-100"
                onError={e => { e.target.style.display = 'none' }} />
              <button onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 text-gray-400 hover:text-red-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Section 2 — Core Details */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-4">Core Details</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} value={formData.category}
                onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                <option value="">Select...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Price (USD)</label>
              <input className={inputClass} type="number" min="0" placeholder="299" value={formData.price}
                onChange={e => setFormData(p => ({ ...p, price: e.target.value }))} />
            </div>
          </div>

          <label className={labelClass}>Price Tier</label>
          <div className="flex gap-2 mb-4">
            {PRICE_TIERS.map(t => (
              <button key={t} onClick={() => setFormData(p => ({ ...p, price_tier: t }))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  formData.price_tier === t ? tierColors[t] + ' border-current' : 'bg-white border-gray-200 text-gray-500'
                }`}>{t}</button>
            ))}
          </div>

          <label className={labelClass}>Age Range</label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map(a => (
              <button key={a} onClick={() => {
                const next = formData.age_range.includes(a)
                  ? formData.age_range.filter(x => x !== a)
                  : [...formData.age_range, a]
                setFormData(p => ({ ...p, age_range: next }))
              }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  formData.age_range.includes(a) ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-500'
                }`}>{a}</button>
            ))}
          </div>
        </div>

        {/* Section 3 — Sources */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">Mentions by Source</h2>
            <span className="text-xs font-bold text-brand-500">Total: {formData.mentions}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SOURCES.map(s => (
              <div key={s}>
                <label className={labelClass}>{s}</label>
                <input className={inputClass} type="number" min="0" placeholder="0"
                  value={formData.sources[s]}
                  onChange={e => {
                    const updated = { ...formData.sources, [s]: e.target.value }
                    recalcMentions(updated)
                  }} />
              </div>
            ))}
          </div>
        </div>

        {/* Section 4 — Editorial */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-4">Editorial Content</h2>

          <label className={labelClass}>Community Verdict</label>
          <textarea className={`${inputClass} resize-none mb-4`} rows={3} placeholder="2-3 sentence summary..."
            value={formData.verdict} onChange={e => setFormData(p => ({ ...p, verdict: e.target.value }))} />

          <label className={labelClass}>Pros</label>
          <div className="space-y-2 mb-3">
            {formData.pros.map((pro, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder={`Pro ${i + 1}`} value={pro}
                  onChange={e => {
                    const next = [...formData.pros]; next[i] = e.target.value
                    setFormData(p => ({ ...p, pros: next }))
                  }} />
                {formData.pros.length > 1 && (
                  <button onClick={() => setFormData(p => ({ ...p, pros: p.pros.filter((_, j) => j !== i) }))}
                    className="text-gray-300 hover:text-red-400 px-2">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setFormData(p => ({ ...p, pros: [...p.pros, ''] }))}
              className="text-xs text-brand-500 font-semibold">+ Add Pro</button>
          </div>

          <label className={labelClass}>Cons</label>
          <div className="space-y-2 mb-4">
            {formData.cons.map((con, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder={`Con ${i + 1}`} value={con}
                  onChange={e => {
                    const next = [...formData.cons]; next[i] = e.target.value
                    setFormData(p => ({ ...p, cons: next }))
                  }} />
                {formData.cons.length > 1 && (
                  <button onClick={() => setFormData(p => ({ ...p, cons: p.cons.filter((_, j) => j !== i) }))}
                    className="text-gray-300 hover:text-red-400 px-2">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setFormData(p => ({ ...p, cons: [...p.cons, ''] }))}
              className="text-xs text-brand-500 font-semibold">+ Add Con</button>
          </div>

          <label className={labelClass}>Best For</label>
          <input className={inputClass} placeholder="e.g. First-time parents on a budget" value={formData.best_for}
            onChange={e => setFormData(p => ({ ...p, best_for: e.target.value }))} />
        </div>

        {/* Section 5 — Recall */}
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-800">Recall History</p>
              <p className="text-xs text-gray-400 mt-0.5">Toggle on if product has an active recall</p>
            </div>
            <button onClick={() => setFormData(p => ({ ...p, recall: !p.recall, recall_details: !p.recall ? { date: '', reason: '', action: '' } : null }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${formData.recall ? 'bg-red-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.recall ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {formData.recall && (
            <div className="mt-4 space-y-3 pt-4 border-t border-red-100">
              <div>
                <label className={labelClass}>Recall Date</label>
                <input className={inputClass} type="date" value={formData.recall_details?.date || ''}
                  onChange={e => setFormData(p => ({ ...p, recall_details: { ...p.recall_details, date: e.target.value } }))} />
              </div>
              <div>
                <label className={labelClass}>Reason</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={formData.recall_details?.reason || ''}
                  onChange={e => setFormData(p => ({ ...p, recall_details: { ...p.recall_details, reason: e.target.value } }))} />
              </div>
              <div>
                <label className={labelClass}>Required Action</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={formData.recall_details?.action || ''}
                  onChange={e => setFormData(p => ({ ...p, recall_details: { ...p.recall_details, action: e.target.value } }))} />
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        {saveStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center text-sm font-semibold text-emerald-700">
            ✅ Product saved successfully!
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center text-sm font-semibold text-red-600">
            ❌ Failed to save. Check Supabase RLS policies.
          </div>
        )}
        <button onClick={handleSave} disabled={saveLoading || !formData.name || !formData.category}
          className="w-full bg-brand-500 text-white font-bold text-sm py-4 rounded-2xl disabled:opacity-40 shadow-sm">
          {saveLoading ? 'Saving...' : editingId ? 'Update Product' : 'Save to Database'}
        </button>
        </>
        )}

        {/* Existing products — hidden on Users + Usage tabs */}
        {activeTab !== 'users' && activeTab !== 'usage' && <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800">
              Existing Products
              <span className="ml-2 text-gray-400 font-normal">({products.length})</span>
            </h2>
            <button onClick={handleFindImages} disabled={findingImages}
              className="text-xs font-semibold text-brand-500 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-40">
              {findingImages ? 'Searching...' : '🖼️ Find Missing Images'}
            </button>
          </div>
          {imageProgress && (
            <p className="text-xs text-gray-500 mb-3 bg-gray-50 rounded-lg px-3 py-2">{imageProgress}</p>
          )}
          {listLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No products yet.</p>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-8 h-8 object-contain rounded flex-shrink-0 bg-gray-50" />
                    ) : (
                      <div className="w-8 h-8 rounded flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-300 text-[10px]">—</div>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${categoryColors[p.category] || 'bg-gray-100 text-gray-600'}`}>
                      {p.category}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate">{p.brand}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button onClick={() => handleEdit(p)}
                      className="p-2 text-gray-300 hover:text-brand-500 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}

// --- Usage view ---
// Reset periods:
//   day   = since local midnight today
//   month = since 1st of this calendar month
//   all   = cumulative (no reset)
const SERVICE_LIMITS = [
  { key: 'serpapi',   label: 'SerpAPI',   icon: '🔍', period: 'month', limit: 100,    unitLabel: 'searches', resetText: 'Resets 1st of month' },
  { key: 'resend',    label: 'Resend',    icon: '📧', period: 'day',   limit: 100,    unitLabel: 'emails',   resetText: 'Resets daily · 3,000/mo cap', altPeriod: 'month', altLimit: 3000 },
  { key: 'youtube',   label: 'YouTube',   icon: '▶️',  period: 'day',   limit: 10000,  unitLabel: 'units',    resetText: 'Resets midnight Pacific · 100/search' },
  { key: 'anthropic', label: 'Anthropic', icon: '🤖', period: 'all',   limit: null,   unitLabel: 'tokens',   resetText: 'Pay-as-you-go · no reset', isCost: true },
  { key: 'reddit',    label: 'Reddit',    icon: '🗨️',  period: 'all',   limit: null,   unitLabel: '',         resetText: 'API access pending approval', isPending: true },
]

function periodStart(period) {
  const now = new Date()
  if (period === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  return new Date(0)
}

function sumInPeriod(rows, service, period, field = 'units') {
  const start = periodStart(period).getTime()
  return rows
    .filter(r => r.service === service && new Date(r.created_at).getTime() >= start)
    .reduce((sum, r) => sum + Number(r[field] || 0), 0)
}

function UsageView({ rows, loading, error, onRefresh }) {
  const [startingBalance, setStartingBalance] = useState(() => {
    const v = localStorage.getItem('babylens_anthropic_starting_balance')
    return v ? Number(v) : 0
  })
  const [balanceDate, setBalanceDate] = useState(() => localStorage.getItem('babylens_anthropic_balance_date') || '')
  const [editingBalance, setEditingBalance] = useState(false)
  const [balanceDraft, setBalanceDraft] = useState(String(startingBalance || ''))

  function saveBalance() {
    const n = Number(balanceDraft)
    if (!isNaN(n)) {
      setStartingBalance(n)
      const today = new Date().toISOString().slice(0, 10)
      setBalanceDate(today)
      localStorage.setItem('babylens_anthropic_starting_balance', String(n))
      localStorage.setItem('babylens_anthropic_balance_date', today)
    }
    setEditingBalance(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-bold text-gray-800">API Service Usage</h2>
          <p className="text-xs text-gray-400 mt-0.5">Logged per call · auto-resets on schedule</p>
        </div>
        <button onClick={onRefresh} className="text-xs text-brand-500 font-semibold">Refresh</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {SERVICE_LIMITS.map(s => {
            if (s.isPending) {
              return (
                <div key={s.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{s.label}</p>
                      <p className="text-[11px] text-amber-600 font-semibold mt-0.5">⏳ {s.resetText}</p>
                    </div>
                  </div>
                </div>
              )
            }
            if (s.isCost) {
              // Only count spend since the starting-balance date was set
              const since = balanceDate ? new Date(balanceDate).getTime() : 0
              const scopedRows = rows.filter(r => new Date(r.created_at).getTime() >= since)
              const totalCost = scopedRows.filter(r => r.service === s.key).reduce((sum, r) => sum + Number(r.cost_usd || 0), 0)
              const totalTokens = scopedRows.filter(r => r.service === s.key).reduce((sum, r) => sum + Number(r.units || 0), 0)
              const remaining = startingBalance > 0 ? Math.max(0, startingBalance - totalCost) : null
              const pct = startingBalance > 0 ? Math.min(100, (totalCost / startingBalance) * 100) : 0
              const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <div key={s.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{s.label}</p>
                      <p className="text-[11px] text-gray-400">{s.resetText}</p>
                    </div>
                    <div className="text-right">
                      {remaining !== null ? (
                        <>
                          <p className="text-lg font-bold text-brand-500">${remaining.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">left</p>
                        </>
                      ) : (
                        <>
                          <p className="text-lg font-bold text-brand-500">${totalCost.toFixed(4)}</p>
                          <p className="text-[10px] text-gray-400">spent</p>
                        </>
                      )}
                    </div>
                  </div>
                  {startingBalance > 0 && (
                    <>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[11px] text-gray-500 font-semibold">${totalCost.toFixed(4)} / ${startingBalance.toFixed(2)} used</span>
                        <span className="text-[11px] text-gray-400">{totalTokens.toLocaleString()} tokens</span>
                      </div>
                    </>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                    {editingBalance ? (
                      <>
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-xs text-gray-500">$</span>
                          <input
                            type="number" step="0.01" min="0" autoFocus
                            value={balanceDraft}
                            onChange={e => setBalanceDraft(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400"
                            placeholder="9.37"
                          />
                        </div>
                        <button onClick={saveBalance} className="text-xs font-semibold text-brand-500 px-2">Save</button>
                        <button onClick={() => { setEditingBalance(false); setBalanceDraft(String(startingBalance || '')) }}
                          className="text-xs text-gray-400 px-1">Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="text-[11px] text-gray-400">
                          {startingBalance > 0
                            ? <>Balance set {balanceDate} · <button onClick={() => setEditingBalance(true)} className="text-brand-500 font-semibold">Update</button></>
                            : <button onClick={() => setEditingBalance(true)} className="text-brand-500 font-semibold">+ Set starting balance</button>}
                        </div>
                        <a href="https://console.anthropic.com/settings/billing" target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-brand-500 font-semibold hover:underline">Console ↗</a>
                      </>
                    )}
                  </div>
                </div>
              )
            }
            const used = sumInPeriod(rows, s.key, s.period)
            const pct = s.limit ? Math.min(100, (used / s.limit) * 100) : 0
            const remaining = s.limit ? Math.max(0, s.limit - used) : null
            const barColor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
            const altUsed = s.altPeriod ? sumInPeriod(rows, s.key, s.altPeriod) : null
            return (
              <div key={s.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">{s.label}</p>
                    <p className="text-[11px] text-gray-400">{s.resetText}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-500">{remaining?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400">left today</p>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[11px] text-gray-500 font-semibold">{used.toLocaleString()} / {s.limit.toLocaleString()} {s.unitLabel}</span>
                  {altUsed !== null && (
                    <span className="text-[11px] text-gray-400">{altUsed.toLocaleString()} / {s.altLimit.toLocaleString()} this month</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center pt-2">
        Usage is logged from the moment tracking was deployed. Older calls are not counted.
      </p>
    </div>
  )
}
