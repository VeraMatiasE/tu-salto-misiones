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

export async function getFavoritoById(
  id: number,
): Promise<ApiResponse<Favorito>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('favoritos')
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil),
        destinos!inner(nombre, ubicacion, descripcion)
      `,
      )
      .eq('id_favorito', id)
      .eq('estatus', true)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Favorito,
    }
  } catch (error) {
    console.error(`Error al obtener favorito con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener favorito con ID ${id}`,
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
  favorito: Omit<
    Favorito,
    'id_favorito' | 'fecha_actualizacion' | 'fecha_registro'
  >,
): Promise<ApiResponse<Favorito>> {
  try {
    const supabase = await createSupabaseClient()

    const { data: existingFavorito } = await supabase
      .from('favoritos')
      .select('id_favorito')
      .eq('id_usuario', favorito.id_usuario)
      .eq('id_destino', favorito.id_destino)
      .eq('estatus', true)
      .single()

    if (existingFavorito) {
      return {
        success: false,
        error: 'Este salto ya está en tus favoritos',
      }
    }

    const { data, error } = await supabase
      .from('favoritos')
      .insert([{ ...favorito }])
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil),
        destinos!inner(nombre, ubicacion, descripcion)
      `,
      )
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

export async function deleteFavorito(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
      .from('favoritos')
      .update({
        estatus: false,
      })
      .eq('id_favorito', id)

    if (error) throw error

    return {
      success: true,
      message: 'Favorito eliminado exitosamente',
    }
  } catch (error) {
    console.error(`Error al eliminar favorito con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al eliminar favorito con ID ${id}`,
    }
  }
}

export async function deleteFavoritoByUsuarioYSalto(
  usuarioId: number,
  saltoId: number,
): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
      .from('favoritos')
      .update({
        estatus: false,
      })
      .eq('id_usuario', usuarioId)
      .eq('id_destino', saltoId)
      .eq('estatus', true)

    if (error) throw error

    return {
      success: true,
      message: 'Favorito eliminado exitosamente',
    }
  } catch (error) {
    console.error(
      `Error al eliminar favorito del usuario ${usuarioId} y salto ${saltoId}:`,
      error,
    )
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al eliminar favorito del usuario ${usuarioId} y salto ${saltoId}`,
    }
  }
}

export async function checkIfFavorito(
  usuarioId: number,
  saltoId: number,
): Promise<ApiResponse<{ esFavorito: boolean; favoritoId?: number }>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('favoritos')
      .select('id_favorito')
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
        esFavorito: !!data,
        favoritoId: data?.id_favorito,
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

export async function getContadorFavoritosSalto(
  saltoId: number,
): Promise<ApiResponse<{ totalFavoritos: number }>> {
  try {
    const supabase = await createSupabaseClient()
    const { count, error } = await supabase
      .from('favoritos')
      .select('*', { count: 'exact', head: true })
      .eq('id_destino', saltoId)
      .eq('estatus', true)

    if (error) throw error

    return {
      success: true,
      data: {
        totalFavoritos: count ?? 0,
      },
    }
  } catch (error) {
    console.error(`Error al contar favoritos del salto ${saltoId}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al contar favoritos del salto ${saltoId}`,
    }
  }
}
