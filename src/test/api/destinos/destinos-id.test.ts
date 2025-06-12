import { GET, PUT, DELETE } from '@/app/api/destinos/[id]/route'
import {
  getDestinoById,
  updateDestino,
  deleteDestino,
} from '@/services/destinos.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/destinos.service')
const mockGetDestinoById = getDestinoById as jest.MockedFunction<
  typeof getDestinoById
>
const mockUpdateDestino = updateDestino as jest.MockedFunction<
  typeof updateDestino
>
const mockDeleteDestino = deleteDestino as jest.MockedFunction<
  typeof deleteDestino
>

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

describe('API Destinos/[id] - GET', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockContext: { params: Promise<{ id: string }> }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {} as NextRequest

    mockGetDestinoById.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('ID válido', () => {
    test('debería obtener un destino por ID correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const destinoMock = {
        success: true,
        data: {
          id: 123,
          nombre: 'Playa Paradise',
          ubicacion: 'Costa Rica',
          puntuacion: 4.5,
        },
      }

      mockGetDestinoById.mockResolvedValue(destinoMock)

      await GET(mockRequest, mockContext)

      expect(mockGetDestinoById).toHaveBeenCalledWith(123)
      expect(mockJsonResponse).toHaveBeenCalledWith(destinoMock)
    })

    test('debería manejar ID con ceros a la izquierda', async () => {
      mockContext = {
        params: Promise.resolve({ id: '0123' }),
      }

      const destinoMock = {
        success: true,
        data: { id: 123, nombre: 'Test' },
      }

      mockGetDestinoById.mockResolvedValue(destinoMock)

      await GET(mockRequest, mockContext)

      expect(mockGetDestinoById).toHaveBeenCalledWith(123)
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
      expect(mockGetDestinoById).not.toHaveBeenCalled()
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

  describe('Destino no encontrado', () => {
    test('debería retornar error 404 cuando el destino no existe', async () => {
      mockContext = {
        params: Promise.resolve({ id: '999' }),
      }

      mockGetDestinoById.mockResolvedValue({
        success: false,
        error: 'Destino no encontrado',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await GET(mockRequest, mockContext)

      expect(mockGetDestinoById).toHaveBeenCalledWith(999)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Destino no encontrado' },
        { status: 404 },
      )
    })
  })
})

describe('API Destinos/[id] - PUT', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockContext: { params: Promise<{ id: string }> }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      json: jest.fn(),
    } as unknown as NextRequest

    mockUpdateDestino.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('Actualización exitosa', () => {
    test('debería actualizar un destino correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const updateData = {
        nombre: 'Playa Paradise Actualizada',
        puntuacion: 4.8,
      }

      const updatedDestino = {
        success: true,
        data: {
          id: 123,
          nombre: 'Playa Paradise Actualizada',
          ubicacion: 'Costa Rica',
          puntuacion: 4.8,
        },
      }

      ;(mockRequest.json as jest.Mock).mockResolvedValue(updateData)
      mockUpdateDestino.mockResolvedValue(updatedDestino)

      await PUT(mockRequest, mockContext)

      expect(mockUpdateDestino).toHaveBeenCalledWith(123, updateData)
      expect(mockJsonResponse).toHaveBeenCalledWith(updatedDestino)
    })
  })

  describe('ID inválido', () => {
    test('debería retornar error 400 para ID inválido', async () => {
      mockContext = {
        params: Promise.resolve({ id: 'invalid' }),
      }

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await PUT(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino inválido' },
        { status: 400 },
      )
      expect(mockUpdateDestino).not.toHaveBeenCalled()
    })
  })

  describe('Errores de validación', () => {
    test('debería retornar error 400 para datos inválidos', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const invalidData = {
        nombre: '',
        puntuacion: -1,
      }

      ;(mockRequest.json as jest.Mock).mockResolvedValue(invalidData)
      mockUpdateDestino.mockResolvedValue({
        success: false,
        error: 'Datos de destino inválidos',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await PUT(mockRequest, mockContext)

      expect(mockUpdateDestino).toHaveBeenCalledWith(123, invalidData)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Datos de destino inválidos' },
        { status: 400 },
      )
    })
  })

  describe('Errores de JSON', () => {
    test('debería manejar JSON malformado', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }
      ;(mockRequest.json as jest.Mock).mockRejectedValue(
        new SyntaxError('JSON inválido'),
      )

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await PUT(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error al procesar la solicitud' },
        { status: 400 },
      )
      expect(mockUpdateDestino).not.toHaveBeenCalled()
    })

    test('debería manejar cualquier otra excepción', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }
      ;(mockRequest.json as jest.Mock).mockRejectedValue(
        new Error('Error inesperado'),
      )

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await PUT(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error al procesar la solicitud' },
        { status: 400 },
      )
    })
  })
})

describe('API Destinos/[id] - DELETE', () => {
  let mockRequest: NextRequest
  let mockJsonResponse: jest.Mock
  let mockContext: { params: Promise<{ id: string }> }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {} as NextRequest

    mockDeleteDestino.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('Eliminación exitosa', () => {
    test('debería eliminar un destino correctamente', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      const deleteResponse = {
        success: true,
        message: 'Destino eliminado correctamente',
      }

      mockDeleteDestino.mockResolvedValue(deleteResponse)

      await DELETE(mockRequest, mockContext)

      expect(mockDeleteDestino).toHaveBeenCalledWith(123)
      expect(mockJsonResponse).toHaveBeenCalledWith(deleteResponse)
    })
  })

  describe('ID inválido', () => {
    test('debería retornar error 400 para ID inválido', async () => {
      mockContext = {
        params: Promise.resolve({ id: 'abc123' }),
      }

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await DELETE(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino inválido' },
        { status: 400 },
      )
      expect(mockDeleteDestino).not.toHaveBeenCalled()
    })

    test('debería retornar error 400 para ID negativo', async () => {
      mockContext = {
        params: Promise.resolve({ id: '-123' }),
      }

      // parseInt('-123') = -123, que es un número válido pero ID negativo
      const deleteResponse = {
        success: false,
        error: 'Destino no encontrado',
      }

      mockDeleteDestino.mockResolvedValue(deleteResponse)
      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await DELETE(mockRequest, mockContext)

      expect(mockDeleteDestino).toHaveBeenCalledWith(-123)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Destino no encontrado' },
        { status: 400 },
      )
    })
  })

  describe('Destino no encontrado', () => {
    test('debería retornar error 400 cuando el destino no existe', async () => {
      mockContext = {
        params: Promise.resolve({ id: '999' }),
      }

      mockDeleteDestino.mockResolvedValue({
        success: false,
        error: 'Destino no encontrado',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await DELETE(mockRequest, mockContext)

      expect(mockDeleteDestino).toHaveBeenCalledWith(999)
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Destino no encontrado' },
        { status: 400 },
      )
    })

    test('debería manejar error de integridad referencial', async () => {
      mockContext = {
        params: Promise.resolve({ id: '123' }),
      }

      mockDeleteDestino.mockResolvedValue({
        success: false,
        error:
          'No se puede eliminar el destino porque tiene reservas asociadas',
      })

      mockJsonResponse.mockReturnValue({ status: jest.fn() })

      await DELETE(mockRequest, mockContext)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          error:
            'No se puede eliminar el destino porque tiene reservas asociadas',
        },
        { status: 400 },
      )
    })
  })
})

describe('Casos especiales de parsing de ID', () => {
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn().mockReturnValue({ status: jest.fn() })
    ;(NextResponse.json as jest.Mock) = mockJsonResponse
  })

  test('debería manejar ID con espacios', async () => {
    const mockContext = {
      params: Promise.resolve({ id: ' 123 ' }),
    }

    await GET({} as NextRequest, mockContext)

    expect(mockGetDestinoById).toHaveBeenCalledWith(123)
  })

  test('debería manejar ID con caracteres especiales al final', async () => {
    const mockContext = {
      params: Promise.resolve({ id: '123abc' }),
    }

    await GET({} as NextRequest, mockContext)

    // parseInt('123abc') = 123
    expect(mockGetDestinoById).toHaveBeenCalledWith(123)
  })

  test('debería rechazar ID que comience con caracteres no numéricos', async () => {
    const mockContext = {
      params: Promise.resolve({ id: 'abc123' }),
    }

    await GET({} as NextRequest, mockContext)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'ID de destino inválido' },
      { status: 400 },
    )
    expect(mockGetDestinoById).not.toHaveBeenCalled()
  })
})
