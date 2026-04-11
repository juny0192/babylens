import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Map snake_case DB columns to camelCase for use in components
export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    price: row.price,
    priceTier: row.price_tier,
    ageRange: row.age_range,
    mentions: row.mentions,
    sources: row.sources,
    verdict: row.verdict,
    pros: row.pros,
    cons: row.cons,
    bestFor: row.best_for,
    recall: row.recall,
    recallDetails: row.recall_details,
  }
}
