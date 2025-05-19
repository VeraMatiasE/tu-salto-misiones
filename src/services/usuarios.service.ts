import { createSupabaseClient } from "@/utils/supabase/server"
import type { Usuario, ApiResponse } from "@/types/database"

export async function getUsuarios(): Promise<ApiResponse<Usuario[]>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("usuarios").select("*").eq("estatus", true)

    if (error) throw error

    return {
      success: true,
      data: data as Usuario[],
    }
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al obtener usuarios",
    }
  }
}

export async function getUsuarioById(id: number): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id_usuario", id)
      .eq("estatus", true)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
    }
  } catch (error) {
    console.error(`Error al obtener usuario con ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al obtener usuario con ID ${id}`,
    }
  }
}

export async function getUsuarioByEmail(email: string): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("usuarios").select("*").eq("email", email).eq("estatus", true).single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
    }
  } catch (error) {
    console.error(`Error al obtener usuario con email ${email}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al obtener usuario con email ${email}`,
    }
  }
}

export async function createUsuario(
  usuario: Omit<Usuario, "id_usuario" | "fecha_registro" | "fecha_actualizacion">,
): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ ...usuario }])
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
      message: "Usuario creado exitosamente",
    }
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al crear usuario",
    }
  }
}

export async function updateUsuario(id: number, usuario: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("usuarios")
      .update({
        ...usuario,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id_usuario", id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
      message: "Usuario actualizado exitosamente",
    }
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al actualizar usuario con ID ${id}`,
    }
  }
}

export async function deleteUsuario(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()
    // Soft delete - solo actualizamos el estatus a false
    const { error } = await supabase
      .from("usuarios")
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id_usuario", id)

    if (error) throw error

    return {
      success: true,
      message: "Usuario eliminado exitosamente",
    }
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Error desconocido al eliminar usuario con ID ${id}`,
    }
  }
}
