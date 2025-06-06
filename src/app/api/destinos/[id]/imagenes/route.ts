import { NextRequest, NextResponse } from "next/server"
import { getImagenesByDestinoId, uploadImage } from "@/services/imagenes-destino.service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsedId = Number.parseInt(id)

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "ID de destino inválido" }, { status: 400 })
  }

  const response = await getImagenesByDestinoId(parsedId)

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 500 })
  }

  return NextResponse.json(response)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsedId = Number.parseInt(id)

  if (isNaN(parsedId)) {
    return NextResponse.json({ error: "ID de destino inválido" }, { status: 400 })
  }

  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { message: 'No se encontró la imagen' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { message: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      return NextResponse.json(
        { message: 'La imagen es demasiado grande (máximo 5MB)' },
        { status: 400 }
      );
    }

    const result = await uploadImage(image, parsedId);

    if(!result.success)
      throw result.error

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
