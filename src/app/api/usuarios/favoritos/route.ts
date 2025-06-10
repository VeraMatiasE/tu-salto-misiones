import { NextRequest, NextResponse } from 'next/server'
import {
  getFavoritosByUsuario,
  createFavorito,
  deleteFavorito,
  getFavoritoById,
} from '@/services/favoritos.service'
import { getUserByUid } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import type { PaginationParams } from '@/types/pagination'

interface CreateFavoritoRequest {
  id_destino: number
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

    const result = await getFavoritosByUsuario(userId, paginationParams)

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

    const body: CreateFavoritoRequest = await request.json()
    const { id_destino } = body

    if (!id_destino) {
      return NextResponse.json(
        { error: 'ID de destino es requerido' },
        { status: 400 },
      )
    }

    const result = await createFavorito({
      id_usuario: userId,
      id_destino,
      estatus: true,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        {
          status:
            result.error === 'Este destino ya está en tus favoritos'
              ? 409
              : 500,
        },
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error al crear favorito:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}

async function respondError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function getFavoritoIdFromParams(
  userId: number,
  favoritoIdParam: string | null,
  destinoIdParam: string | null,
) {
  if (favoritoIdParam) {
    const favoritoId = parseInt(favoritoIdParam)
    if (isNaN(favoritoId)) {
      return { error: await respondError('ID de favorito inválido', 400) }
    }
    return { favoritoId }
  }

  if (destinoIdParam) {
    const destinoId = parseInt(destinoIdParam)
    if (isNaN(destinoId)) {
      return { error: await respondError('ID de destino inválido', 400) }
    }

    const favoritosResult = await getFavoritosByUsuario(userId, {
      page: 1,
      limit: 1000,
      orderBy: 'fecha_actualizacion',
      orderDirection: 'desc',
    })

    if (!favoritosResult.success || !favoritosResult.data) {
      return { error: await respondError('Error al buscar favoritos', 500) }
    }

    const favorito = favoritosResult.data.data.find(
      (fav) => fav.id_destino === destinoId,
    )

    if (!favorito) {
      return { error: await respondError('Favorito no encontrado', 404) }
    }

    return { favoritoId: favorito.id_favorito }
  }

  return {
    error: await respondError('ID de favorito o ID de destino requerido', 400),
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
      return respondError('No autorizado', 401)
    }

    const userResult = await getUserByUid(user.id)
    if (!userResult.success || !userResult.data) {
      return respondError('Usuario no encontrado en la base de datos', 404)
    }

    const userId = userResult.data.id_usuario

    const { searchParams } = new URL(request.url)
    const favoritoIdParam = searchParams.get('favoritoId')
    const destinoIdParam = searchParams.get('destinoId')

    const { favoritoId, error } = await getFavoritoIdFromParams(
      userId,
      favoritoIdParam,
      destinoIdParam,
    )
    if (error) return error

    const existingFavoritoResult = await getFavoritoById(favoritoId)
    if (!existingFavoritoResult.success || !existingFavoritoResult.data) {
      return respondError('Favorito no encontrado', 404)
    }

    if (existingFavoritoResult.data.id_usuario !== userId) {
      return respondError('No tienes permisos para eliminar este favorito', 403)
    }

    const result = await deleteFavorito(favoritoId)
    if (!result.success) {
      return respondError(
        result.error ?? 'No se pudo eliminar el favorito',
        500,
      )
    }

    return NextResponse.json({ message: 'Favorito eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar favorito:', error)
    return respondError('Error interno del servidor', 500)
  }
}
