import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const protectedRoutes = ['/profile']
  const authRoutes = ['/log-in', '/sign-up']
  const adminRoutes = ['/dashboard']

  const currentPath = new URL(request.url).pathname
  const { response, user, supabase } = await updateSession(request)

  if (protectedRoutes.includes(currentPath) && !user) {
    return NextResponse.redirect(new URL('/log-in', request.url))
  }

  if (authRoutes.includes(currentPath) && user) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  if (adminRoutes.some((route) => currentPath.startsWith(route))) {
    if (!user) {
      return NextResponse.redirect(new URL('/log-in', request.url))
    }

    const { data: userProfile, error } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('uid_usuario', user.id)
      .single()

    if (error || !userProfile?.rol) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
