import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDeviceId } from '../lib/deviceId'

const SavedContext = createContext(null)

export function SavedProvider({ children }) {
  const [saved, setSaved] = useState(new Set())
  const deviceId = getDeviceId()

  // Load saved products for this device on mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('device_id', deviceId)

      if (data) {
        setSaved(new Set(data.map((r) => r.product_id)))
      }
    }
    load()
  }, [deviceId])

  const toggleSaved = useCallback(
    async (id) => {
      // Optimistic update
      setSaved((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })

      const alreadySaved = saved.has(id)

      if (alreadySaved) {
        await supabase
          .from('saved_products')
          .delete()
          .eq('device_id', deviceId)
          .eq('product_id', id)
      } else {
        await supabase
          .from('saved_products')
          .insert({ device_id: deviceId, product_id: id })
      }
    },
    [saved, deviceId]
  )

  const isSaved = useCallback((id) => saved.has(id), [saved])

  return (
    <SavedContext.Provider value={{ saved, toggleSaved, isSaved }}>
      {children}
    </SavedContext.Provider>
  )
}

export function useSaved() {
  return useContext(SavedContext)
}
