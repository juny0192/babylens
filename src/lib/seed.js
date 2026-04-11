// Run once to populate the Supabase products table:
//   node src/lib/seed.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { products } from '../data/products.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY  // service role key bypasses RLS
)

const rows = products.map((p) => ({
  id: p.id,
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.price,
  price_tier: p.priceTier,
  age_range: p.ageRange,
  mentions: p.mentions,
  sources: p.sources,
  verdict: p.verdict,
  pros: p.pros,
  cons: p.cons,
  best_for: p.bestFor,
  recall: p.recall,
  recall_details: p.recallDetails,
}))

const { error } = await supabase.from('products').upsert(rows)

if (error) {
  console.error('Seed failed:', error.message)
  process.exit(1)
}

console.log(`Seeded ${rows.length} products successfully.`)
