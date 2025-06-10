import {
  getUserByUid,
  updateUserAvatar,
  updateUsuario,
} from '@/services/usuarios.service'
import { createSupabaseClient, getUserProfile } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const userProfile = await getUserProfile()

    if (!userProfile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json(userProfile)
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (!user?.id) throw new Error(error?.message ?? 'Error de autenticación')

    const body = await request.json()
    const { data: userData, error: errorUser } = await getUserByUid(user.id)

    if (errorUser || userData == undefined) {
      throw new Error(errorUser ?? 'Error al obtener datos del usuario')
    }

    if (body.foto_perfil && body.foto_perfil !== userData.foto_perfil) {
      const avatarResult = await updateUserAvatar(
        userData.id_usuario,
        body.foto_perfil,
      )

      if (!avatarResult.success) {
        return NextResponse.json({ error: avatarResult.error }, { status: 400 })
      }
    }

    const updateData = {
      nombre: body.nombre,
      intereses: body.intereses,
    }

    const response = await updateUsuario(userData.id_usuario, updateData)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 },
    )
  }
}
