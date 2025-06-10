import { NextRequest, NextResponse } from 'next/server'
import {
  getResenasByUsuario,
  createResena,
  updateResena,
  deleteResena,
  getResenaById,
} from '@/services/resenas.service'
import { getUserByUid } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import type { PaginationParams } from '@/types/pagination'

interface CreateResenaRequest {
  id_destino: number
  calificacion: number
  comentario?: string
}

interface UpdateResenaRequest {
  id_resena: number
  calificacion: number
  comentario?: string
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const paginationParams: PaginationParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10,
      orderBy: searchParams.has('orderBy')
        ? searchParams.get('orderBy')!
        : 'fecha_actualizacion',
      orderDirection:
        (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc',
    }

    const result = await getResenasByUsuario(userId, paginationParams)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error en /api/usuarios/resenas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body: CreateResenaRequest = await request.json()
    const { id_destino, calificacion, comentario } = body

    if (!id_destino || !calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        {
          error:
            'Datos de reseña inválidos. La calificación debe estar entre 1 y 5.',
        },
        { status: 400 },
      )
    }

    const result = await createResena({
      id_usuario: userId,
      id_destino,
      calificacion,
      comentario: comentario ?? '',
      estatus: true,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        {
          status:
            result.error === 'Ya tienes una reseña para este salto' ? 409 : 500,
        },
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error al crear reseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body: UpdateResenaRequest = await request.json()
    const { id_resena, calificacion, comentario } = body

    if (!id_resena || !calificacion || calificacion < 1 || calificacion > 5) {
      return NextResponse.json(
        {
          error:
            'Datos de reseña inválidos. La calificación debe estar entre 1 y 5.',
        },
        { status: 400 },
      )
    }

    const existingReviewResult = await getResenaById(id_resena)
    if (!existingReviewResult.success || !existingReviewResult.data) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 },
      )
    }

    if (existingReviewResult.data.id_usuario !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta reseña' },
        { status: 403 },
      )
    }

    const result = await updateResena(id_resena, {
      calificacion,
      comentario: comentario ?? '',
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error al actualizar reseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const resenaIdParam = searchParams.get('reseñaId')

    if (!resenaIdParam) {
      return NextResponse.json(
        { error: 'ID de reseña requerido' },
        { status: 400 },
      )
    }

    const resenaId = parseInt(resenaIdParam)
    if (isNaN(resenaId)) {
      return NextResponse.json(
        { error: 'ID de reseña inválido' },
        { status: 400 },
      )
    }

    const existingReviewResult = await getResenaById(resenaId)
    if (!existingReviewResult.success || !existingReviewResult.data) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 },
      )
    }

    if (existingReviewResult.data.id_usuario !== userId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta reseña' },
        { status: 403 },
      )
    }

    const result = await deleteResena(resenaId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: 'Reseña eliminada exitosamente' })
  } catch (error) {
    console.error('Error al eliminar reseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
