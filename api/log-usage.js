// Logs API usage from the client side (e.g., YouTube search calls)

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { service, units = 1, cost_usd = 0, metadata } = req.body || {}
  if (!service) return res.status(400).json({ error: 'Missing service' })

  try {
    await supabase.from('service_usage').insert({ service, units, cost_usd, metadata })
    res.status(200).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
