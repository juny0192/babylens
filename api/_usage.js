// Shared helper for logging API usage to Supabase from serverless functions
import { createClient } from '@supabase/supabase-js'

let client = null
function getClient() {
  if (client) return client
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  client = createClient(url, key)
  return client
}

/**
 * Log a single usage event. Never throws — failure here should not break the caller.
 * @param {string} service - e.g. 'serpapi', 'resend', 'anthropic', 'youtube'
 * @param {number} units - number of units consumed (default 1)
 * @param {number} cost_usd - optional USD cost for this call
 * @param {object} metadata - optional freeform info
 */
export async function logUsage(service, units = 1, cost_usd = 0, metadata = null) {
  try {
    const supabase = getClient()
    if (!supabase) return
    await supabase.from('service_usage').insert({ service, units, cost_usd, metadata })
  } catch (err) {
    console.error('logUsage failed:', err.message)
  }
}

// Anthropic claude-opus-4-5 pricing (USD per 1M tokens)
const ANTHROPIC_INPUT_PER_M = 15
const ANTHROPIC_OUTPUT_PER_M = 75

export function estimateAnthropicCost(usage) {
  if (!usage) return 0
  const input = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0)
  const output = usage.output_tokens || 0
  return (input / 1_000_000) * ANTHROPIC_INPUT_PER_M + (output / 1_000_000) * ANTHROPIC_OUTPUT_PER_M
}
