import { type NextRequest, NextResponse } from 'next/server'
import { getUsuarios } from '@/services/usuarios.service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  const orderBy = searchParams.get('orderBy') || 'fecha_registro'
  const orderDirection =
    (searchParams.get('orderDirection') as 'asc' | 'desc') || 'desc'

  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: 'Parámetros de paginación inválidos' },
      { status: 400 },
    )
  }

  const response = await getUsuarios({
    page,
    limit,
    search,
    orderBy,
    orderDirection,
  })

  if (!response || !response.data || !response.success) {
    return NextResponse.json({ error: response.error }, { status: 500 })
  }

  return NextResponse.json({
    data: response.data.data,
    pagination: response.data.pagination,
  })
}
