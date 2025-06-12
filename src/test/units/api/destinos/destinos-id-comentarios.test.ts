import { GET, POST } from '@/app/api/destinos/[id]/comentarios/route'
import { createResena, getResenasBySalto } from '@/services/resenas.service'
import { getUserIdByUid } from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Mocks de servicios
jest.mock('@/services/resenas.service')
jest.mock('@/services/usuarios.service')
jest.mock('@/utils/supabase/server')

const mockGetResenasBySalto = getResenasBySalto as jest.MockedFunction<
  typeof getResenasBySalto
>
const mockCreateResena = createResena as jest.MockedFunction<
  typeof createResena
>
const mockGetUserIdByUid = getUserIdByUid as jest.MockedFunction<
  typeof getUserIdByUid
>
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>

// Mock de Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API Destinos Comentarios', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockParams: { params: Promise<{ id: string }> }
  let mockSupabaseClient: {
    auth: {
      getUser: jest.Mock
    }
  }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      url: 'http://localhost:3000/api/destinos/1/comentarios',
      json: jest.fn(),
    } as unknown as NextRequest

    mockParams = {
      params: Promise.resolve({ id: '1' }),
    }

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    }

    // Reset mocks
    mockGetResenasBySalto.mockClear()
    mockCreateResena.mockClear()
    mockGetUserIdByUid.mockClear()
    mockCreateSupabaseClient.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
    ;(mockRequest.json as jest.Mock).mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('GET - Obtener comentarios', () => {
    describe('Casos exitosos', () => {
      test('debería obtener comentarios correctamente con ID válido', async () => {
        const mockReseñas = {
          success: true,
          data: [
            {
              id: 1,
              calificacion: 5,
              comentario: 'Excelente destino',
              usuario: 'Juan Pérez',
              fecha: '2024-01-01',
            },
          ],
        }

        mockGetResenasBySalto.mockResolvedValue(mockReseñas)

        await GET(mockRequest, mockParams)

        expect(mockGetResenasBySalto).toHaveBeenCalledWith(1)
        expect(mockJsonResponse).toHaveBeenCalledWith(mockReseñas, {
          status: 201,
        })
      })

      test('debería manejar respuesta vacía correctamente', async () => {
        const mockReseñasVacias = {
          success: true,
          data: [],
        }

        mockGetResenasBySalto.mockResolvedValue(mockReseñasVacias)

        await GET(mockRequest, mockParams)

        expect(mockGetResenasBySalto).toHaveBeenCalledWith(1)
        expect(mockJsonResponse).toHaveBeenCalledWith(mockReseñasVacias, {
          status: 201,
        })
      })
    })

    describe('Casos de error', () => {
      test('debería manejar error del servicio', async () => {
        const mockErrorResponse = {
          success: false,
          error: 'Error al obtener reseñas',
        }

        mockGetResenasBySalto.mockResolvedValue(mockErrorResponse)

        await GET(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'Error al obtener reseñas' },
          { status: 400 },
        )
      })

      test('debería manejar ID inválido', async () => {
        const mockParamsInvalidos = {
          params: Promise.resolve({ id: 'abc' }),
        }

        mockGetResenasBySalto.mockRejectedValue(new Error('ID inválido'))

        await GET(mockRequest, mockParamsInvalidos)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'ID inválido',
          },
          { status: 500 },
        )
        expect(mockConsoleError).toHaveBeenCalled()
      })

      test('debería manejar excepción no esperada', async () => {
        mockGetResenasBySalto.mockRejectedValue('Error inesperado')

        await GET(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'Error desconocido',
          },
          { status: 500 },
        )
      })
    })
  })

  describe('POST - Crear comentario', () => {
    beforeEach(() => {
      mockCreateSupabaseClient.mockResolvedValue(mockSupabaseClient as never)
    })

    describe('Casos exitosos', () => {
      test('debería crear comentario correctamente', async () => {
        const mockUserAuth = {
          data: { user: { id: 'auth-user-123' } },
          error: null,
        }

        const mockUserData = {
          success: true,
          data: { id_usuario: 456 },
        }

        const mockCreacionExitosa = {
          success: true,
          data: {
            id: 1,
            calificacion: 4,
            comentario: 'Muy buen lugar',
            id_usuario: 456,
            id_destino: 1,
          },
        }

        const requestBody = {
          puntuacion: 4,
          comentario: 'Muy buen lugar',
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuth)
        mockGetUserIdByUid.mockResolvedValue(mockUserData)
        mockCreateResena.mockResolvedValue(mockCreacionExitosa)
        ;(mockRequest.json as jest.Mock).mockResolvedValue(requestBody)

        await POST(mockRequest, mockParams)

        expect(mockCreateSupabaseClient).toHaveBeenCalled()
        expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
        expect(mockGetUserIdByUid).toHaveBeenCalledWith('auth-user-123')
        expect(mockCreateResena).toHaveBeenCalledWith({
          calificacion: 4,
          comentario: 'Muy buen lugar',
          id_usuario: 456,
          id_destino: 1,
          estatus: true,
        })
        expect(mockJsonResponse).toHaveBeenCalledWith(mockCreacionExitosa, {
          status: 201,
        })
      })
    })

    describe('Casos de error de autenticación', () => {
      test('debería manejar error en getUser', async () => {
        const mockUserAuthError = {
          data: { user: null },
          error: new Error('Usuario no autenticado'),
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuthError)

        await POST(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la autenticación del usuario',
          },
          { status: 500 },
        )
      })

      test('debería manejar usuario nulo', async () => {
        const mockUserAuthNull = {
          data: { user: null },
          error: null,
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuthNull)

        await POST(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la autenticación del usuario',
          },
          { status: 500 },
        )
      })

      test('debería manejar error en getUserIdByUid', async () => {
        const mockUserAuth = {
          data: { user: { id: 'auth-user-123' } },
          error: null,
        }

        const mockUserDataError = {
          success: false,
          error: 'Usuario no encontrado',
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuth)
        mockGetUserIdByUid.mockResolvedValue(mockUserDataError)

        await POST(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la autenticación del usuario',
          },
          { status: 500 },
        )
      })

      test('debería manejar datos de usuario nulos', async () => {
        const mockUserAuth = {
          data: { user: { id: 'auth-user-123' } },
          error: null,
        }

        const mockUserDataNull = {
          success: true,
          data: null,
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuth)
        mockGetUserIdByUid.mockResolvedValue(mockUserDataNull)

        await POST(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la autenticación del usuario',
          },
          { status: 500 },
        )
      })
    })

    describe('Casos de error en creación de reseña', () => {
      test('debería manejar error en createResena', async () => {
        const mockUserAuth = {
          data: { user: { id: 'auth-user-123' } },
          error: null,
        }

        const mockUserData = {
          success: true,
          data: { id_usuario: 456 },
        }

        const mockCreacionError = {
          success: false,
          error: 'Error en la base de datos',
        }

        const requestBody = {
          puntuacion: 4,
          comentario: 'Muy buen lugar',
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuth)
        mockGetUserIdByUid.mockResolvedValue(mockUserData)
        mockCreateResena.mockResolvedValue(mockCreacionError)
        ;(mockRequest.json as jest.Mock).mockResolvedValue(requestBody)

        await POST(mockRequest, mockParams)

        expect(mockJsonResponse).toHaveBeenCalledWith(
          {
            success: false,
            error: 'Error interno del servidor',
            message: 'Error en la creación del comentario',
          },
          { status: 500 },
        )
      })
    })

    describe('Casos de error con diferentes tipos de ID', () => {
      test('debería manejar ID de destino con ceros a la izquierda', async () => {
        const mockParamsConCeros = {
          params: Promise.resolve({ id: '001' }),
        }

        const mockUserAuth = {
          data: { user: { id: 'auth-user-123' } },
          error: null,
        }

        const mockUserData = {
          success: true,
          data: { id_usuario: 456 },
        }

        const mockCreacionExitosa = {
          success: true,
          data: { id: 1 },
        }

        const requestBody = {
          puntuacion: 5,
          comentario: 'Excelente',
        }

        mockSupabaseClient.auth.getUser.mockResolvedValue(mockUserAuth)
        mockGetUserIdByUid.mockResolvedValue(mockUserData)
        mockCreateResena.mockResolvedValue(mockCreacionExitosa)
        ;(mockRequest.json as jest.Mock).mockResolvedValue(requestBody)

        await POST(mockRequest, mockParamsConCeros)

        expect(mockCreateResena).toHaveBeenCalledWith({
          calificacion: 5,
          comentario: 'Excelente',
          id_usuario: 456,
          id_destino: 1, // Debería parsear correctamente 001 -> 1
          estatus: true,
        })
      })
    })
  })
})
