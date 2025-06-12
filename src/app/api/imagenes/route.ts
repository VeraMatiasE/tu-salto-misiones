import { NextResponse } from 'next/server'
import { getAllDestinoWithImagenes } from '@/services/imagenes-destino.service'

export async function GET() {
  const response = await getAllDestinoWithImagenes()

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 500 })
  }

  return NextResponse.json(response)
}
