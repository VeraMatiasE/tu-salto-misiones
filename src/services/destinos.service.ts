import { createSupabaseClient } from '@/utils/supabase/server'
import type { ApiResponse, Destino } from '@/types/database'
import {
  SaltoFilters,
  SaltosDestacados,
  SaltosFiltersOptions,
  SaltoWithExtras,
} from '@/types/salto'
import { PaginatedResponse, PaginationMeta } from '@/types/pagination'

export async function getDestinosDestacados(): Promise<
  ApiResponse<SaltosDestacados[]>
> {
  try {
    const supabase = await createSupabaseClient()
    const { data: dataSalto, error: errorSalto } = await supabase
      .from('destinos')
      .select('id_destino, nombre, ubicacion')
      .eq('estatus', true)
      .limit(6)

    if (errorSalto) throw errorSalto
    if (!dataSalto || dataSalto.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    const destinosConImagenes: SaltosDestacados[] = []

    for (const salto of dataSalto) {
      const { data: dataImagen } = await supabase
        .from('imagenes_destino')
        .select('id_imagen, public_id')
        .eq('id_destino', salto.id_destino)
        .eq('estatus', true)
        .limit(1)
        .single()

      destinosConImagenes.push({
        ...salto,
        public_id: dataImagen?.public_id,
      })
    }

    return {
      success: true,
      data: destinosConImagenes,
    }
  } catch (error) {
    console.error('Error al obtener destinos:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener destinos',
    }
  }
}

function applySearchFilter(query, search: string) {
  return query.or(
    `nombre.ilike.%${search}%,ubicacion.ilike.%${search}%,descripcion.ilike.%${search}%`,
  )
}

export async function getDestinos(
  filters?: SaltoFilters,
): Promise<ApiResponse<PaginatedResponse<SaltoWithExtras[]>>> {
  try {
    const supabase = await createSupabaseClient()
    let query = supabase
      .from('destinos')
      .select(
        `
        *,
        imagenes_destino(public_id),
        resenas(calificacion)
      `,
      )
      .eq('estatus', true)

    if (filters?.search) {
      query = applySearchFilter(query, filters.search)
    }

    if (filters?.ubicaciones && filters.ubicaciones.length > 0) {
      query = query.in('ubicacion', filters.ubicaciones)
    }

    if (filters?.dificultades && filters.dificultades.length > 0) {
      query = query.in('dificultad', filters.dificultades)
    }

    const { data: rawData, error } = await query

    if (error) throw error

    if (!rawData) {
      return {
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: filters?.page ?? 1,
            limit: filters?.limit ?? 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      }
    }

    const processedData = rawData.map((destino) => {
      const ratings =
        destino.resenas?.map((resena) => resena.calificacion) ?? []
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum: number, rating: number) => sum + rating, 0)
            / ratings.length
          : 0

      const firstImage = destino.imagenes_destino?.[0]?.public_id ?? null

      let infraestructura: string[] = []
      try {
        infraestructura = JSON.parse(destino.infraestructura)
      } catch {
        console.warn(
          'Infraestructura no es un JSON válido:',
          destino.infraestructura,
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { resenas, imagenes_destino, ...cleanDestino } = destino

      return {
        ...cleanDestino,
        infraestructura,
        puntuacion: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        public_id: firstImage,
      } as SaltoWithExtras
    })

    let filteredData = processedData
    if (filters?.puntuacionMin !== undefined) {
      filteredData = filteredData.filter(
        (destino) => destino.puntuacion >= filters.puntuacionMin!,
      )
    }
    if (filters?.puntuacionMax !== undefined) {
      filteredData = filteredData.filter(
        (destino) => destino.puntuacion <= filters.puntuacionMax!,
      )
    }
    if (filters?.servicios && filters.servicios.length > 0) {
      filteredData = filteredData.filter((destino) =>
        filters.servicios!.every((servicio) =>
          destino?.infraestructura?.includes(servicio),
        ),
      )
    }

    // Apply sorting
    if (filters?.sortBy) {
      filteredData.sort((a, b) => {
        switch (filters.sortBy) {
          case 'nombre_asc':
            return a.nombre.localeCompare(b.nombre)
          case 'nombre_desc':
            return b.nombre.localeCompare(a.nombre)
          case 'puntuacion_desc':
            return b.puntuacion - a.puntuacion
          case 'puntuacion_asc':
            return a.puntuacion - b.puntuacion
          case 'dificultad_asc': {
            const difficultyOrder = {
              baja: 1,
              media: 2,
              alta: 3,
              extrema: 4,
            }
            return difficultyOrder[a.dificultad] - difficultyOrder[b.dificultad]
          }
          default:
            return a.nombre.localeCompare(b.nombre)
        }
      })
    }

    // Apply pagination
    const page = filters?.page ?? 1
    const limit = filters?.limit ?? 100
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filteredData.slice(startIndex, endIndex)
    const total = filteredData.length
    const totalPages = Math.ceil(total / limit)

    const pagination: PaginationMeta = {
      currentPage: page,
      totalPages,
      total,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    return {
      success: true,
      data: {
        data: paginatedData,
        pagination,
      },
    }
  } catch (error) {
    console.error('Error al obtener destinos:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener destinos',
    }
  }
}

export async function getFilterOptions(): Promise<
  ApiResponse<SaltosFiltersOptions>
> {
  try {
    const supabase = await createSupabaseClient()

    const { data: ubicacionesData, error: ubicacionesError } = await supabase
      .from('destinos')
      .select('ubicacion')
      .eq('estatus', true)
      .not('ubicacion', 'is', null)

    if (ubicacionesError) throw ubicacionesError

    const { data: serviciosData, error: serviciosError } = await supabase
      .from('destinos')
      .select('infraestructura')
      .eq('estatus', true)
      .not('infraestructura', 'is', null)

    if (serviciosError) throw serviciosError

    const ubicaciones = [
      ...new Set(
        ubicacionesData?.map((item) => item.ubicacion).filter(Boolean) || [],
      ),
    ].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

    const allServicios =
      serviciosData?.flatMap((item) => {
        try {
          return item.infraestructura ? JSON.parse(item.infraestructura) : []
        } catch {
          return []
        }
      }) || []

    const servicios = [...new Set(allServicios)].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    )

    const dificultades = ['baja', 'media', 'alta', 'extrema']

    return {
      success: true,
      data: {
        ubicaciones,
        dificultades,
        servicios,
      },
    }
  } catch (error) {
    console.error('Error al obtener opciones de filtros:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener opciones de filtros',
    }
  }
}

export async function getDestinoById(
  id: number,
): Promise<ApiResponse<Destino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('destinos')
      .select('*')
      .eq('id_destino', id)
      .eq('estatus', true)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Destino,
    }
  } catch (error) {
    console.error(`Error al obtener destino con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener destino con ID ${id}`,
    }
  }
}

export async function createDestino(
  destino: Omit<
    Destino,
    'id_destino' | 'fecha_registro' | 'fecha_actualizacion'
  >,
): Promise<ApiResponse<Destino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('destinos')
      .insert([{ ...destino }])
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Destino,
      message: 'Destino creado exitosamente',
    }
  } catch (error) {
    console.error('Error al crear destino:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear destino',
    }
  }
}

export async function updateDestino(
  id: number,
  destino: Partial<Destino>,
): Promise<ApiResponse<Destino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('destinos')
      .update({
        ...destino,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_destino', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Destino,
      message: 'Destino actualizado exitosamente',
    }
  } catch (error) {
    console.error(`Error al actualizar destino con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al actualizar destino con ID ${id}`,
    }
  }
}

export async function deleteDestino(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()
    // Soft delete - solo actualizamos el estatus a false
    const { error } = await supabase
      .from('destinos')
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_destino', id)

    if (error) throw error

    return {
      success: true,
      message: 'Destino eliminado exitosamente',
    }
  } catch (error) {
    console.error(`Error al eliminar destino con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al eliminar destino con ID ${id}`,
    }
  }
}

export async function searchDestinos(
  query: string,
): Promise<ApiResponse<Destino[]>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('destinos')
      .select('*')
      .or(
        `nombre.ilike.%${query}%,descripcion.ilike.%${query}%,ubicacion.ilike.%${query}%`,
      )
      .eq('estatus', true)

    if (error) throw error

    return {
      success: true,
      data: data as Destino[],
    }
  } catch (error) {
    console.error(`Error al buscar destinos con query "${query}":`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al buscar destinos con query "${query}"`,
    }
  }
}
