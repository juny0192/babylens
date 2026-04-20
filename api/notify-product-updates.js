// Vercel Cron job — runs daily to email users about saved product updates.
// Checks products updated in the last 24h, finds users who saved them
// with email notifications enabled, and sends a digest email via Resend.

import { createClient } from '@supabase/supabase-js'
import { logUsage } from './_usage.js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function handler(req, res) {
  // Verify this is a cron call or manual trigger with admin key
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY' })
  }

  try {
    // 1. Find products updated in the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: updatedProducts, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, brand, category, price, updated_at')
      .gte('updated_at', since)

    if (prodErr) throw prodErr
    if (!updatedProducts || updatedProducts.length === 0) {
      return res.status(200).json({ message: 'No product updates in last 24h', emailsSent: 0 })
    }

    const productIds = updatedProducts.map(p => p.id)

    // 2. Find users who saved these products
    const { data: savedEntries, error: savedErr } = await supabaseAdmin
      .from('saved_products')
      .select('device_id, product_id')
      .in('product_id', productIds)

    if (savedErr) throw savedErr
    if (!savedEntries || savedEntries.length === 0) {
      return res.status(200).json({ message: 'No users have saved updated products', emailsSent: 0 })
    }

    // Group product IDs by user ID (device_id is user.id for logged-in users)
    const userProductMap = {}
    for (const entry of savedEntries) {
      if (!userProductMap[entry.device_id]) userProductMap[entry.device_id] = []
      userProductMap[entry.device_id].push(entry.product_id)
    }

    // 3. Filter to users who have email notifications enabled
    const userIds = Object.keys(userProductMap)
    const { data: notifSettings, error: settingsErr } = await supabaseAdmin
      .from('user_settings')
      .select('user_id')
      .in('user_id', userIds)
      .eq('email_notifications', true)

    if (settingsErr) throw settingsErr
    if (!notifSettings || notifSettings.length === 0) {
      return res.status(200).json({ message: 'No users with notifications enabled', emailsSent: 0 })
    }

    const notifyUserIds = notifSettings.map(s => s.user_id)

    // 4. Get user emails from auth
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers()
    if (usersErr) throw usersErr

    const userEmailMap = {}
    for (const u of users) {
      if (notifyUserIds.includes(u.id) && u.email) {
        userEmailMap[u.id] = u.email
      }
    }

    // 5. Build product lookup
    const productMap = {}
    for (const p of updatedProducts) {
      productMap[p.id] = p
    }

    // 6. Send emails via Resend
    let emailsSent = 0
    const errors = []

    for (const userId of Object.keys(userEmailMap)) {
      const email = userEmailMap[userId]
      const userProductIds = userProductMap[userId]
      const products = userProductIds
        .map(id => productMap[id])
        .filter(Boolean)

      if (products.length === 0) continue

      const productList = products
        .map(p => `• <strong>${p.brand} ${p.name}</strong> (${p.category}) — $${p.price}`)
        .join('<br>')

      const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #ed5e58; margin-bottom: 4px;">BabyLens</h2>
          <p style="color: #6b7280; font-size: 14px; margin-top: 0;">Product Update Notification</p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 16px 0;" />
          <p style="color: #374151; font-size: 14px; line-height: 1.6;">
            Hey there! ${products.length === 1 ? 'One of your saved products has' : `${products.length} of your saved products have`} been updated:
          </p>
          <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px; color: #374151; line-height: 1.8;">
            ${productList}
          </div>
          <p style="font-size: 14px; color: #374151;">
            Check out the latest details on <a href="https://babylens.vercel.app" style="color: #ed5e58; text-decoration: none; font-weight: 600;">BabyLens</a>.
          </p>
          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0 12px;" />
          <p style="font-size: 11px; color: #9ca3af;">
            You're receiving this because you enabled notifications in BabyLens Settings.
            To unsubscribe, go to Settings and turn off Email Notifications.
          </p>
        </div>
      `

      try {
        const sendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'BabyLens <onboarding@resend.dev>',
            to: email,
            subject: `BabyLens: ${products.length} saved product${products.length > 1 ? 's' : ''} updated`,
            html: htmlBody,
          }),
        })

        if (sendRes.ok) {
          emailsSent++
          logUsage('resend', 1, 0, { endpoint: 'notify-product-updates', products: products.length })
        } else {
          const errData = await sendRes.json().catch(() => ({}))
          errors.push({ email, error: errData?.message || sendRes.status })
        }
      } catch (err) {
        errors.push({ email, error: err.message })
      }
    }

    return res.status(200).json({
      message: `Done. ${emailsSent} notification email(s) sent.`,
      updatedProducts: updatedProducts.length,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
