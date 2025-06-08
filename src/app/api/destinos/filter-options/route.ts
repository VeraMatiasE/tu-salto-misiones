import { NextResponse } from 'next/server'
import { getFilterOptions } from '@/services/destinos.service'

export async function GET() {
  try {
    const response = await getFilterOptions()
    
    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 500 })
    }

    return NextResponse.json(response.data)
  } catch (error) {
    console.error('Error in GET /api/saltos/filter-options:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}