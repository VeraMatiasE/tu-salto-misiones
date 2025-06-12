import { GET, POST } from '@/app/api/destinos/route'
import { getDestinos, createDestino } from '@/services/destinos.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/destinos.service')
const mockGetDestinos = getDestinos as jest.MockedFunction<typeof getDestinos>
const mockCreateDestino = createDestino as jest.MockedFunction<
  typeof createDestino
>

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API Destinos - GET', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      url: 'http://localhost:3000/api/destinos',
    } as NextRequest

    mockGetDestinos.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Parámetros válidos', () => {
    test('debería procesar correctamente los parámetros por defecto', async () => {
      mockGetDestinos.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })

      await GET(mockRequest)

      expect(mockGetDestinos).toHaveBeenCalledWith({
        search: undefined,
        ubicaciones: undefined,
        dificultades: undefined,
        puntuacionMin: undefined,
        puntuacionMax: undefined,
        servicios: undefined,
        sortBy: 'nombre_asc',
        page: 1,
        limit: 100,
      })
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })
    })

    test('debería procesar todos los parámetros de búsqueda', async () => {
      mockRequest.url =
        'http://localhost:3000/api/destinos?search=playa&ubicaciones=costa,montaña&dificultades=facil,medio&servicios=wifi,parking&sortBy=puntuacion_desc&puntuacionMin=3.5&puntuacionMax=4.5&page=2&limit=50'

      mockGetDestinos.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })

      await GET(mockRequest)

      expect(mockGetDestinos).toHaveBeenCalledWith({
        search: 'playa',
        ubicaciones: ['costa', 'montaña'],
        dificultades: ['facil', 'medio'],
        puntuacionMin: 3.5,
        puntuacionMax: 4.5,
        servicios: ['wifi', 'parking'],
        sortBy: 'puntuacion_desc',
        page: 2,
        limit: 50,
      })
    })

    test('debería filtrar arrays vacíos y valores falsy', async () => {
      mockRequest.url =
        'http://localhost:3000/api/destinos?ubicaciones=,costa,,&dificultades=&servicios=wifi,'

      mockGetDestinos.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })

      await GET(mockRequest)

      expect(mockGetDestinos).toHaveBeenCalledWith({
        search: undefined,
        ubicaciones: ['costa'],
        dificultades: undefined,
        puntuacionMin: undefined,
        puntuacionMax: undefined,
        servicios: ['wifi'],
        sortBy: 'nombre_asc',
        page: 1,
        limit: 100,
      })
    })
  })

  describe('Validación de parámetros numéricos', () => {
    test('debería retornar error para puntuacionMin inválida', async () => {
      mockRequest.url = 'http://localhost:3000/api/destinos?puntuacionMin=abc'

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'puntuacionMin debe ser un número válido' },
        { status: 400 },
      )
      expect(mockGetDestinos).not.toHaveBeenCalled()
    })

    test('debería retornar error para puntuacionMax menor que 0', async () => {
      mockRequest.url = 'http://localhost:3000/api/destinos?puntuacionMax=-1'

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'puntuacionMax debe ser un número mayor o igual a 0' },
        { status: 400 },
      )
    })

    test('debería retornar error para page inválida', async () => {
      mockRequest.url = 'http://localhost:3000/api/destinos?page=0'

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'page debe ser un número entero mayor o igual a 1' },
        { status: 400 },
      )
    })

    test('debería retornar error para limit menor a 1', async () => {
      mockRequest.url = 'http://localhost:3000/api/destinos?limit=0.5'

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'limit debe ser un número entero mayor o igual a 1' },
        { status: 400 },
      )
    })

    test('debería aceptar puntuacionMin y puntuacionMax válidas', async () => {
      mockRequest.url =
        'http://localhost:3000/api/destinos?puntuacionMin=0&puntuacionMax=5.0'

      mockGetDestinos.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })

      await GET(mockRequest)

      expect(mockGetDestinos).toHaveBeenCalledWith(
        expect.objectContaining({
          puntuacionMin: 0,
          puntuacionMax: 5.0,
        }),
      )
    })
  })

  describe('Manejo de errores del servicio', () => {
    test('debería retornar error 500 cuando el servicio falla', async () => {
      mockGetDestinos.mockResolvedValue({
        success: false,
        error: 'Error de base de datos',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error de base de datos' },
        { status: 500 },
      )
    })

    test('debería manejar excepciones no controladas', async () => {
      mockGetDestinos.mockRejectedValue(new Error('Error inesperado'))

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error in GET /api/destinos:',
        expect.any(Error),
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })
})

describe('API Destinos - POST', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      json: jest.fn(),
    } as unknown as NextRequest

    mockCreateDestino.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('Creación exitosa', () => {
    test('debería crear un destino correctamente', async () => {
      const destinoData = {
        nombre: 'Playa Paradise',
        ubicacion: 'Costa Rica',
        dificultad: 'facil',
        puntuacion: 4.5,
      }

      ;(mockRequest.json as jest.Mock).mockResolvedValue(destinoData)

      mockCreateDestino.mockResolvedValue({
        success: true,
        data: { id: 1, ...destinoData },
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest)

      expect(mockCreateDestino).toHaveBeenCalledWith(destinoData)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          success: true,
          data: { id: 1, ...destinoData },
        },
        { status: 201 },
      )
    })
  })

  describe('Manejo de errores', () => {
    test('debería retornar error 400 cuando el servicio falla por validación', async () => {
      const destinoData = {
        nombre: '',
        ubicacion: 'Costa Rica',
      }

      ;(mockRequest.json as jest.Mock).mockResolvedValue(destinoData)

      mockCreateDestino.mockResolvedValue({
        success: false,
        error: 'El nombre es requerido',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'El nombre es requerido' },
        { status: 400 },
      )
    })

    test('debería manejar error de JSON inválido', async () => {
      ;(mockRequest.json as jest.Mock).mockRejectedValue(
        new SyntaxError('JSON inválido'),
      )

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error al procesar la solicitud' },
        { status: 400 },
      )
      expect(mockCreateDestino).not.toHaveBeenCalled()
    })

    test('debería manejar cualquier otra excepción', async () => {
      ;(mockRequest.json as jest.Mock).mockRejectedValue(
        new Error('Error inesperado'),
      )

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error al procesar la solicitud' },
        { status: 400 },
      )
    })
  })
})

describe('Funciones de utilidad', () => {
  // Para probar las funciones internas, necesitarías exportarlas o crear tests de integración
  // Como están internas, se prueban a través de los casos de uso del GET

  describe('parseNumber', () => {
    test('parseNumber se prueba indirectamente a través de GET con parámetros numéricos', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/destinos?page=2&limit=50&puntuacionMin=3.5',
      } as NextRequest

      mockGetDestinos.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })

      await GET(mockRequest)

      expect(mockGetDestinos).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 50,
          puntuacionMin: 3.5,
        }),
      )
    })
  })

  describe('validateNumber', () => {
    test('validateNumber se prueba indirectamente a través de validaciones de GET', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/destinos?page=-1',
      } as NextRequest

      const mockJsonResponse = jest.fn().mockReturnValue({ status: jest.fn() })
      ;(NextResponse.json as jest.Mock) = mockJsonResponse

      await GET(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'page debe ser un número entero mayor o igual a 1' },
        { status: 400 },
      )
    })
  })

  describe('parseAndFilter', () => {
    test('parseAndFilter se prueba indirectamente a través de parámetros de array', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/destinos?ubicaciones=costa,montaña,playa',
      } as NextRequest

      mockGetDestinos.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: {
            total: 0,
            currentPage: 1,
            limit: 100,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      })

      await GET(mockRequest)

      expect(mockGetDestinos).toHaveBeenCalledWith(
        expect.objectContaining({
          ubicaciones: ['costa', 'montaña', 'playa'],
        }),
      )
    })
  })
})
