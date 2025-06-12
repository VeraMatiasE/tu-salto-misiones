import { GET } from '@/app/api/destinos/destacados/route'
import { getDestinosDestacados } from '@/services/destinos.service'
import { NextResponse } from 'next/server'

jest.mock('@/services/destinos.service')
const mockGetDestinosDestacados = getDestinosDestacados as jest.MockedFunction<
  typeof getDestinosDestacados
>

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API Destinos Destacados - GET', () => {
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse
    mockGetDestinosDestacados.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Casos exitosos', () => {
    test('debería retornar los destinos destacados correctamente', async () => {
      const mockDestinosDestacados = {
        success: true,
        data: [
          {
            id: 1,
            nombre: 'Cataratas del Iguazú',
            descripcion: 'Hermosas cataratas',
            ubicacion: 'Misiones',
            puntuacion_promedio: 4.8,
            imagen_principal: 'cataratas.jpg',
          },
          {
            id: 2,
            nombre: 'Saltos del Moconá',
            descripcion: 'Saltos únicos',
            ubicacion: 'Misiones',
            puntuacion_promedio: 4.5,
            imagen_principal: 'mocona.jpg',
          },
        ],
      }

      mockGetDestinosDestacados.mockResolvedValue(mockDestinosDestacados)

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockDestinosDestacados, {
        status: 201,
      })
    })

    test('debería retornar una lista vacía si no hay destinos destacados', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }

      mockGetDestinosDestacados.mockResolvedValue(mockResponse)

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockResponse, {
        status: 201,
      })
    })
  })

  describe('Casos de error del servicio', () => {
    test('debería retornar error 400 cuando el servicio falla', async () => {
      const errorMessage = 'Error al obtener destinos destacados'

      mockGetDestinosDestacados.mockResolvedValue({
        success: false,
        error: errorMessage,
      })

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: errorMessage },
        { status: 400 },
      )
    })

    test('debería retornar error 400 cuando el servicio retorna success false sin error', async () => {
      mockGetDestinosDestacados.mockResolvedValue({
        success: false,
      })

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: undefined },
        { status: 400 },
      )
    })
  })

  describe('Casos de excepción', () => {
    test('debería manejar excepciones del servicio con mensaje de error', async () => {
      const errorMessage = 'Error de conexión a la base de datos'
      const error = new Error(errorMessage)

      mockGetDestinosDestacados.mockRejectedValue(error)

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error al obtener destinos aleatorios:',
        error,
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: errorMessage,
        },
        { status: 500 },
      )
    })

    test('debería manejar excepciones que no son instancias de Error', async () => {
      const errorString = 'Error string'

      mockGetDestinosDestacados.mockRejectedValue(errorString)

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error al obtener destinos aleatorios:',
        errorString,
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'Error desconocido',
        },
        { status: 500 },
      )
    })

    test('debería manejar excepciones null o undefined', async () => {
      mockGetDestinosDestacados.mockRejectedValue(null)

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error al obtener destinos aleatorios:',
        null,
      )
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

  describe('Casos de timeout o respuesta lenta', () => {
    test('debería manejar timeout del servicio', async () => {
      const timeoutError = new Error('Timeout')
      timeoutError.name = 'TimeoutError'

      mockGetDestinosDestacados.mockRejectedValue(timeoutError)

      await GET()

      expect(mockGetDestinosDestacados).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error al obtener destinos aleatorios:',
        timeoutError,
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: false,
          error: 'Error interno del servidor',
          message: 'Timeout',
        },
        { status: 500 },
      )
    })
  })
})
