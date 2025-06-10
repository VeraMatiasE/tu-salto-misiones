import { User } from '@supabase/supabase-js'

export type Usuario = {
  id_usuario: string
  nombre: string
  email: string
  rol: boolean
  fecha_registro: string
}

export interface UserProfile {
  intereses: string
  id: string
  email: string
  nombre?: string
  foto_perfil?: string
}

export interface UserData {
  user: User
  profile: UserProfile
}
