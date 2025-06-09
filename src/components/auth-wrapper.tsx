'use client'

import { User } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

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

export default function AuthWrapper({
  isAuthenticated,
  user,
  children,
}: {
  isAuthenticated: boolean
  user: User | null
  children: React.ReactNode
}) {
  return (
    <AuthContext.Provider value={{ isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}
