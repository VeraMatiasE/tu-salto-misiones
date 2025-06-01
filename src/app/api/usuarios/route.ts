import { type NextRequest, NextResponse } from "next/server"
import { getUsuarios, createUsuario } from "@/services/usuarios.service"

export async function GET() {
  const response = await getUsuarios()

  if (!response.success) {
    return NextResponse.json({ error: response.error }, { status: 500 })
  }

  return NextResponse.json(response)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const response = await createUsuario(body)

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 400 })
  }
}
