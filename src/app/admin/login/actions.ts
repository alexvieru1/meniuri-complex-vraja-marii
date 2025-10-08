'use server'

import { redirect } from 'next/navigation'
import { createSession } from '@/lib/auth'

// Single-argument server action compatible with <form action={loginAction}>
export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  // Validate against environment credentials
  if (email !== (process.env.ADMIN_EMAIL || '') || password !== (process.env.ADMIN_PASS || '')) {
    // Redirect back to login with an error flag in the URL
    redirect('/admin/login?e=1')
  }

  // Create the session cookie server-side and redirect
  await createSession(email)
  redirect('/admin/dishes')
}