import { createSupabaseClient } from '@/utils/supabase/server'
import type { Usuario, ApiResponse } from '@/types/database'
import {
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from '@/types/pagination'
import cloudinary from '@/lib/cloudnary'
import { UploadApiResponse } from 'cloudinary'

export async function getUsuarios(
  params: PaginationParams = {},
): Promise<ApiResponse<PaginatedResponse<Usuario[]>>> {
  try {
    const supabase = await createSupabaseClient()
    const {
      page = 1,
      limit = 10,
      search = '',
      orderBy = 'fecha_registro',
      orderDirection = 'desc',
    } = params

    const offset = (page - 1) * limit

    let query = supabase
      .from('usuarios')
      .select('*', { count: 'exact' })
      .eq('estatus', true)

    // Aplicar búsqueda si existe
    if (search.trim()) {
      query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Aplicar ordenamiento y paginación
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
        data: data as Usuario[],
        pagination,
      },
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener usuarios',
    }
  }
}

export async function getUsuarioById(
  id: number,
): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', id)
      .eq('estatus', true)
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
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener usuario con ID ${id}`,
    }
  }
}

export async function getUsuarioByEmail(
  email: string,
): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('estatus', true)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
    }
  } catch (error) {
    console.error(`Error al obtener usuario con email ${email}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener usuario con email ${email}`,
    }
  }
}

export async function getUserByUid(
  uid_usuario: string,
): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('uid_usuario', uid_usuario)
      .eq('estatus', true)
      .single()

    if (error) {
      console.error('Error al obtener usuario por UID:', error)
      return {
        success: false,
        error: 'Error al obtener datos del usuario',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      }
    }

    return {
      success: true,
      data: data as Usuario,
    }
  } catch (error) {
    console.error('Error en getUserByUid:', error)
    return {
      success: false,
      error: 'Error interno al obtener usuario',
    }
  }
}

export async function getUserIdByUid(
  uid_usuario: string,
): Promise<ApiResponse<Pick<Usuario, 'id_usuario'>>> {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('uid_usuario', uid_usuario)
      .eq('estatus', true)
      .single()

    if (error) {
      console.error('Error al obtener el ID:', error)
      return {
        success: false,
        error: 'Error al obtener datos del usuario',
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      }
    }

    return {
      success: true,
      data: data,
    }
  } catch (error) {
    console.error('Error en getUserByUid:', error)
    return {
      success: false,
      error: 'Error interno al obtener usuario',
    }
  }
}

export async function createUsuario(
  usuario: Omit<
    Usuario,
    'id_usuario' | 'fecha_registro' | 'fecha_actualizacion'
  >,
): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ ...usuario }])
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
      message: 'Usuario creado exitosamente',
    }
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear usuario',
    }
  }
}

export async function updateUsuario(
  id: number,
  usuario: Partial<Usuario>,
): Promise<ApiResponse<Usuario>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('usuarios')
      .update({
        ...usuario,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_usuario', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as Usuario,
      message: 'Usuario actualizado exitosamente',
    }
  } catch (error) {
    console.error(`Error al actualizar usuario con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al actualizar usuario con ID ${id}`,
    }
  }
}

export async function deleteUsuario(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()
    // Soft delete - solo actualizamos el estatus a false
    const { error } = await supabase
      .from('usuarios')
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_usuario', id)

    if (error) throw error

    return {
      success: true,
      message: 'Usuario eliminado exitosamente',
    }
  } catch (error) {
    console.error(`Error al eliminar usuario con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al eliminar usuario con ID ${id}`,
    }
  }
}

interface AvatarData {
  public_id: string
  imageUrl: string
}

interface AvatarUpdateData {
  oldPublicId?: string
  newPublicId: string
  imageUrl: string
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error
  const message = typeof error === 'string' ? error : JSON.stringify(error)
  return new Error(message)
}

export async function uploadAvatarToCloudinary(
  image: File,
  userId: number,
): Promise<ApiResponse<AvatarData>> {
  try {
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const cloudinaryResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `avatar/${userId}`,
            resource_type: 'image',
            transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) {
              const safeError: Error = normalizeError(error)
              reject(safeError)
              return
            }
            if (!result) {
              reject(new Error('No se recibió respuesta de Cloudinary'))
              return
            }
            resolve(result)
          },
        )
        stream.end(buffer)
      },
    )

    const imageData = {
      public_id: cloudinaryResult.public_id,
      imageUrl: cloudinaryResult.url,
    }

    return {
      success: true,
      data: imageData,
      message: 'Imagen subida exitosamente a Cloudinary',
    }
  } catch (error) {
    console.error('Error al subir imagen a Cloudinary:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al subir imagen',
    }
  }
}

export async function updateUserAvatar(
  userId: number,
  newPublicId: string,
): Promise<ApiResponse<AvatarUpdateData>> {
  try {
    const supabase = await createSupabaseClient()

    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('foto_perfil')
      .eq('id_usuario', userId)
      .single()

    console.log(existingUser)
    const oldPublicId = existingUser?.foto_perfil

    const { error } = await supabase
      .from('usuarios')
      .update({ foto_perfil: newPublicId })
      .eq('id_usuario', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Error al actualizar avatar: ${error.message}`)
    }

    if (oldPublicId && oldPublicId !== newPublicId) {
      try {
        console.log('Destoing: ', oldPublicId)
        const test = await cloudinary.uploader.destroy(oldPublicId)
        console.log('Yes, deleted: ', test)
      } catch (deleteError) {
        console.warn('Error al eliminar imagen anterior:', deleteError)
      }
    }

    const imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${newPublicId}`

    return {
      success: true,
      data: {
        oldPublicId,
        newPublicId,
        imageUrl,
      },
      message: 'Avatar actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error al actualizar avatar:', error)

    try {
      await cloudinary.uploader.destroy(newPublicId)
    } catch (cleanupError) {
      console.warn('Error al limpiar imagen tras fallo:', cleanupError)
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al actualizar avatar',
    }
  }
}

export async function cleanupUnusedImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.warn('Error al limpiar imagen no utilizada:', error)
  }
}
