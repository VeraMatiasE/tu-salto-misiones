import { getUserIdByUid, updateUsuario } from '@/services/usuarios.service'
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

    if (!user?.id) throw new Error(error?.message ?? 'Error')

    const body = await request.json()

    const { data: userData, error: errorUser } = await getUserIdByUid(user.id)

    if (errorUser || userData == undefined)
      throw new Error(error?.message ?? 'Error')

    const response = await updateUsuario(userData.id_usuario, body)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 400 },
    )
  }
}
