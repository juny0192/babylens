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

  // --- Users state ---
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState(null)

  // --- Bulk Generate state ---
  const [activeTab, setActiveTab] = useState('single') // 'single' | 'bulk' | 'users'
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
      .select('id, name, brand, category, price_tier')
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
    const { error } = await supabase.from('products').upsert(row)
    if (error) {
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

  // --- PIN screen ---
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className={`w-full max-w-xs text-center ${shake ? 'animate-bounce' : ''}`}>
          <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ed5e58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          {[['single', 'Add Product'], ['bulk', 'Bulk Generate'], ['users', 'Users']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
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

        {/* Existing products */}
        <div className={cardClass}>
          <h2 className="text-sm font-bold text-gray-800 mb-4">
            Existing Products
            <span className="ml-2 text-gray-400 font-normal">({products.length})</span>
          </h2>
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
        </div>
      </div>
    </div>
  )
}
