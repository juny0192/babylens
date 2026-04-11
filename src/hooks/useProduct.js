import { useState, useEffect } from 'react'
import { supabase, mapProduct } from '../lib/supabase'

export function useProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function fetch() {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setProduct(mapProduct(data))
      setLoading(false)
    }

    fetch()
    return () => { cancelled = true }
  }, [id])

  return { product, loading, error }
}
