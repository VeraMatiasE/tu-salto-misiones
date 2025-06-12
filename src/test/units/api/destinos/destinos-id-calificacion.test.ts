import { GET } from '@/app/api/destinos/[id]/calificacion/route'
import { getPromedioCalificacionSalto } from '@/services/resenas.service'
import { NextRequest, NextResponse } from 'next/server'

// Mock del servicio
jest.mock('@/services/resenas.service')

const mockGetPromedioCalificacionSalto =
  getPromedioCalificacionSalto as jest.MockedFunction<
    typeof getPromedioCalificacionSalto
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

describe('API Destinos Calificación - GET', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockParams: { params: Promise<{ id: string }> }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      url: 'http://localhost:3000/api/destinos/1/calificacion',
    } as NextRequest

    mockParams = {
      params: Promise.resolve({ id: '1' }),
    }

    // Reset mocks
    mockGetPromedioCalificacionSalto.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Casos exitosos', () => {
    test('debería obtener calificación promedio correctamente', async () => {
      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 4.5,
          totalReseñas: 10,
          destino: 'Salto del Agua',
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParams)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockCalificacionResponse, {
        status: 201,
      })
    })

    test('debería manejar destino sin calificaciones', async () => {
      const mockSinCalificaciones = {
        success: true,
        data: {
          promedio: 0,
          totalReseñas: 0,
          destino: 'Salto Nuevo',
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(mockSinCalificaciones)

      await GET(mockRequest, mockParams)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockSinCalificaciones, {
        status: 201,
      })
    })

    test('debería manejar calificación perfecta', async () => {
      const mockCalificacionPerfecta = {
        success: true,
        data: {
          promedio: 5.0,
          totalReseñas: 5,
          destino: 'Salto Perfecto',
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionPerfecta,
      )

      await GET(mockRequest, mockParams)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockCalificacionPerfecta, {
        status: 201,
      })
    })

    test('debería manejar ID con ceros a la izquierda', async () => {
      const mockParamsConCeros = {
        params: Promise.resolve({ id: '007' }),
      }

      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 3.8,
          totalReseñas: 15,
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParamsConCeros)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(7)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockCalificacionResponse, {
        status: 201,
      })
    })

    test('debería manejar ID muy grande', async () => {
      const mockParamsGrande = {
        params: Promise.resolve({ id: '999999' }),
      }

      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 2.5,
          totalReseñas: 2,
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParamsGrande)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(999999)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockCalificacionResponse, {
        status: 201,
      })
    })
  })

  describe('Casos de error del servicio', () => {
    test('debería manejar error cuando el destino no existe', async () => {
      const mockErrorDestino = {
        success: false,
        error: 'Destino no encontrado',
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(mockErrorDestino)

      await GET(mockRequest, mockParams)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Destino no encontrado' },
        { status: 400 },
      )
    })

    test('debería manejar error de base de datos', async () => {
      const mockErrorBD = {
        success: false,
        error: 'Error de conexión a la base de datos',
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(mockErrorBD)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error de conexión a la base de datos' },
        { status: 400 },
      )
    })

    test('debería manejar error de permisos', async () => {
      const mockErrorPermisos = {
        success: false,
        error: 'No tienes permisos para acceder a esta información',
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(mockErrorPermisos)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'No tienes permisos para acceder a esta información' },
        { status: 400 },
      )
    })
  })

  describe('Casos de error de parámetros', () => {
    test('debería manejar ID no numérico', async () => {
      const mockParamsInvalidos = {
        params: Promise.resolve({ id: 'abc' }),
      }

      mockGetPromedioCalificacionSalto.mockRejectedValue(
        new Error('ID debe ser numérico'),
      )

      await GET(mockRequest, mockParamsInvalidos)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'ID debe ser numérico',
        },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error la calificación:',
        expect.any(Error),
      )
    })

    test('debería manejar ID con caracteres especiales', async () => {
      const mockParamsEspeciales = {
        params: Promise.resolve({ id: '1@#$' }),
      }

      mockGetPromedioCalificacionSalto.mockRejectedValue(
        new Error('ID contiene caracteres inválidos'),
      )

      await GET(mockRequest, mockParamsEspeciales)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'ID contiene caracteres inválidos',
        },
        { status: 500 },
      )
    })

    test('debería manejar ID vacío', async () => {
      const mockParamsVacios = {
        params: Promise.resolve({ id: '' }),
      }

      mockGetPromedioCalificacionSalto.mockRejectedValue(
        new Error('ID no puede estar vacío'),
      )

      await GET(mockRequest, mockParamsVacios)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'ID no puede estar vacío',
        },
        { status: 500 },
      )
    })

    test('debería manejar ID negativo parseado correctamente', async () => {
      const mockParamsNegativo = {
        params: Promise.resolve({ id: '-5' }),
      }

      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 0,
          totalReseñas: 0,
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParamsNegativo)

      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(-5)
    })
  })

  describe('Casos de excepción inesperada', () => {
    test('debería manejar excepción del servicio', async () => {
      mockGetPromedioCalificacionSalto.mockRejectedValue(
        new Error('Error interno del servicio'),
      )

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'Error interno del servicio',
        },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error la calificación:',
        expect.any(Error),
      )
    })

    test('debería manejar excepción de tipo desconocido', async () => {
      mockGetPromedioCalificacionSalto.mockRejectedValue('Error de tipo string')

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'Error desconocido',
        },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error la calificación:',
        'Error de tipo string',
      )
    })

    test('debería manejar excepción null', async () => {
      mockGetPromedioCalificacionSalto.mockRejectedValue(null)

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

    test('debería manejar excepción undefined', async () => {
      mockGetPromedioCalificacionSalto.mockRejectedValue(undefined)

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

  describe('Casos edge con parsing de números', () => {
    test('debería manejar ID decimal', async () => {
      const mockParamsDecimal = {
        params: Promise.resolve({ id: '1.5' }),
      }

      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 4.2,
          totalReseñas: 8,
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParamsDecimal)

      // parseInt debería convertir 1.5 a 1
      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(1)
    })

    test('debería manejar ID con espacios', async () => {
      const mockParamsConEspacios = {
        params: Promise.resolve({ id: ' 42 ' }),
      }

      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 3.7,
          totalReseñas: 12,
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParamsConEspacios)

      // parseInt debería manejar espacios correctamente
      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(42)
    })

    test('debería manejar ID con notación científica', async () => {
      const mockParamsCientifico = {
        params: Promise.resolve({ id: '1e2' }),
      }

      const mockCalificacionResponse = {
        success: true,
        data: {
          promedio: 4.8,
          totalReseñas: 3,
        },
      }

      mockGetPromedioCalificacionSalto.mockResolvedValue(
        mockCalificacionResponse,
      )

      await GET(mockRequest, mockParamsCientifico)

      // parseInt('1e2') = 1 (no reconoce notación científica)
      expect(mockGetPromedioCalificacionSalto).toHaveBeenCalledWith(1)
    })
  })
})
