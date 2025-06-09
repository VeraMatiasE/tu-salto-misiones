import { type NextRequest, NextResponse } from 'next/server'
import { getDestinos, createDestino } from '@/services/destinos.service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || undefined
    const ubicaciones =
      searchParams.get('ubicaciones')?.split(',').filter(Boolean) || []
    const dificultades =
      searchParams.get('dificultades')?.split(',').filter(Boolean) || []
    const puntuacionMinStr = searchParams.get('puntuacionMin')
    const puntuacionMaxStr = searchParams.get('puntuacionMax')
    const servicios =
      searchParams.get('servicios')?.split(',').filter(Boolean) || []
    const sortBy = searchParams.get('sortBy') || 'nombre_asc'
    const pageStr = searchParams.get('page')
    const limitStr = searchParams.get('limit')

    const puntuacionMin = puntuacionMinStr
      ? parseFloat(puntuacionMinStr)
      : undefined
    const puntuacionMax = puntuacionMaxStr
      ? parseFloat(puntuacionMaxStr)
      : undefined
    const page = pageStr ? parseInt(pageStr, 10) : 1
    const limit = limitStr ? parseInt(limitStr, 10) : 100

    if (puntuacionMinStr && isNaN(puntuacionMin as number)) {
      return NextResponse.json(
        { error: 'puntuacionMin debe ser un número válido' },
        { status: 400 },
      )
    }
    if (puntuacionMaxStr && isNaN(puntuacionMax as number)) {
      return NextResponse.json(
        { error: 'puntuacionMax debe ser un número válido' },
        { status: 400 },
      )
    }
    if (pageStr && (isNaN(page) || page < 1)) {
      return NextResponse.json(
        { error: 'page debe ser un número entero mayor a 0' },
        { status: 400 },
      )
    }
    if (limitStr && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'limit debe ser un número entero mayor a 0' },
        { status: 400 },
      )
    }

    const filters = {
      search,
      ubicaciones: ubicaciones.length > 0 ? ubicaciones : undefined,
      dificultades: dificultades.length > 0 ? dificultades : undefined,
      puntuacionMin,
      puntuacionMax,
      servicios: servicios.length > 0 ? servicios : undefined,
      sortBy,
      page,
      limit,
    }

    const response = await getDestinos(filters)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/destinos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await createDestino(body)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 400 },
    )
  }
}
