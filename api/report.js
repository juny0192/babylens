// Sends user report emails to the admin via Resend
import { logUsage } from './_usage.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return res.status(500).json({ error: 'Missing RESEND_API_KEY' })

  const { category, description, userEmail, page } = req.body || {}
  if (!description?.trim()) return res.status(400).json({ error: 'Description is required' })

  try {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #ed5e58; margin-bottom: 4px;">Herdlee — User Report</h2>
        <p style="color: #6b7280; font-size: 13px; margin-top: 0;">${new Date().toLocaleString()}</p>
        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 16px 0;" />

        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 120px; vertical-align: top;">Category</td>
            <td style="padding: 8px 0; color: #111827; font-weight: 600;">${category || 'General'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">From</td>
            <td style="padding: 8px 0; color: #111827;">${userEmail || 'Anonymous'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Page</td>
            <td style="padding: 8px 0; color: #111827;">${page || 'Unknown'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Description</td>
            <td style="padding: 8px 0; color: #111827; line-height: 1.6;">${description.replace(/\n/g, '<br>')}</td>
          </tr>
        </table>
      </div>
    `

    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Herdlee Reports <onboarding@resend.dev>',
        to: 'juny0192@gmail.com',
        subject: `[Herdlee Report] ${category || 'General'} — ${description.slice(0, 60)}${description.length > 60 ? '...' : ''}`,
        html,
      }),
    })

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({}))
      return res.status(500).json({ error: err?.message || 'Failed to send email' })
    }

    logUsage('resend', 1, 0, { endpoint: 'report', category })
    res.status(200).json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
