import type { Metadata } from 'next'
import './globals.css'
import { createSupabaseClient } from '@/utils/supabase/server'
import AuthWrapper from '@/components/auth-wrapper'

export const metadata: Metadata = {
  title: 'Tu salto Misiones',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const isAuthenticated = !!data?.user

  return (
    <html lang="es">
      <body className="">
        <AuthWrapper isAuthenticated={isAuthenticated} user={data.user}>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}
