import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a product data generator for BabyLens, a baby product review aggregator.
You respond ONLY with a valid JSON object — no markdown, no explanation, no code fences.
All field names and values must exactly match the schema provided.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, brand } = req.body || {}
  if (!name || !brand) {
    return res.status(400).json({ error: 'Missing name or brand' })
  }

  const userPrompt = `Generate realistic aggregated review data for the baby product: "${brand} ${name}".

Return a single JSON object with exactly these fields:

{
  "category": one of ["Strollers","Monitors","Car Seats","Carriers","Feeding"],
  "price": integer in USD (realistic retail price, no decimals),
  "price_tier": one of ["Budget","Mid","Premium"],
  "age_range": array containing one or more of ["0-3mo","3-6mo","6-12mo","1-2yr","2+yr"],
  "mentions": integer total (must equal exact sum of all source counts below),
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
- mentions must equal the exact sum of all six source counts
- Price tiers: Budget = under $100, Mid = $100-$400, Premium = over $400
- Reddit typically has 25-45% of total mentions
- BabyGearLab and Consumer Reports typically have 3-8% each
- recall should be false and recall_details null unless product has a known real recall
- Use actual product knowledge where available`

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0].text.trim()
    // Strip markdown fences if model wraps output
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      return res.status(502).json({ error: 'AI returned invalid JSON', raw: cleaned })
    }

    // Ensure mentions equals sum of sources
    const sourceSum = Object.values(parsed.sources || {}).reduce((a, b) => a + Number(b), 0)
    parsed.mentions = sourceSum

    res.status(200).json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
