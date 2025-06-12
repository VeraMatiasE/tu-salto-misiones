import { GET } from '@/app/api/destinos/filter-options/route'
import { getFilterOptions } from '@/services/destinos.service'
import { NextResponse } from 'next/server'

jest.mock('@/services/destinos.service')
const mockGetFilterOptions = getFilterOptions as jest.MockedFunction<
  typeof getFilterOptions
>

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API Destinos Filter Options - GET', () => {
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse
    mockGetFilterOptions.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Casos exitosos', () => {
    test('debería retornar las opciones de filtro correctamente', async () => {
      const mockFilterOptions = {
        ubicaciones: ['Misiones', 'Corrientes'],
        dificultades: ['Fácil', 'Moderado', 'Difícil'],
        servicios: ['Restaurante', 'Estacionamiento', 'Guía'],
      }

      mockGetFilterOptions.mockResolvedValue({
        success: true,
        data: mockFilterOptions,
      })

      await GET()

      expect(mockGetFilterOptions).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockFilterOptions)
    })
  })

  describe('Casos de error del servicio', () => {
    test('debería retornar error 500 cuando el servicio falla', async () => {
      const errorMessage = 'Error al obtener opciones de filtro'

      mockGetFilterOptions.mockResolvedValue({
        success: false,
        error: errorMessage,
      })

      await GET()

      expect(mockGetFilterOptions).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: errorMessage },
        { status: 500 },
      )
    })
  })

  describe('Casos de excepción', () => {
    test('debería manejar excepciones no controladas', async () => {
      const errorMessage = 'Error de conexión a la base de datos'

      mockGetFilterOptions.mockRejectedValue(new Error(errorMessage))

      await GET()

      expect(mockGetFilterOptions).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error in GET /api/saltos/filter-options:',
        expect.any(Error),
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })

    test('debería manejar excepciones que no son instancias de Error', async () => {
      mockGetFilterOptions.mockRejectedValue('Error string')

      await GET()

      expect(mockGetFilterOptions).toHaveBeenCalledTimes(1)
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error in GET /api/saltos/filter-options:',
        'Error string',
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })
})
