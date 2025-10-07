import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function GET(request: Request) {
  // clear the cookie
  await destroySession()

  // Redirect to /admin/login on the SAME origin as the request
  // (works on localhost and on Vercel)
  const url = new URL('/admin/login', request.url)
  return NextResponse.redirect(url)
}