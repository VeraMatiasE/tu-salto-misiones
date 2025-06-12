import { GET, POST } from '@/app/api/usuarios/resenas/route'
import { getResenasByUsuario, createResena } from '@/services/resenas.service'
import { getUserByUid } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/resenas.service')
jest.mock('@/services/usuarios.service')
jest.mock('@/utils/supabase/server')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockGetResenas = getResenasByUsuario as jest.MockedFunction<
  typeof getResenasByUsuario
>
const mockCreateResena = createResena as jest.MockedFunction<
  typeof createResena
>
const mockGetUser = getUserByUid as jest.MockedFunction<typeof getUserByUid>
const mockCreateSupabaseClient = createSupabaseClient as jest.Mock
const mockJson = NextResponse.json as jest.Mock

describe('/api/usuarios/resenas - GET', () => {
  let request: NextRequest

  beforeEach(() => {
    request = {
      url: 'http://localhost/api/usuarios/resenas?page=1&limit=5',
    } as NextRequest

    mockJson.mockClear()
    mockGetResenas.mockClear()
    mockGetUser.mockClear()
  })

  test('debería devolver reseñas paginadas del usuario autenticado', async () => {
    mockCreateSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'uid-1' } },
          error: null,
        }),
      },
    })

    mockGetUser.mockResolvedValue({
      success: true,
      data: { id_usuario: 101 },
    })

    mockGetResenas.mockResolvedValue({
      success: true,
      data: [{ id_resena: 1, comentario: 'Muy bueno' }],
    })

    await GET(request)

    expect(mockGetResenas).toHaveBeenCalledWith(101, expect.any(Object))
    expect(mockJson).toHaveBeenCalledWith([
      { id_resena: 1, comentario: 'Muy bueno' },
    ])
  })
})

describe('/api/usuarios/resenas - POST', () => {
  let request: NextRequest

  beforeEach(() => {
    mockJson.mockClear()
    mockCreateResena.mockClear()
    mockGetUser.mockClear()
  })

  test('debería crear una reseña con datos válidos', async () => {
    const reseñaPayload = {
      id_destino: 1,
      calificacion: 5,
      comentario: 'Espectacular',
    }

    mockCreateSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'uid-abc' } },
          error: null,
        }),
      },
    })

    mockGetUser.mockResolvedValue({
      success: true,
      data: { id_usuario: 55 },
    })

    mockCreateResena.mockResolvedValue({
      success: true,
      data: { id_resena: 999, ...reseñaPayload },
    })

    request = {
      json: jest.fn().mockResolvedValue(reseñaPayload),
    } as unknown as NextRequest

    await POST(request)

    expect(mockCreateResena).toHaveBeenCalledWith({
      id_usuario: 55,
      id_destino: 1,
      calificacion: 5,
      comentario: 'Espectacular',
      estatus: true,
    })
    expect(mockJson).toHaveBeenCalledWith(
      { id_resena: 999, ...reseñaPayload },
      { status: 201 },
    )
  })
})
