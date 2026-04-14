import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  )

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return res.status(500).json({ error: error.message })

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at,
    emailConfirmed: !!u.email_confirmed_at,
    provider: u.app_metadata?.provider || 'email',
  }))

  res.status(200).json({ users })
}
