import { NextRequest, NextResponse } from 'next/server'
import { getPromedioCalificacionSalto } from '@/services/resenas.service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const parsedId = Number.parseInt(id)
    const response = await getPromedioCalificacionSalto(parsedId)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error la calificación:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
