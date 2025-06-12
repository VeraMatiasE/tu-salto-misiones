import { GET, PUT, DELETE } from '@/app/api/imagenes/[id]/route'
import {
  getImagenById,
  updateImagen,
  deleteImagen,
} from '@/services/imagenes-destino.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/imagenes-destino.service')
const mockGetImagenById = getImagenById as jest.MockedFunction<
  typeof getImagenById
>
const mockUpdateImagen = updateImagen as jest.MockedFunction<
  typeof updateImagen
>
const mockDeleteImagen = deleteImagen as jest.MockedFunction<
  typeof deleteImagen
>

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

describe('API Imagenes [id]', () => {
  let mockJsonResponse: jest.Mock
  let mockRequest: NextRequest

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse
    mockRequest = {} as NextRequest

    mockGetImagenById.mockClear()
    mockUpdateImagen.mockClear()
    mockDeleteImagen.mockClear()
    mockJsonResponse.mockClear()
  })

  describe('GET - Obtener imagen por ID', () => {
    describe('Casos exitosos', () => {
      test('debería retornar la imagen correctamente con ID válido', async () => {
        const mockImagen = {
          success: true,
          data: {
            id: 1,
            url: 'imagen1.jpg',
            descripcion: 'Vista frontal',
            id_destino: 1,
          },
        }

        mockGetImagenById.mockResolvedValue(mockImagen)

        const params = Promise.resolve({ id: '1' })
        await GET(mockRequest, { params })

        expect(mockGetImagenById).toHaveBeenCalledWith(1)
        expect(mockJsonResponse).toHaveBeenCalledWith(mockImagen)
      })
    })

    describe('Casos de error', () => {
      test('debería retornar error 400 con ID inválido (no numérico)', async () => {
        const params = Promise.resolve({ id: 'abc' })
        await GET(mockRequest, { params })

        expect(mockGetImagenById).not.toHaveBeenCalled()
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'ID de imagen inválido' },
          { status: 400 },
        )
      })

      test('debería retornar error 400 con ID vacío', async () => {
        const params = Promise.resolve({ id: '' })
        await GET(mockRequest, { params })

        expect(mockGetImagenById).not.toHaveBeenCalled()
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'ID de imagen inválido' },
          { status: 400 },
        )
      })

      test('debería retornar error 404 cuando la imagen no existe', async () => {
        mockGetImagenById.mockResolvedValue({
          success: false,
          error: 'Imagen no encontrada',
        })

        const params = Promise.resolve({ id: '999' })
        await GET(mockRequest, { params })

        expect(mockGetImagenById).toHaveBeenCalledWith(999)
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'Imagen no encontrada' },
          { status: 404 },
        )
      })
    })
  })

  describe('PUT - Actualizar imagen', () => {
    describe('Casos exitosos', () => {
      test('debería actualizar la imagen correctamente', async () => {
        const updateData = {
          descripcion: 'Nueva descripción',
          url: 'nueva-imagen.jpg',
        }

        const mockResponse = {
          success: true,
          data: {
            id: 1,
            ...updateData,
            id_destino: 1,
          },
        }

        mockRequest.json = jest.fn().mockResolvedValue(updateData)
        mockUpdateImagen.mockResolvedValue(mockResponse)

        const params = Promise.resolve({ id: '1' })
        await PUT(mockRequest, { params })

        expect(mockUpdateImagen).toHaveBeenCalledWith(1, updateData)
        expect(mockJsonResponse).toHaveBeenCalledWith(mockResponse)
      })
    })

    describe('Casos de error', () => {
      test('debería retornar error 400 con ID inválido', async () => {
        const params = Promise.resolve({ id: 'abc' })
        await PUT(mockRequest, { params })

        expect(mockUpdateImagen).not.toHaveBeenCalled()
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'ID de imagen inválido' },
          { status: 400 },
        )
      })

      test('debería retornar error 400 cuando el servicio falla', async () => {
        const updateData = { descripcion: 'Nueva descripción' }

        mockRequest.json = jest.fn().mockResolvedValue(updateData)
        mockUpdateImagen.mockResolvedValue({
          success: false,
          error: 'Error al actualizar imagen',
        })

        const params = Promise.resolve({ id: '1' })
        await PUT(mockRequest, { params })

        expect(mockUpdateImagen).toHaveBeenCalledWith(1, updateData)
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'Error al actualizar imagen' },
          { status: 400 },
        )
      })

      test('debería retornar error 400 cuando falla el parsing del JSON', async () => {
        mockRequest.json = jest
          .fn()
          .mockRejectedValue(new Error('JSON inválido'))

        const params = Promise.resolve({ id: '1' })
        await PUT(mockRequest, { params })

        expect(mockUpdateImagen).not.toHaveBeenCalled()
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'Error al procesar la solicitud' },
          { status: 400 },
        )
      })
    })
  })

  describe('DELETE - Eliminar imagen', () => {
    describe('Casos exitosos', () => {
      test('debería eliminar la imagen correctamente', async () => {
        const mockResponse = {
          success: true,
          message: 'Imagen eliminada correctamente',
        }

        mockDeleteImagen.mockResolvedValue(mockResponse)

        const params = Promise.resolve({ id: '1' })
        await DELETE(mockRequest, { params })

        expect(mockDeleteImagen).toHaveBeenCalledWith(1)
        expect(mockJsonResponse).toHaveBeenCalledWith(mockResponse)
      })
    })

    describe('Casos de error', () => {
      test('debería retornar error 400 con ID inválido', async () => {
        const params = Promise.resolve({ id: 'abc' })
        await DELETE(mockRequest, { params })

        expect(mockDeleteImagen).not.toHaveBeenCalled()
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'ID de imagen inválido' },
          { status: 400 },
        )
      })

      test('debería retornar error 400 cuando el servicio falla', async () => {
        mockDeleteImagen.mockResolvedValue({
          success: false,
          error: 'Error al eliminar imagen',
        })

        const params = Promise.resolve({ id: '1' })
        await DELETE(mockRequest, { params })

        expect(mockDeleteImagen).toHaveBeenCalledWith(1)
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'Error al eliminar imagen' },
          { status: 400 },
        )
      })

      test('debería retornar error 400 cuando la imagen no se puede eliminar', async () => {
        mockDeleteImagen.mockResolvedValue({
          success: false,
          error: 'La imagen está siendo utilizada',
        })

        const params = Promise.resolve({ id: '1' })
        await DELETE(mockRequest, { params })

        expect(mockDeleteImagen).toHaveBeenCalledWith(1)
        expect(mockJsonResponse).toHaveBeenCalledWith(
          { error: 'La imagen está siendo utilizada' },
          { status: 400 },
        )
      })
    })
  })

  describe('Casos de excepción no controlada', () => {
    test('GET debería propagar excepciones del servicio', async () => {
      mockGetImagenById.mockRejectedValue(new Error('Error de base de datos'))

      const params = Promise.resolve({ id: '1' })

      await expect(GET(mockRequest, { params })).rejects.toThrow(
        'Error de base de datos',
      )
    })

    test('DELETE debería propagar excepciones del servicio', async () => {
      mockDeleteImagen.mockRejectedValue(new Error('Error de base de datos'))

      const params = Promise.resolve({ id: '1' })

      await expect(DELETE(mockRequest, { params })).rejects.toThrow(
        'Error de base de datos',
      )
    })
  })
})
