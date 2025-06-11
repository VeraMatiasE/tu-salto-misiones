import { createSupabaseClient } from '@/utils/supabase/server'
import type { Favorito, ApiResponse } from '@/types/database'
import {
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from '@/types/pagination'

export async function getFavoritos(
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Favorito[]>>> {
  try {
    const supabase = await createSupabaseClient()
    const {
      page = 1,
      limit = 10,
      search = '',
      orderBy = 'fecha_actualizacion',
      orderDirection = 'desc',
    } = params

    const offset = (page - 1) * limit

    let query = supabase
      .from('favoritos')
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil),
        destinos!inner(nombre, ubicacion)
      `,
        { count: 'exact' },
      )
      .eq('estatus', true)

    if (search.trim()) {
      query = query.or(
        `destinos.nombre.ilike.%${search}%,destinos.ubicacion.ilike.%${search}%`,
      )
    }

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    const pagination: PaginationMeta = {
      currentPage: page,
      totalPages,
      total: totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    return {
      success: true,
      data: {
        data: data as Favorito[],
        pagination,
      },
    }
  } catch (error) {
    console.error('Error al obtener favoritos:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener favoritos',
    }
  }
}

export async function getFavoritosByUsuario(
  usuarioId: number,
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Favorito[]>>> {
  try {
    const supabase = await createSupabaseClient()
    const {
      page = 1,
      limit = 10,
      search = '',
      orderBy = 'fecha_actualizacion',
      orderDirection = 'desc',
    } = params

    const offset = (page - 1) * limit

    let query = supabase
      .from('favoritos')
      .select(
        `
        *,
        destinos!inner(nombre, ubicacion)
      `,
        { count: 'exact' },
      )
      .eq('id_usuario', usuarioId)
      .eq('estatus', true)

    if (search.trim()) {
      query = query.or(
        `destinos.nombre.ilike.%${search}%,destinos.ubicacion.ilike.%${search}%`,
      )
    }

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    const pagination: PaginationMeta = {
      currentPage: page,
      totalPages,
      total: totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    return {
      success: true,
      data: {
        data: data as Favorito[],
        pagination,
      },
    }
  } catch (error) {
    console.error(`Error al obtener favoritos del usuario ${usuarioId}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener favoritos del usuario ${usuarioId}`,
    }
  }
}

export async function getFavoritosBySalto(
  saltoId: number,
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Favorito[]>>> {
  try {
    const supabase = await createSupabaseClient()
    const {
      page = 1,
      limit = 10,
      orderBy = 'fecha_actualizacion',
      orderDirection = 'desc',
    } = params

    const offset = (page - 1) * limit

    let query = supabase
      .from('favoritos')
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil)
      `,
        { count: 'exact' },
      )
      .eq('id_destino', saltoId)
      .eq('estatus', true)

    query = query
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    const totalCount = count ?? 0
    const totalPages = Math.ceil(totalCount / limit)

    const pagination: PaginationMeta = {
      currentPage: page,
      totalPages,
      total: totalCount,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    return {
      success: true,
      data: {
        data: data as Favorito[],
        pagination,
      },
    }
  } catch (error) {
    console.error(`Error al obtener favoritos del salto ${saltoId}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener favoritos del salto ${saltoId}`,
    }
  }
}

export async function createFavorito(
  favorito: Omit<Favorito, 'fecha_actualizacion' | 'fecha_registro'>,
): Promise<ApiResponse<Favorito>> {
  try {
    const supabase = await createSupabaseClient()

    const { data: existingFavorito, error: searchError } = await supabase
      .from('favoritos')
      .select('estatus')
      .eq('id_usuario', favorito.id_usuario)
      .eq('id_destino', favorito.id_destino)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError
    }

    if (existingFavorito) {
      if (existingFavorito.estatus === true) {
        return {
          success: false,
          error: 'Este salto ya está en tus favoritos',
        }
      } else {
        const { data: reactivatedData, error: updateError } = await supabase
          .from('favoritos')
          .update({
            estatus: true,
            fecha_actualizacion: new Date().toISOString(),
          })
          .eq('id_usuario', favorito.id_usuario)
          .eq('id_destino', favorito.id_destino)
          .select('*')
          .single()

        if (updateError) throw updateError

        return {
          success: true,
          data: reactivatedData as Favorito,
          message: 'Salto reactivado en favoritos exitosamente',
        }
      }
    }

    const { data, error } = await supabase
      .from('favoritos')
      .insert([
        {
          ...favorito,
          fecha_registro: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString(),
        },
      ])
      .select('*')
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Favorito,
      message: 'Salto agregado a favoritos exitosamente',
    }
  } catch (error) {
    console.error('Error al crear favorito:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear favorito',
    }
  }
}

export async function deleteFavorito(params: {
  id_usuario: number
  id_destino: number
}): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()

    const { data: existingFavorito, error: searchError } = await supabase
      .from('favoritos')
      .select('id_usuario, id_destino')
      .eq('id_usuario', params.id_usuario)
      .eq('id_destino', params.id_destino)
      .eq('estatus', true)
      .single()

    if (searchError && searchError.code !== 'PGRST116') {
      throw searchError
    }

    if (!existingFavorito) {
      return {
        success: false,
        error: 'Favorito no encontrado',
      }
    }

    const { error: updateError } = await supabase
      .from('favoritos')
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_usuario', existingFavorito.id_usuario)
      .eq('id_destino', existingFavorito.id_destino)

    if (updateError) throw updateError

    return {
      success: true,
      data: null,
      message: 'Favorito eliminado exitosamente',
    }
  } catch (error) {
    console.error('Error al eliminar favorito:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al eliminar favorito',
    }
  }
}

export async function checkIfFavorito(
  usuarioId: number,
  saltoId: number,
): Promise<ApiResponse<{ isFavorite: boolean; saltoId?: number }>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('favoritos')
      .select('id_usuario, id_destino')
      .eq('id_usuario', usuarioId)
      .eq('id_destino', saltoId)
      .eq('estatus', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return {
      success: true,
      data: {
        isFavorite: !!data,
        saltoId: data?.id_destino,
      },
    }
  } catch (error) {
    console.error(
      `Error al verificar favorito del usuario ${usuarioId} y salto ${saltoId}:`,
      error,
    )
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al verificar favorito del usuario ${usuarioId} y salto ${saltoId}`,
    }
  }
}
