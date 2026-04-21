import Anthropic from '@anthropic-ai/sdk'
import { logUsage, estimateAnthropicCost } from './_usage.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a product data generator for Herdlee, a baby product review aggregator.
You respond ONLY with a valid JSON array — no markdown, no explanation, no code fences.
All field names and values must exactly match the schema provided.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { category, priceTier, existingProducts = [] } = req.body || {}

  const CATEGORY_SCOPE = {
    'Strollers': 'full-size strollers, lightweight strollers, jogging strollers, umbrella strollers, double strollers. NOT car seats, carriers, or travel accessories.',
    'Car Seats': 'infant car seats, convertible car seats, booster seats, all-in-one car seats. NOT strollers, travel systems, or carriers.',
    'Carriers': 'baby carriers, wraps, ring slings, soft-structured carriers, mei tais. NOT strollers, car seats, or backpacks.',
    'Feeding': 'breast pumps, bottles, bottle warmers, formula dispensers, high chairs, bibs, nursing pillows, sippy cups, baby food makers. NOT monitors or general kitchen items.',
    'Monitors': 'video baby monitors, audio monitors, movement monitors, breathing monitors, smart monitors. NOT cameras or general electronics.',
    'Nursery & Sleep': 'cribs, bassinets, pack-n-plays, swings, bouncers, sleep sacks, swaddles, white noise machines, changing tables, dressers. NOT monitors or strollers.',
    'Gear & Travel': 'diaper bags, travel cribs, baby backpacks, bouncers for travel, baby carriers for hiking, stroller accessories, baby gates, high chair boosters for travel. NOT full-size strollers (those go in Strollers), NOT car seats (those go in Car Seats).',
    'Toys & Play': 'activity gyms, play mats, sensory toys, rattles, teethers, educational toys, building blocks, musical toys. NOT monitors, feeding items, or safety gear.',
    'Bath & Potty': 'baby bathtubs, bath seats, bath toys, potty training seats, baby wash, bath thermometers. NOT health monitors or general toiletries.',
    'Health & Safety': 'baby thermometers, nasal aspirators, baby gates, outlet covers, cabinet locks, first aid kits, humidifiers, nail clippers. NOT monitors, bath items, or feeding.',
  }

  const scopeNote = category && category !== 'All' && CATEGORY_SCOPE[category]
    ? `\nCategory scope for "${category}": ${CATEGORY_SCOPE[category]}`
    : ''

  const categoryFilter = category && category !== 'All' ? `in the "${category}" category` : 'across any baby product category (Strollers, Car Seats, Carriers, Feeding, Monitors, Nursery & Sleep, Gear & Travel, Toys & Play, Bath & Potty, Health & Safety)'
  const tierFilter = priceTier && priceTier !== 'All' ? `All products must be ${priceTier} tier.` : 'Mix of Budget, Mid, and Premium tiers.'

  const exclusionBlock = existingProducts.length > 0
    ? `\nDo NOT suggest any of these products — they are already in the database:\n${existingProducts.map(p => `- ${p.brand} ${p.name}`).join('\n')}\n`
    : ''

  const userPrompt = `Generate a list of 10 real, well-known baby products ${categoryFilter}.
${tierFilter}
${scopeNote}
${exclusionBlock}
Return a JSON array of 10 objects. Each object must have exactly these fields:

{
  "name": product model name (string),
  "brand": brand name (string),
  "category": one of ["Strollers","Car Seats","Carriers","Feeding","Monitors","Nursery & Sleep","Gear & Travel","Toys & Play","Bath & Potty","Health & Safety"],
  "price": integer in USD (realistic retail price),
  "price_tier": one of ["Budget","Mid","Premium"],
  "age_range": array of one or more ["0-3mo","3-6mo","6-12mo","1-2yr","2+yr"],
  "mentions": integer (must equal exact sum of all six source counts),
  "sources": {
    "Reddit": integer,
    "YouTube": integer,
    "BabyGearLab": integer,
    "The Bump": integer,
    "Lucie's List": integer,
    "Consumer Reports": integer
  },
  "verdict": "2-3 sentence community consensus summary",
  "pros": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "cons": ["drawback 1", "drawback 2", "drawback 3"],
  "best_for": "one short phrase describing ideal buyer",
  "recall": false,
  "recall_details": null
}

Guidelines:
- Use only real, well-known products that actually exist
- mentions must equal the exact sum of all six source counts
- Price tiers: Budget = under $100, Mid = $100-$400, Premium = over $400
- Reddit typically has 25-45% of total mentions
- BabyGearLab and Consumer Reports typically have 3-8% each
- recall should be false and recall_details null unless product has a known real recall
- Do not repeat products — all 10 must be distinct`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    logUsage('anthropic', (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0), estimateAnthropicCost(message.usage), { endpoint: 'bulk-generate', model: 'claude-opus-4-5' })

    const raw = message.content[0].text.trim()
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(502).json({ error: 'AI returned invalid JSON', raw: cleaned })
    }

    if (!Array.isArray(parsed)) {
      return res.status(502).json({ error: 'AI did not return an array', raw: cleaned })
    }

    // Enforce mentions = sum of sources, then find images
    const products = parsed.map(p => {
      const sourceSum = Object.values(p.sources || {}).reduce((a, b) => a + Number(b), 0)
      return { ...p, mentions: sourceSum }
    })

    // Auto-find images for each product using SerpAPI Google Images
    const serpApiKey = process.env.SERPAPI_KEY
    if (serpApiKey) {
      await Promise.all(products.map(async (p) => {
        try {
          const q = encodeURIComponent(`${p.brand} ${p.name} baby product`)
          const url = `https://serpapi.com/search.json?engine=google_images&q=${q}&num=3&api_key=${serpApiKey}`
          const r = await fetch(url)
          if (r.ok) {
            const d = await r.json()
            const img = d.images_results?.[0]?.thumbnail || d.images_results?.[0]?.original
            if (img) p.image_url = img
            logUsage('serpapi', 1, 0, { endpoint: 'bulk-generate', q: `${p.brand} ${p.name}` })
          }
        } catch {}
      }))
    }

    res.status(200).json({ products })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
