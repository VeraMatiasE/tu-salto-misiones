import { NextRequest, NextResponse } from 'next/server'
import { getUserProfile, createSupabaseClient } from '@/utils/supabase/server'
import { updateUsuario } from '@/services/usuarios.service'

export async function PUT(request: NextRequest) {
  try {
    const userProfile = await getUserProfile()

    if (!userProfile) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { nuevoEmail, password } = await request.json()

    const supabase = await createSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userProfile.profile.email,
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 },
      )
    }

    if (!nuevoEmail || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.updateUser({
      email: nuevoEmail,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await updateUsuario(userProfile.profile.id_usuario, {
      email: nuevoEmail,
    })

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
