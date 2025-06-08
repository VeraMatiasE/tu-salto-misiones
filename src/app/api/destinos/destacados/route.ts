import { NextResponse } from "next/server"
import { getDestinosDestacados } from "@/services/destinos.service"

export async function GET() {
  try {
    const response = await getDestinosDestacados()

    if (!response.success) {
      return NextResponse.json({ error: response.error }, { status: 400 })
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error al obtener destinos aleatorios:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}