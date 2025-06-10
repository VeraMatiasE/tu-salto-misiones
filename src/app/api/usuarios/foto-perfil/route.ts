import { uploadAvatarToCloudinary } from '@/services/usuarios.service'
import { getUserIdByUid } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (!user?.id) throw new Error(error?.message ?? 'Error de autenticación')

    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json(
        { message: 'No se encontró la imagen' },
        { status: 400 },
      )
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { message: 'El archivo debe ser una imagen (JPG, PNG, WebP)' },
        { status: 400 },
      )
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { message: 'La imagen es demasiado grande (máximo 5MB)' },
        { status: 400 },
      )
    }

    const { data: userData, error: errorUser } = await getUserIdByUid(user.id)
    if (errorUser || userData == undefined) {
      throw new Error(errorUser ?? 'Error al obtener datos del usuario')
    }

    const result = await uploadAvatarToCloudinary(image, userData.id_usuario)

    if (!result.success) {
      throw new Error(result.error)
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error en upload:', error)
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
