import { NextRequest, NextResponse } from 'next/server'
import { checkIfFavorito } from '@/services/favoritos.service'
import { getUserByUid } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userResult = await getUserByUid(user.id)
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos' },
        { status: 404 },
      )
    }

    const userId = userResult.data.id_usuario
    const { id } = await params
    const saltoId = Number.parseInt(id)

    const result = await checkIfFavorito(userId, saltoId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error en /api/usuarios/favoritos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
