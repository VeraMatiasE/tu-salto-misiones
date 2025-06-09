import { type NextRequest, NextResponse } from 'next/server'
import {
  getDestinoById,
  updateDestino,
  deleteDestino,
} from '@/services/destinos.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsedId = Number.parseInt(id)

  if (isNaN(parsedId)) {
    return NextResponse.json(
      { error: 'ID de destino inválido' },
      { status: 400 },
    )
  }

  const response = await getDestinoById(parsedId)

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 404 })
  }

  return NextResponse.json(response)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsedId = Number.parseInt(id)

  if (isNaN(parsedId)) {
    return NextResponse.json(
      { error: 'ID de destino inválido' },
      { status: 400 },
    )
  }

  try {
    const body = await request.json()
    const response = await updateDestino(parsedId, body)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response)
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 400 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const parsedId = Number.parseInt(id)

  if (isNaN(parsedId)) {
    return NextResponse.json(
      { error: 'ID de destino inválido' },
      { status: 400 },
    )
  }

  const response = await deleteDestino(parsedId)

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 400 })
  }

  return NextResponse.json(response)
}
