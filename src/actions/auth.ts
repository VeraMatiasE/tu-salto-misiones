'use server'

import { createUsuario } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseClient()
  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    repeatPassword: formData.get('repeatPassword') as string,
  }
  if (credentials.password !== credentials.repeatPassword) redirect('/error')

  try {
    const { data: authData, error: authError } =
      await supabase.auth.signUp(credentials)

    if (authError) {
      console.error('Error en autenticación:', authError)
      redirect('/error')
    }

    if (!authData || !authData.user || !authData.user.email) {
      redirect('/error')
    }

    const { error: dbError } = await createUsuario({
      nombre:
        formData.get('nombre') == null
          ? ''
          : (formData.get('nombre') as string),
      email: authData.user.email,
      rol:
        formData.get('rol') == null || formData.get('rol') == 'false'
          ? false
          : true,
      uid_usuario: authData.user.id,
      contrasena: '',
      foto_perfil: null,
      intereses: null,
      estatus: true,
    })

    if (dbError) {
      console.error('Error creando usuario en tabla:', dbError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      redirect('/error')
    }

    revalidatePath('/', 'layout')
    redirect('/profile')
  } catch (error) {
    console.error('Error inesperado:', error)
    redirect('/error')
  }
}

export async function logIn(formData: FormData) {
  const supabase = await createSupabaseClient()
  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(credentials)
  if (error) redirect('/error')
  revalidatePath('/', 'layout')
  redirect('/profile')
}

export async function logOut() {
  const supabase = await createSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) redirect('/error')
  revalidatePath('/', 'layout')
  redirect('/')
}
