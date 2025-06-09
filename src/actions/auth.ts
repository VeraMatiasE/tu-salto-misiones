'use server'

import { createUsuario } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import z from 'zod'

const signUpSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .email('Ingresa un email válido')
      .transform((email) => email.toLowerCase().trim()),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    repeatPassword: z.string(),
    nombre: z.string().optional(),
    rol: z.union([z.literal('true'), z.literal('false')]).optional(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    path: ['repeatPassword'],
    message: 'Las contraseñas no coinciden',
  })

interface SignUpActionResult {
  success: boolean
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
    repeatPassword?: string[]
  }
}

export async function signUp(formData: FormData): Promise<SignUpActionResult> {
  try {
    const validationResult = signUpSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      repeatPassword: formData.get('repeatPassword'),
      nombre: formData.get('nombre'),
      rol: formData.get('rol'),
    })

    if (!validationResult.success) {
      return {
        success: false,
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    const { email, password, nombre, rol } = validationResult.data
    const supabase = await createSupabaseClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError || !authData?.user?.email) {
      console.error('Error en autenticación:', authError)
      return {
        success: false,
        error: 'No se pudo registrar el usuario',
      }
    }

    const { error: dbError } = await createUsuario({
      nombre: nombre ?? '',
      email: authData.user.email,
      rol: rol === 'true',
      uid_usuario: authData.user.id,
      contrasena: '',
      foto_perfil: null,
      intereses: null,
      estatus: true,
    })

    if (dbError) {
      console.error('Error creando usuario en tabla:', dbError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: 'Error al guardar los datos del usuario',
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error inesperado en registro:', error)
    return {
      success: false,
      error: 'Ocurrió un error inesperado. Intenta nuevamente.',
    }
  }
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

interface LoginActionResult {
  success: boolean
  error?: string
  fieldErrors?: {
    email?: string[]
    password?: string[]
  }
}

export async function logIn(formData: FormData): Promise<LoginActionResult> {
  try {
    const validationResult = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    if (!validationResult.success) {
      return {
        success: false,
        fieldErrors: validationResult.error.flatten().fieldErrors,
      }
    }

    const { email, password } = validationResult.data

    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      let errorMessage = 'Error al iniciar sesión'

      switch (error.message) {
        case 'Invalid login credentials':
          errorMessage = 'Email o contraseña incorrectos'
          break
        case 'Email not confirmed':
          errorMessage = 'Por favor confirma tu email antes de iniciar sesión'
          break
        case 'Too many requests':
          errorMessage =
            'Demasiados intentos. Intenta nuevamente en unos minutos'
          break
        default:
          errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No se pudo autenticar el usuario',
      }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error inesperado en login:', error)
    return {
      success: false,
      error: 'Ocurrió un error inesperado. Intenta nuevamente.',
    }
  }
}

export async function logOut() {
  const supabase = await createSupabaseClient()
  const { error } = await supabase.auth.signOut()
  if (error) redirect('/error')
  revalidatePath('/', 'layout')
  redirect('/')
}
