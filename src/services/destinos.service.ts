import { createSupabaseClient } from "@/utils/supabase/server"
import type { ApiResponse, Destino } from "@/types/database"
import { SaltosDestacados } from "@/types/salto"

export async function getDestinosDestacados(): 
  Promise<ApiResponse<SaltosDestacados[]>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: dataSalto, error: errorSalto } = await supabase.from("destinos")
      .select("id_destino, nombre, ubicacion")
      .eq("estatus", true)
      .limit(6)
      
    if (errorSalto) throw errorSalto
    if (!dataSalto || dataSalto.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    const destinosConImagenes: SaltosDestacados[] = []

    for (const salto of dataSalto) {
      const { data: dataImagen, error: errorImagen } = await supabase
        .from("imagenes_destino")
        .select("id_imagen, url_imagen")
        .eq("id_destino", salto.id_destino)
        .eq("estatus", true)
        .limit(1)
        .single()

      if (errorImagen) {
        console.warn(`No se encontró imagen para destino ${salto.id_destino}:`, errorImagen)
      }

      destinosConImagenes.push({
        ...salto,
        url_imagen: dataImagen?.url_imagen,
      })
    }

    return {
      success: true,
      data: destinosConImagenes,
    }
  } catch (error) {
    console.error("Error al obtener destinos:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener destinos",
    }
  }
}

export async function getDestinos(): Promise<ApiResponse<Destino[]>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("destinos").select("*").eq("estatus", true)

    if (error) throw error

    return {
      success: true,
      data: data as Destino[],
    }
  } catch (error) {
    console.error("Error al obtener destinos:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener destinos",
    }
  }
}

export async function getDestinoById(id: number): Promise<ApiResponse<Destino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("destinos")
      .select("*")
      .eq("id_destino", id)
      .eq("estatus", true)
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
      error: error instanceof Error ? error.message : `Error desconocido al obtener destino con ID ${id}`,
    }
  }
}

export async function createDestino(
  destino: Omit<Destino, "id_destino" | "fecha_registro" | "fecha_actualizacion">,
): Promise<ApiResponse<Destino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("destinos")
      .insert([{ ...destino }])
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Destino,
      message: "Destino creado exitosamente",
    }
  } catch (error) {
    console.error("Error al crear destino:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al crear destino",
    }
  }
}

export async function updateDestino(id: number, destino: Partial<Destino>): Promise<ApiResponse<Destino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("destinos")
      .update({
        ...destino,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id_destino", id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Destino,
      message: "Destino actualizado exitosamente",
    }
  } catch (error) {
    console.error(`Error al actualizar destino con ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al actualizar destino con ID ${id}`,
    }
  }
}

export async function deleteDestino(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()
    // Soft delete - solo actualizamos el estatus a false
    const { error } = await supabase
      .from("destinos")
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id_destino", id)

    if (error) throw error

    return {
      success: true,
      message: "Destino eliminado exitosamente",
    }
  } catch (error) {
    console.error(`Error al eliminar destino con ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al eliminar destino con ID ${id}`,
    }
  }
}

export async function searchDestinos(query: string): Promise<ApiResponse<Destino[]>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("destinos")
      .select("*")
      .or(`nombre.ilike.%${query}%,descripcion.ilike.%${query}%,ubicacion.ilike.%${query}%`)
      .eq("estatus", true)

    if (error) throw error

    return {
      success: true,
      data: data as Destino[],
    }
  } catch (error) {
    console.error(`Error al buscar destinos con query "${query}":`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al buscar destinos con query "${query}"`,
    }
  }
}
