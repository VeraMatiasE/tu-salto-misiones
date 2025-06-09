import { type NextRequest, NextResponse } from 'next/server'
import { getDestinos, createDestino } from '@/services/destinos.service'

function parseNumber(value: string | null, parseFn: (v: string) => number) {
  if (!value) return undefined
  const parsed = parseFn(value)
  return isNaN(parsed) ? null : parsed
}

function validateNumber(
  value: string | null,
  parsedValue: number | null | undefined,
  name: string,
  integer = false,
  min = 1,
) {
  if (!value) return null

  if (parsedValue === null || parsedValue === undefined) {
    return `${name} debe ser un número válido`
  }
  if (integer && (!Number.isInteger(parsedValue) || parsedValue < min)) {
    return `${name} debe ser un número entero mayor o igual a ${min}`
  }
  if (!integer && parsedValue < min) {
    return `${name} debe ser un número mayor o igual a ${min}`
  }
  return null
}

function parseAndFilter(param: string | null) {
  return param?.split(',').filter(Boolean) || []
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') ?? undefined
    const ubicaciones = parseAndFilter(searchParams.get('ubicaciones'))
    const dificultades = parseAndFilter(searchParams.get('dificultades'))
    const servicios = parseAndFilter(searchParams.get('servicios'))
    const sortBy = searchParams.get('sortBy') ?? 'nombre_asc'

    const puntuacionMinStr = searchParams.get('puntuacionMin')
    const puntuacionMaxStr = searchParams.get('puntuacionMax')
    const pageStr = searchParams.get('page')
    const limitStr = searchParams.get('limit')

    const puntuacionMin = parseNumber(puntuacionMinStr, parseFloat)
    const puntuacionMax = parseNumber(puntuacionMaxStr, parseFloat)
    const page = parseNumber(pageStr, (v) => parseInt(v, 10)) ?? 1
    const limit = parseNumber(limitStr, (v) => parseInt(v, 10)) ?? 100

    const errors = [
      validateNumber(
        puntuacionMinStr,
        puntuacionMin,
        'puntuacionMin',
        false,
        0,
      ),
      validateNumber(
        puntuacionMaxStr,
        puntuacionMax,
        'puntuacionMax',
        false,
        0,
      ),
      validateNumber(pageStr, page, 'page', true, 1),
      validateNumber(limitStr, limit, 'limit', true, 1),
    ].filter(Boolean)

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 })
    }

    const filters = {
      search,
      ubicaciones: ubicaciones.length > 0 ? ubicaciones : undefined,
      dificultades: dificultades.length > 0 ? dificultades : undefined,
      puntuacionMin: puntuacionMin ?? undefined,
      puntuacionMax: puntuacionMax ?? undefined,
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
