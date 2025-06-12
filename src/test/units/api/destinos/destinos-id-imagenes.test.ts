import { GET, POST } from '@/app/api/destinos/[id]/imagenes/route'
import {
  getImagenesByDestinoId,
  uploadImage,
} from '@/services/imagenes-destino.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/imagenes-destino.service')
const mockGetImagenesByDestinoId =
  getImagenesByDestinoId as jest.MockedFunction<typeof getImagenesByDestinoId>
const mockUploadImage = uploadImage as jest.MockedFunction<typeof uploadImage>

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

describe('API Imágenes Destinos - GET', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockContext: { params: Promise<{ id: string }> }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {} as NextRequest

    mockGetImagenesByDestinoId.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('Obtención exitosa de imágenes', () => {
    test('debería obtener imágenes por ID de destino correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const imagenesResponse = {
        success: true,
        data: [
          {
            id: 1,
            destinoId: 123,
            url: 'https://example.com/image1.jpg',
            descripcion: 'Vista principal',
          },
          {
            id: 2,
            destinoId: 123,
            url: 'https://example.com/image2.jpg',
            descripcion: 'Vista lateral',
          },
        ],
      }

      mockGetImagenesByDestinoId.mockResolvedValue(imagenesResponse)

      await GET(mockRequest, mockContext)

      expect(mockGetImagenesByDestinoId).toHaveBeenCalledWith(123)
      expect(mockJsonResponse).toHaveBeenCalledWith(imagenesResponse)
    })

    test('debería retornar array vacío cuando no hay imágenes', async () => {
      mockContext = {
        params: Promise.resolve({ id: '456' }),
      }

      const emptyResponse = {
        success: true,
        data: [],
      }

      mockGetImagenesByDestinoId.mockResolvedValue(emptyResponse)

      await GET(mockRequest, mockContext)

      expect(mockGetImagenesByDestinoId).toHaveBeenCalledWith(456)
      expect(mockJsonResponse).toHaveBeenCalledWith(emptyResponse)
    })
  })

  describe('ID inválido', () => {
    test('debería retornar error 400 para ID no numérico', async () => {
      mockContext = {
        params: Promise.resolve({ id: 'abc' }),
      }

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino inválido' },
        { status: 400 },
      )
      expect(mockGetImagenesByDestinoId).not.toHaveBeenCalled()
    })

    test('debería retornar error 400 para ID vacío', async () => {
      mockContext = {
        params: Promise.resolve({ id: '' }),
      }

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino inválido' },
        { status: 400 },
      )
    })
  })

  describe('Errores del servicio', () => {
    test('debería retornar error 500 cuando el servicio falla', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      mockGetImagenesByDestinoId.mockResolvedValue({
        success: false,
        error: 'Error de base de datos',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error de base de datos' },
        { status: 500 },
      )
    })
  })
})

describe('API Imágenes Destinos - POST', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockContext: { params: Promise<{ id: string }> }
  let mockFormData: FormData

  const mockConsoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {})

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockFormData = new FormData()
    mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    mockUploadImage.mockClear()
    mockJsonResponse.mockClear()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('Upload exitoso', () => {
    test('debería subir imagen JPEG correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const mockFile = new File(['imagen contenido'], 'test.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }) // 1MB

      mockFormData.set('image', mockFile)

      const uploadResponse = {
        success: true,
        data: {
          id: 1,
          destinoId: 123,
          url: 'https://storage.example.com/uploaded-image.jpg',
          descripcion: 'Nueva imagen',
        },
      }

      mockUploadImage.mockResolvedValue(uploadResponse)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile, 123)
      expect(mockJsonResponse).toHaveBeenCalledWith(uploadResponse, {
        status: 201,
      })
    })

    test('debería subir imagen PNG correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '456' }),
      }

      const mockFile = new File(['imagen contenido'], 'test.png', {
        type: 'image/png',
      })
      Object.defineProperty(mockFile, 'size', { value: 2 * 1024 * 1024 }) // 2MB

      mockFormData.set('image', mockFile)

      const uploadResponse = {
        success: true,
        data: { id: 2, destinoId: 456, url: 'https://example.com/test.png' },
      }

      mockUploadImage.mockResolvedValue(uploadResponse)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile, 456)
      expect(mockJsonResponse).toHaveBeenCalledWith(uploadResponse, {
        status: 201,
      })
    })

    test('debería subir imagen WebP correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '789' }),
      }

      const mockFile = new File(['imagen contenido'], 'test.webp', {
        type: 'image/webp',
      })
      Object.defineProperty(mockFile, 'size', { value: 512 * 1024 }) // 512KB

      mockFormData.set('image', mockFile)

      const uploadResponse = {
        success: true,
        data: { id: 3, destinoId: 789, url: 'https://example.com/test.webp' },
      }

      mockUploadImage.mockResolvedValue(uploadResponse)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile, 789)
    })
  })

  describe('ID inválido', () => {
    test('debería retornar error 400 para ID inválido', async () => {
      mockContext = {
        params: Promise.resolve({ id: 'invalid' }),
      }

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino inválido' },
        { status: 400 },
      )
      expect(mockUploadImage).not.toHaveBeenCalled()
    })
  })

  describe('Validación de archivo', () => {
    beforeEach(() => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }
    })

    test('debería retornar error cuando no hay imagen', async () => {
      mockFormData.delete('image')

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'No se encontró la imagen' },
        { status: 400 },
      )
      expect(mockUploadImage).not.toHaveBeenCalled()
    })

    test('debería retornar error para tipo de archivo no permitido', async () => {
      const mockFile = new File(['contenido'], 'test.pdf', {
        type: 'application/pdf',
      })

      mockFormData.set('image', mockFile)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'El archivo debe ser una imagen' },
        { status: 400 },
      )
      expect(mockUploadImage).not.toHaveBeenCalled()
    })

    test('debería retornar error para imagen GIF (no permitida)', async () => {
      const mockFile = new File(['contenido'], 'test.gif', {
        type: 'image/gif',
      })

      mockFormData.set('image', mockFile)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'El archivo debe ser una imagen' },
        { status: 400 },
      )
    })

    test('debería retornar error para imagen demasiado grande', async () => {
      const mockFile = new File(['contenido muy largo'], 'test.jpg', {
        type: 'image/jpeg',
      })
      // < 5MB
      Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 })

      mockFormData.set('image', mockFile)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'La imagen es demasiado grande (máximo 5MB)' },
        { status: 400 },
      )
      expect(mockUploadImage).not.toHaveBeenCalled()
    })

    test('debería aceptar imagen en el límite de tamaño (5MB exactos)', async () => {
      const mockFile = new File(['contenido'], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(mockFile, 'size', { value: 5 * 1024 * 1024 }) // 5MB

      mockFormData.set('image', mockFile)

      mockUploadImage.mockResolvedValue({
        success: true,
        data: { id: 1, destinoId: 123, url: 'https://example.com/test.jpg' },
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockUploadImage).toHaveBeenCalledWith(mockFile, 123)
    })
  })

  describe('Errores del servicio de upload', () => {
    beforeEach(() => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const mockFile = new File(['contenido'], 'test.jpg', {
        type: 'image/jpeg',
      })
      Object.defineProperty(mockFile, 'size', { value: 1024 })

      mockFormData.set('image', mockFile)
    })

    test('debería manejar error del servicio de upload', async () => {
      mockUploadImage.mockResolvedValue({
        success: false,
        error: 'Error al subir archivo al storage',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en upload:',
        'Error al subir archivo al storage',
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'Error interno del servidor' },
        { status: 500 },
      )
    })

    test('debería manejar excepción del servicio de upload', async () => {
      mockUploadImage.mockRejectedValue(new Error('Error de conexión'))

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en upload:',
        expect.any(Error),
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })

  describe('Errores de FormData', () => {
    test('debería manejar error al procesar FormData', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }
      ;(mockRequest.formData as jest.Mock).mockRejectedValue(
        new Error('FormData inválido'),
      )

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await POST(mockRequest, mockContext)

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error en upload:',
        expect.any(Error),
      )
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })
})

describe('Casos límite de validación', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockContext: { params: Promise<{ id: string }> }
  let mockFormData: FormData

  beforeEach(() => {
    mockJsonResponse = jest.fn().mockReturnValue({ status: jest.fn() })
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockFormData = new FormData()
    mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    mockContext = {
      params: Promise.resolve({ id: '123' }),
    }
  })

  test('debería manejar archivo con tamaño 0', async () => {
    const mockFile = new File([''], 'test.jpg', {
      type: 'image/jpeg',
    })
    Object.defineProperty(mockFile, 'size', { value: 0 })

    mockFormData.set('image', mockFile)

    mockUploadImage.mockResolvedValue({
      success: true,
      data: { id: 1, destinoId: 123, url: 'https://example.com/test.jpg' },
    })

    await POST(mockRequest, mockContext)

    expect(mockUploadImage).toHaveBeenCalled()
  })

  test('debería manejar archivo sin extensión pero con tipo MIME válido', async () => {
    const mockFile = new File(['contenido'], 'imagen_sin_extension', {
      type: 'image/png',
    })
    Object.defineProperty(mockFile, 'size', { value: 1024 })

    mockFormData.set('image', mockFile)

    mockUploadImage.mockResolvedValue({
      success: true,
      data: { id: 1, destinoId: 123, url: 'https://example.com/imagen.png' },
    })

    await POST(mockRequest, mockContext)

    expect(mockUploadImage).toHaveBeenCalledWith(mockFile, 123)
    expect(mockJsonResponse).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
      { status: 201 },
    )
  })
})
