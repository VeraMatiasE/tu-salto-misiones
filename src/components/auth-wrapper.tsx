'use client'

import { User } from '@supabase/supabase-js'
import { createContext, useContext, useMemo } from 'react'

type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
})

export function useAuth() {
  return useContext(AuthContext)
}

type AuthWrapperProps = Readonly<{
  isAuthenticated: boolean
  user: User | null
  children: React.ReactNode
}>

export default function AuthWrapper({
  isAuthenticated,
  user,
  children,
}: AuthWrapperProps) {
  const value = useMemo(
    () => ({ isAuthenticated, user }),
    [isAuthenticated, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
