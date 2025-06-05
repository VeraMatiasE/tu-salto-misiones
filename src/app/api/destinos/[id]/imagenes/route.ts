import { type NextRequest, NextResponse } from "next/server"
import { getImagenesByDestinoId, createImagen } from "@/services/imagenes-destino.service"

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
    const body = await request.json()
    const imagen = {
      ...body,
      parsedId,
      estatus: true,
    }

    const response = await createImagen(imagen)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 400 })
  }
}
