import { type NextRequest, NextResponse } from "next/server"
import { getDestinos, createDestino } from "@/services/destinos.service"

export async function GET() {
  const response = await getDestinos()

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 500 })
  }

  return NextResponse.json(response)
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
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 400 })
  }
}
