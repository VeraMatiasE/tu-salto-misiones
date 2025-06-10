import { createSupabaseClient } from '@/utils/supabase/server'
import type { Resena, ApiResponse } from '@/types/database'
import {
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from '@/types/pagination'

export async function getResenas(
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Resena[]>>> {
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
      .from('resenas')
      .select(
        `
        *,
        usuarios!inner(nombre, foro_perfil),
        destinos!inner(nombre, ubicacion)
      `,
        { count: 'exact' },
      )
      .eq('estatus', true)

    if (search.trim()) {
      query = query.or(
        `comentario.ilike.%${search}%,destinos.nombre.ilike.%${search}%`,
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
        data: data as Resena[],
        pagination,
      },
    }
  } catch (error) {
    console.error('Error al obtener reseñas:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener reseñas',
    }
  }
}

export async function getResenaById(id: number): Promise<ApiResponse<Resena>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('resenas')
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil),
        destinos!inner(nombre, ubicacion)
      `,
      )
      .eq('id_resena', id)
      .eq('estatus', true)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Resena,
    }
  } catch (error) {
    console.error(`Error al obtener reseña con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener reseña con ID ${id}`,
    }
  }
}

export async function getResenasByUsuario(
  usuarioId: number,
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Resena[]>>> {
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
      .from('resenas')
      .select(
        `
        *,
        destinos!inner(nombre, ubicacion)
      `,
        { count: 'exact' },
      )
      .eq('id_usuario', usuarioId)
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
        data: data as Resena[],
        pagination,
      },
    }
  } catch (error) {
    console.error(`Error al obtener reseñas del usuario ${usuarioId}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener reseñas del usuario ${usuarioId}`,
    }
  }
}

export async function getResenasBySalto(
  saltoId: number,
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Resena[]>>> {
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
      .from('resenas')
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
        data: data as Resena[],
        pagination,
      },
    }
  } catch (error) {
    console.error(`Error al obtener reseñas del salto ${saltoId}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener reseñas del salto ${saltoId}`,
    }
  }
}

export async function createResena(
  resena: Omit<Resena, 'id_resena' | 'fecha_registro' | 'fecha_actualizacion'>,
): Promise<ApiResponse<Resena>> {
  try {
    const supabase = await createSupabaseClient()

    const { data: existingResena } = await supabase
      .from('resenas')
      .select('id_resena')
      .eq('id_usuario', resena.id_usuario)
      .eq('estatus', true)
      .single()

    if (existingResena) {
      return {
        success: false,
        error: 'Ya tienes una reseña para este salto',
      }
    }

    const { data, error } = await supabase
      .from('resenas')
      .insert([{ ...resena }])
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil),
        destinos!inner(nombre, ubicacion)
      `,
      )
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Resena,
      message: 'Reseña creada exitosamente',
    }
  } catch (error) {
    console.error('Error al crear reseña:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear reseña',
    }
  }
}

export async function updateResena(
  id: number,
  resena: Partial<Resena>,
): Promise<ApiResponse<Resena>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('resenas')
      .update({
        ...resena,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_resena', id)
      .select(
        `
        *,
        usuarios!inner(nombre, foto_perfil),
        destinos!inner(nombre, ubicacion)
      `,
      )
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Resena,
      message: 'Reseña actualizada exitosamente',
    }
  } catch (error) {
    console.error(`Error al actualizar reseña con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al actualizar reseña con ID ${id}`,
    }
  }
}

export async function deleteResena(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()

    const { error } = await supabase
      .from('resenas')
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_resena', id)

    if (error) throw error

    return {
      success: true,
      message: 'Reseña eliminada exitosamente',
    }
  } catch (error) {
    console.error(`Error al eliminar reseña con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al eliminar reseña con ID ${id}`,
    }
  }
}

export async function getPromedioCalificacionSalto(
  saltoId: number,
): Promise<ApiResponse<{ promedio: number; totalResenas: number }>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('resenas')
      .select('calificacion')
      .eq('id_destino', saltoId)
      .eq('estatus', true)

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        success: true,
        data: { promedio: 0, totalResenas: 0 },
      }
    }

    const totalCalificaciones = data.reduce(
      (sum, resena) => sum + resena.calificacion,
      0,
    )
    const promedio = totalCalificaciones / data.length

    return {
      success: true,
      data: {
        promedio: Math.round(promedio * 10) / 10, // Redondear a 1 decimal
        totalResenas: data.length,
      },
    }
  } catch (error) {
    console.error(
      `Error al calcular promedio de calificación del salto ${saltoId}:`,
      error,
    )
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al calcular promedio de calificación del salto ${saltoId}`,
    }
  }
}
