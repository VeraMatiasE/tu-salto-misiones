import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/utils/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { password } = await request.json()

    console.log('nuevoEmail: ', password)

    if (!password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
