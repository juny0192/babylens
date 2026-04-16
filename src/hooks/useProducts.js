import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, mapProduct } from '../lib/supabase'

export function useProducts(filters, query) {
  const [rawProducts, setRawProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Re-fetch when the page becomes visible again (e.g. navigating back)
  useEffect(() => {
    function handleFocus() { setRefreshKey(k => k + 1) }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      let q = supabase
        .from('products')
        .select('*')
        .order('mentions', { ascending: false })

      if (filters.categories.length === 1) {
        q = q.eq('category', filters.categories[0])
      }
      if (filters.tiers.length === 1) {
        q = q.eq('price_tier', filters.tiers[0])
      }
      if (filters.maxPrice < 1200) {
        q = q.lte('price', filters.maxPrice)
      }
      if (filters.recallOnly) {
        q = q.eq('recall', false)
      }

      const { data, error: err } = await q

      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setRawProducts((data || []).map(mapProduct))
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [filters.categories, filters.tiers, filters.maxPrice, filters.recallOnly, refreshKey])

  // Client-side filters that are harder to express as Supabase queries
  const products = useMemo(() => {
    let list = rawProducts

    if (filters.categories.length > 1) {
      list = list.filter((p) => filters.categories.includes(p.category))
    }
    if (filters.tiers.length > 1) {
      list = list.filter((p) => filters.tiers.includes(p.priceTier))
    }
    if (filters.ages.length) {
      list = list.filter((p) => filters.ages.some((a) => p.ageRange.includes(a)))
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      )
    }

    return list
  }, [rawProducts, filters.categories, filters.tiers, filters.ages, query])

  return { products, totalCount: rawProducts.length, loading, error }
}
