import { createSupabaseClient } from '@/utils/supabase/server'
import type { ImagenDestino, ApiResponse } from '@/types/database'
import { Imagen, ImagenesDestino } from '@/types/imagenes'
import cloudinary from '@/lib/cloudnary'
import { UploadApiResponse } from 'cloudinary'

export async function getAllDestinoWithImagenes(): Promise<
  ApiResponse<ImagenesDestino[]>
> {
  try {
    const supabase = await createSupabaseClient()

    const { data, error } = await supabase
      .from('destinos')
      .select(
        `
        id_destino,
        nombre,
        imagenes_destino:imagenes_destino(
          id_imagen,
          url_imagen,
          public_id
        )
      `,
      )
      .eq('estatus', true)
      .eq('imagenes_destino.estatus', true)

    if (error) throw error

    const destinosConImagenes: ImagenesDestino[] = []

    if (data) {
      const destinosMap = new Map<string, ImagenesDestino>()

      data.forEach((item) => {
        const destinoId = item.id_destino

        if (!destinosMap.has(destinoId)) {
          destinosMap.set(destinoId, {
            id_destino: destinoId,
            nombre: item.nombre,
            imagenes: [],
          })
        }

        const destino = destinosMap.get(destinoId)!

        if (Array.isArray(item.imagenes_destino)) {
          item.imagenes_destino.forEach((imagen: Imagen) => {
            destino.imagenes.push({
              id_imagen: imagen.id_imagen,
              url_imagen: imagen.url_imagen,
              fecha_actualizacion: imagen.fecha_actualizacion,
              public_id: imagen.public_id,
            })
          })
        }
      })

      destinosConImagenes.push(...destinosMap.values())
    }

    return {
      success: true,
      data: destinosConImagenes,
    }
  } catch (error) {
    console.error('Error al obtener destinos con imágenes:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al obtener destinos con imágenes',
    }
  }
}

export async function getImagenesByDestinoId(
  id_destino: number,
): Promise<ApiResponse<ImagenDestino[]>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('imagenes_destino')
      .select('*')
      .eq('id_destino', id_destino)
      .eq('estatus', true)

    if (error) throw error

    return {
      success: true,
      data: data as ImagenDestino[],
    }
  } catch (error) {
    console.error(
      `Error al obtener imágenes del destino con ID ${id_destino}:`,
      error,
    )
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener imágenes del destino con ID ${id_destino}`,
    }
  }
}

export async function getImagenById(
  id: number,
): Promise<ApiResponse<ImagenDestino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('imagenes_destino')
      .select('*')
      .eq('id_imagen', id)
      .eq('estatus', true)
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as ImagenDestino,
    }
  } catch (error) {
    console.error(`Error al obtener imagen con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al obtener imagen con ID ${id}`,
    }
  }
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error
  const message = typeof error === 'string' ? error : JSON.stringify(error)
  return new Error(message)
}

export async function uploadImage(
  image: File,
  saltoId: number,
): Promise<ApiResponse<ImagenDestino>> {
  try {
    const arrayBuffer = await image.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const cloudinaryResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `destinos/${saltoId}`,
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
      id_destino: saltoId,
      url_imagen: cloudinaryResult.secure_url,
      public_id: cloudinaryResult.public_id,
    }

    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('imagenes_destino')
      .insert([{ ...imageData }])
      .select()
      .single()

    if (error) {
      await await cloudinary.uploader.destroy(imageData.public_id)
      throw new Error(`Error al guardar metadatos: ${error.message}`)
    }

    return {
      success: true,
      data: data as ImagenDestino,
      message: 'Imagen creada exitosamente',
    }
  } catch (error) {
    console.error('Error al crear imagen:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear imagen',
    }
  }
}

export async function updateImagen(
  id: number,
  imagen: Partial<ImagenDestino>,
): Promise<ApiResponse<ImagenDestino>> {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('imagenes_destino')
      .update({
        ...imagen,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_imagen', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data: data as ImagenDestino,
      message: 'Imagen actualizada exitosamente',
    }
  } catch (error) {
    console.error(`Error al actualizar imagen con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al actualizar imagen con ID ${id}`,
    }
  }
}

export async function deleteImagen(id: number): Promise<ApiResponse<null>> {
  try {
    const supabase = await createSupabaseClient()
    const { data: imagen, error: fetchError } = await supabase
      .from('imagenes_destino')
      .select('public_id')
      .eq('id_imagen', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!imagen?.public_id) throw new Error('No se encontró el public_id')

    const cloudinaryResult = await cloudinary.uploader.destroy(imagen.public_id)
    if (
      cloudinaryResult.result !== 'ok'
      && cloudinaryResult.result !== 'not found'
    ) {
      throw new Error(
        `Error al eliminar en Cloudinary: ${cloudinaryResult.result}`,
      )
    }

    const { error: updateError } = await supabase
      .from('imagenes_destino')
      .update({
        estatus: false,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq('id_imagen', id)

    if (updateError) throw updateError

    return {
      success: true,
      message: 'Imagen eliminada exitosamente',
    }
  } catch (error) {
    console.error(`Error al eliminar imagen con ID ${id}:`, error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : `Error desconocido al eliminar imagen con ID ${id}`,
    }
  }
}
