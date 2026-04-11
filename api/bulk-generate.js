import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a product data generator for BabyLens, a baby product review aggregator.
You respond ONLY with a valid JSON array — no markdown, no explanation, no code fences.
All field names and values must exactly match the schema provided.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { category, priceTier } = req.body || {}

  const categoryFilter = category && category !== 'All' ? `in the "${category}" category` : 'across any baby product category (Strollers, Monitors, Car Seats, Carriers, Feeding)'
  const tierFilter = priceTier && priceTier !== 'All' ? `All products must be ${priceTier} tier.` : 'Mix of Budget, Mid, and Premium tiers.'

  const userPrompt = `Generate a list of 10 real, well-known baby products ${categoryFilter}.
${tierFilter}

Return a JSON array of 10 objects. Each object must have exactly these fields:

{
  "name": product model name (string),
  "brand": brand name (string),
  "category": one of ["Strollers","Monitors","Car Seats","Carriers","Feeding"],
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

    // Enforce mentions = sum of sources for each product
    const products = parsed.map(p => {
      const sourceSum = Object.values(p.sources || {}).reduce((a, b) => a + Number(b), 0)
      return { ...p, mentions: sourceSum }
    })

    res.status(200).json({ products })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
