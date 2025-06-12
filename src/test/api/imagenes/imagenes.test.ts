import { GET } from '@/app/api/imagenes/route'
import { getAllDestinoWithImagenes } from '@/services/imagenes-destino.service'
import { NextResponse } from 'next/server'

jest.mock('@/services/imagenes-destino.service')
const mockGetAllDestinoWithImagenes =
  getAllDestinoWithImagenes as jest.MockedFunction<
    typeof getAllDestinoWithImagenes
  >

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

describe('API Imagenes - GET', () => {
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse
    mockGetAllDestinoWithImagenes.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('Casos exitosos', () => {
    test('debería retornar todos los destinos con imágenes correctamente', async () => {
      const mockDestinosConImagenes = {
        success: true,
        data: [
          {
            id: 1,
            nombre: 'Cataratas del Iguazú',
            imagenes: [
              { id: 1, url: 'imagen1.jpg', descripcion: 'Vista frontal' },
              { id: 2, url: 'imagen2.jpg', descripcion: 'Vista aérea' },
            ],
          },
          {
            id: 2,
            nombre: 'Saltos del Moconá',
            imagenes: [
              { id: 3, url: 'imagen3.jpg', descripcion: 'Salto principal' },
            ],
          },
        ],
      }

      mockGetAllDestinoWithImagenes.mockResolvedValue(mockDestinosConImagenes)

      await GET()

      expect(mockGetAllDestinoWithImagenes).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockDestinosConImagenes)
    })

    test('debería retornar una lista vacía si no hay destinos con imágenes', async () => {
      const mockResponse = {
        success: true,
        data: [],
      }

      mockGetAllDestinoWithImagenes.mockResolvedValue(mockResponse)

      await GET()

      expect(mockGetAllDestinoWithImagenes).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockResponse)
    })
  })

  describe('Casos de error del servicio', () => {
    test('debería retornar error 500 cuando el servicio falla', async () => {
      const errorMessage = 'Error al obtener destinos con imágenes'

      mockGetAllDestinoWithImagenes.mockResolvedValue({
        success: false,
        error: errorMessage,
      })

      await GET()

      expect(mockGetAllDestinoWithImagenes).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: errorMessage },
        { status: 500 },
      )
    })

    test('debería retornar error 500 cuando el servicio retorna success false sin error', async () => {
      mockGetAllDestinoWithImagenes.mockResolvedValue({
        success: false,
      })

      await GET()

      expect(mockGetAllDestinoWithImagenes).toHaveBeenCalledTimes(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: undefined },
        { status: 500 },
      )
    })
  })

  describe('Casos de excepción', () => {
    test('debería propagar excepciones del servicio', async () => {
      const error = new Error('Error de conexión a la base de datos')

      mockGetAllDestinoWithImagenes.mockRejectedValue(error)

      await expect(GET()).rejects.toThrow(
        'Error de conexión a la base de datos',
      )
      expect(mockGetAllDestinoWithImagenes).toHaveBeenCalledTimes(1)
    })
  })
})
