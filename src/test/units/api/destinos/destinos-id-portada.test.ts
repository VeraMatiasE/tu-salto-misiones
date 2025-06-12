import { GET } from '@/app/api/destinos/[id]/portada/route'
import { getImagenByDestinoId } from '@/services/imagenes-destino.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/imagenes-destino.service')

const mockGetImagenByDestinoId = getImagenByDestinoId as jest.MockedFunction<
  typeof getImagenByDestinoId
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

describe('API Destinos Portada - GET', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockParams: { params: Promise<{ id: string }> }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      url: 'http://localhost:3000/api/destinos/1/portada',
    } as NextRequest

    mockParams = {
      params: Promise.resolve({ id: '1' }),
    }

    mockGetImagenByDestinoId.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Casos exitosos', () => {
    test('debería obtener imagen de portada correctamente', async () => {
      const mockImagenResponse = {
        success: true,
        data: {
          id: 1,
          url: 'https://example.com/imagen-portada.jpg',
          alt: 'Portada del Salto del Agua',
          id_destino: 1,
          es_portada: true,
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParams)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockImagenResponse)
    })

    test('debería manejar múltiples imágenes con portada', async () => {
      const mockMultiplesImagenes = {
        success: true,
        data: [
          {
            id: 1,
            url: 'https://example.com/portada.jpg',
            alt: 'Portada principal',
            id_destino: 1,
            es_portada: true,
          },
          {
            id: 2,
            url: 'https://example.com/imagen2.jpg',
            alt: 'Vista lateral',
            id_destino: 1,
            es_portada: false,
          },
        ],
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockMultiplesImagenes)

      await GET(mockRequest, mockParams)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockMultiplesImagenes)
    })

    test('debería manejar respuesta sin imagen de portada', async () => {
      const mockSinPortada = {
        success: true,
        data: null,
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockSinPortada)

      await GET(mockRequest, mockParams)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockSinPortada)
    })

    test('debería manejar respuesta con array vacío', async () => {
      const mockArrayVacio = {
        success: true,
        data: [],
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockArrayVacio)

      await GET(mockRequest, mockParams)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockArrayVacio)
    })

    test('debería manejar ID con ceros a la izquierda', async () => {
      const mockParamsConCeros = {
        params: Promise.resolve({ id: '009' }),
      }

      const mockImagenResponse = {
        success: true,
        data: {
          id: 5,
          url: 'https://example.com/imagen-009.jpg',
          alt: 'Imagen destino 9',
          id_destino: 9,
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParamsConCeros)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(9)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockImagenResponse)
    })

    test('debería manejar ID muy grande', async () => {
      const mockParamsGrande = {
        params: Promise.resolve({ id: '999999' }),
      }

      const mockImagenResponse = {
        success: true,
        data: {
          id: 100,
          url: 'https://example.com/imagen-grande.jpg',
          alt: 'Destino con ID grande',
          id_destino: 999999,
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParamsGrande)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(999999)
      expect(mockJsonResponse).toHaveBeenCalledWith(mockImagenResponse)
    })
  })

  describe('Casos de error del servicio', () => {
    test('debería manejar error cuando el destino no existe', async () => {
      const mockErrorDestino = {
        success: false,
        error: 'Destino no encontrado',
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockErrorDestino)

      await GET(mockRequest, mockParams)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Destino no encontrado' },
        { status: 500 },
      )
    })

    test('debería manejar error de base de datos', async () => {
      const mockErrorBD = {
        success: false,
        error: 'Error de conexión a la base de datos',
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockErrorBD)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 },
      )
    })

    test('debería manejar error de archivo no encontrado', async () => {
      const mockErrorArchivo = {
        success: false,
        error: 'Archivo de imagen no encontrado en el servidor',
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockErrorArchivo)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Archivo de imagen no encontrado en el servidor' },
        { status: 500 },
      )
    })

    test('debería manejar error de permisos de acceso', async () => {
      const mockErrorPermisos = {
        success: false,
        error: 'Sin permisos para acceder a las imágenes',
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockErrorPermisos)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Sin permisos para acceder a las imágenes' },
        { status: 500 },
      )
    })

    test('debería manejar error de storage/CDN', async () => {
      const mockErrorStorage = {
        success: false,
        error: 'Error al acceder al almacenamiento de imágenes',
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockErrorStorage)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error al acceder al almacenamiento de imágenes' },
        { status: 500 },
      )
    })
  })

  describe('Casos de error de parámetros', () => {
    test('debería manejar ID no numérico', async () => {
      const mockParamsInvalidos = {
        params: Promise.resolve({ id: 'abc' }),
      }

      mockGetImagenByDestinoId.mockRejectedValue(
        new Error('ID debe ser numérico'),
      )

      await GET(mockRequest, mockParamsInvalidos)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en /api/usuarios/favoritos:',
        expect.any(Error),
      )
    })

    test('debería manejar ID con caracteres especiales', async () => {
      const mockParamsEspeciales = {
        params: Promise.resolve({ id: '1@#$' }),
      }

      mockGetImagenByDestinoId.mockRejectedValue(
        new Error('ID contiene caracteres inválidos'),
      )

      await GET(mockRequest, mockParamsEspeciales)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })

    test('debería manejar ID vacío', async () => {
      const mockParamsVacios = {
        params: Promise.resolve({ id: '' }),
      }

      mockGetImagenByDestinoId.mockRejectedValue(
        new Error('ID no puede estar vacío'),
      )

      await GET(mockRequest, mockParamsVacios)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })

    test('debería manejar ID negativo parseado correctamente', async () => {
      const mockParamsNegativo = {
        params: Promise.resolve({ id: '-5' }),
      }

      const mockImagenResponse = {
        success: true,
        data: null,
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParamsNegativo)

      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(-5)
    })
  })

  describe('Casos de excepciones inesperadas', () => {
    test('debería manejar excepción del servicio', async () => {
      mockGetImagenByDestinoId.mockRejectedValue(
        new Error('Error interno del servicio de imágenes'),
      )

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en /api/usuarios/favoritos:',
        expect.any(Error),
      )
    })

    test('debería manejar excepción de parsing de parámetros', async () => {
      const mockParamsError = {
        params: Promise.reject(new Error('Error al parsear parámetros')),
      }

      await GET(mockRequest, mockParamsError)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en /api/usuarios/favoritos:',
        expect.any(Error),
      )
    })

    test('debería manejar excepción de tipo string', async () => {
      mockGetImagenByDestinoId.mockRejectedValue('Error de tipo string')

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en /api/usuarios/favoritos:',
        'Error de tipo string',
      )
    })

    test('debería manejar excepción null', async () => {
      mockGetImagenByDestinoId.mockRejectedValue(null)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en /api/usuarios/favoritos:',
        null,
      )
    })

    test('debería manejar excepción undefined', async () => {
      mockGetImagenByDestinoId.mockRejectedValue(undefined)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en /api/usuarios/favoritos:',
        undefined,
      )
    })
  })

  describe('Casos edge con parsing de números', () => {
    test('debería manejar ID decimal', async () => {
      const mockParamsDecimal = {
        params: Promise.resolve({ id: '1.7' }),
      }

      const mockImagenResponse = {
        success: true,
        data: {
          id: 3,
          url: 'https://example.com/imagen-decimal.jpg',
          alt: 'Imagen con ID decimal',
          id_destino: 1,
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParamsDecimal)

      // parseInt debería convertir 1.7 a 1
      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(1)
    })

    test('debería manejar ID con espacios', async () => {
      const mockParamsConEspacios = {
        params: Promise.resolve({ id: ' 42 ' }),
      }

      const mockImagenResponse = {
        success: true,
        data: {
          id: 8,
          url: 'https://example.com/imagen-espacios.jpg',
          alt: 'Imagen con espacios',
          id_destino: 42,
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParamsConEspacios)

      // parseInt debería manejar espacios correctamente
      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(42)
    })

    test('debería manejar ID con notación científica', async () => {
      const mockParamsCientifico = {
        params: Promise.resolve({ id: '2e3' }),
      }

      const mockImagenResponse = {
        success: true,
        data: {
          id: 10,
          url: 'https://example.com/imagen-cientifico.jpg',
          alt: 'Imagen científica',
          id_destino: 2,
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenResponse)

      await GET(mockRequest, mockParamsCientifico)

      // parseInt('2e3') = 2 (no reconoce notación científica)
      expect(mockGetImagenByDestinoId).toHaveBeenCalledWith(2)
    })
  })

  describe('Casos específicos de imágenes', () => {
    test('debería manejar respuesta con metadata de imagen completa', async () => {
      const mockImagenCompleta = {
        success: true,
        data: {
          id: 15,
          url: 'https://cdn.example.com/destinos/portada-1.webp',
          alt: 'Vista panorámica del Salto del Tigre',
          id_destino: 1,
          es_portada: true,
          width: 1920,
          height: 1080,
          formato: 'webp',
          tamaño: '245KB',
          fecha_subida: '2024-01-15T10:30:00Z',
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenCompleta)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(mockImagenCompleta)
    })

    test('debería manejar URLs de diferentes proveedores de storage', async () => {
      const mockImagenCloudinary = {
        success: true,
        data: {
          id: 20,
          url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/destinos/portada.jpg',
          alt: 'Portada desde Cloudinary',
          id_destino: 1,
          proveedor: 'cloudinary',
        },
      }

      mockGetImagenByDestinoId.mockResolvedValue(mockImagenCloudinary)

      await GET(mockRequest, mockParams)

      expect(mockJsonResponse).toHaveBeenCalledWith(mockImagenCloudinary)
    })
  })
})
