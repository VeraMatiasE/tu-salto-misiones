import { NextRequest, NextResponse } from 'next/server'
import { createResena, getResenasBySalto } from '@/services/resenas.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { getUserIdByUid } from '@/services/usuarios.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const parsedId = Number.parseInt(id)
    const response = await getResenasBySalto(parsedId)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error la calificación:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const parsedId = Number.parseInt(id)

    const supabase = await createSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) throw new Error('Error en la autenticación del usuario')

    const resultUserRequest = await getUserIdByUid(user.id)

    if (!resultUserRequest.success || !resultUserRequest?.data)
      throw new Error('Error en la autenticación del usuario')

    const userId = resultUserRequest.data?.id_usuario
    const { puntuacion, comentario } = await request.json()

    const resultCreationResena = await createResena({
      calificacion: puntuacion,
      comentario,
      id_usuario: userId,
      id_destino: parsedId,
      estatus: true,
    })

    if (!resultCreationResena.success)
      throw new Error('Error en la creación del comentario')

    return NextResponse.json(resultCreationResena, { status: 201 })
  } catch (error) {
    console.error('Error en subir el comentario:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
