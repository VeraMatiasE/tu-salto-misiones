import {
  GET as getResenasUsuario,
  POST as createResenaUsuario,
  PUT as updateResenaUsuario,
  DELETE as deleteResenaUsuario,
} from '@/app/api/usuarios/resenas/route'
import { getUserByUid } from '@/services/usuarios.service'
import {
  getResenasByUsuario,
  createResena,
  updateResena,
  deleteResena,
  getResenaById,
} from '@/services/resenas.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/usuarios.service')
jest.mock('@/services/resenas.service')
jest.mock('@/utils/supabase/server')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockGetUserByUid = getUserByUid as jest.MockedFunction<
  typeof getUserByUid
>
const mockGetResenasByUsuario = getResenasByUsuario as jest.MockedFunction<
  typeof getResenasByUsuario
>
const mockCreateResena = createResena as jest.MockedFunction<
  typeof createResena
>
const mockUpdateResena = updateResena as jest.MockedFunction<
  typeof updateResena
>
const mockDeleteResena = deleteResena as jest.MockedFunction<
  typeof deleteResena
>
const mockGetResenaById = getResenaById as jest.MockedFunction<
  typeof getResenaById
>
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API Usuarios Reseñas', () => {
  let mockJsonResponse: jest.Mock
  let mockSupabaseClient: {
    auth: {
      getUser: jest.Mock
    }
  }

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    }
    mockCreateSupabaseClient.mockResolvedValue(
      mockSupabaseClient as unknown as Awaited<
        ReturnType<typeof createSupabaseClient>
      >,
    )

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserByUid.mockResolvedValue({
      success: true,
      data: { id_usuario: 1, nombre: 'Usuario Test' },
    })

    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('GET /api/usuarios/resenas', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        url: 'http://localhost:3000/api/usuarios/resenas',
      } as NextRequest
    })

    test('debería obtener reseñas del usuario', async () => {
      const resenasData = {
        data: [],
        pagination: {
          total: 0,
          currentPage: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      }

      mockGetResenasByUsuario.mockResolvedValue({
        success: true,
        data: resenasData,
      })

      await getResenasUsuario(mockRequest)

      expect(mockGetResenasByUsuario).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
        orderBy: 'fecha_actualizacion',
        orderDirection: 'desc',
      })

      expect(mockJsonResponse).toHaveBeenCalledWith(resenasData)
    })

    test('debería retornar error 401 para usuario no autenticado', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No autorizado' },
      })

      await getResenasUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'No autorizado' },
        { status: 401 },
      )
    })

    test('debería retornar error 404 cuando usuario no existe en BD', async () => {
      mockGetUserByUid.mockResolvedValue({
        success: false,
        error: 'Usuario no encontrado',
      })

      await getResenasUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Usuario no encontrado en la base de datos' },
        { status: 404 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockGetResenasByUsuario.mockRejectedValue(
        new Error('Error de base de datos'),
      )

      await getResenasUsuario(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })

  describe('POST /api/usuarios/resenas', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_destino: 1,
          calificacion: 5,
          comentario: 'Excelente lugar',
        }),
      } as unknown as NextRequest
    })

    test('debería crear reseña correctamente', async () => {
      const resenaData = {
        id_resena: 1,
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: 'Excelente lugar',
      }

      mockCreateResena.mockResolvedValue({
        success: true,
        data: resenaData,
      })

      await createResenaUsuario(mockRequest)

      expect(mockCreateResena).toHaveBeenCalledWith({
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: 'Excelente lugar',
        estatus: true,
      })

      expect(mockJsonResponse).toHaveBeenCalledWith(resenaData, { status: 201 })
    })

    test('debería crear reseña sin comentario', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_destino: 1,
          calificacion: 5,
          // Sin comentario
        }),
      } as unknown as NextRequest

      const resenaData = {
        id_resena: 1,
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: '',
      }

      mockCreateResena.mockResolvedValue({
        success: true,
        data: resenaData,
      })

      await createResenaUsuario(mockRequest)

      expect(mockCreateResena).toHaveBeenCalledWith({
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: '',
        estatus: true,
      })
    })

    test('debería retornar error 400 para calificación inválida', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_destino: 1,
          calificacion: 6, // Inválida
        }),
      } as unknown as NextRequest

      await createResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        {
          error:
            'Datos de reseña inválidos. La calificación debe estar entre 1 y 5.',
        },
        { status: 400 },
      )
    })

    test('debería retornar error 409 para reseña duplicada', async () => {
      mockCreateResena.mockResolvedValue({
        success: false,
        error: 'Ya tienes una reseña para este salto',
      })

      await createResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Ya tienes una reseña para este salto' },
        { status: 409 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockCreateResena.mockRejectedValue(new Error('Error de base de datos'))

      await createResenaUsuario(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })

  describe('PUT /api/usuarios/resenas', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_resena: 1,
          calificacion: 4,
          comentario: 'Muy buen lugar',
        }),
      } as unknown as NextRequest
    })

    test('debería actualizar reseña correctamente', async () => {
      const existingResena = {
        id_resena: 1,
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: 'Excelente lugar',
      }

      const updatedResena = {
        ...existingResena,
        calificacion: 4,
        comentario: 'Muy buen lugar',
      }

      mockGetResenaById.mockResolvedValue({
        success: true,
        data: existingResena,
      })

      mockUpdateResena.mockResolvedValue({
        success: true,
        data: updatedResena,
      })

      await updateResenaUsuario(mockRequest)

      expect(mockUpdateResena).toHaveBeenCalledWith(1, {
        calificacion: 4,
        comentario: 'Muy buen lugar',
      })

      expect(mockJsonResponse).toHaveBeenCalledWith(updatedResena)
    })

    test('debería actualizar reseña sin comentario', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({
          id_resena: 1,
          calificacion: 4,
          // Sin comentario
        }),
      } as unknown as NextRequest

      const existingResena = {
        id_resena: 1,
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: 'Comentario anterior',
      }

      const updatedResena = {
        ...existingResena,
        calificacion: 4,
        comentario: '',
      }

      mockGetResenaById.mockResolvedValue({
        success: true,
        data: existingResena,
      })

      mockUpdateResena.mockResolvedValue({
        success: true,
        data: updatedResena,
      })

      await updateResenaUsuario(mockRequest)

      expect(mockUpdateResena).toHaveBeenCalledWith(1, {
        calificacion: 4,
        comentario: '',
      })
    })

    test('debería retornar error 403 cuando usuario no es propietario', async () => {
      const existingResena = {
        id_resena: 1,
        id_usuario: 2, // Diferente usuario
        id_destino: 1,
        calificacion: 5,
        comentario: 'Excelente lugar',
      }

      mockGetResenaById.mockResolvedValue({
        success: true,
        data: existingResena,
      })

      await updateResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'No tienes permisos para editar esta reseña' },
        { status: 403 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockGetResenaById.mockRejectedValue(new Error('Error de base de datos'))

      await updateResenaUsuario(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })

  describe('DELETE /api/usuarios/resenas', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        url: 'http://localhost:3000/api/usuarios/resenas?reseñaId=1',
      } as NextRequest
    })

    test('debería eliminar reseña correctamente', async () => {
      const existingResena = {
        id_resena: 1,
        id_usuario: 1,
        id_destino: 1,
        calificacion: 5,
        comentario: 'Excelente lugar',
      }

      mockGetResenaById.mockResolvedValue({
        success: true,
        data: existingResena,
      })

      mockDeleteResena.mockResolvedValue({
        success: true,
        data: { message: 'Reseña eliminada' },
      })

      await deleteResenaUsuario(mockRequest)

      expect(mockDeleteResena).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith({
        message: 'Reseña eliminada exitosamente',
      })
    })

    test('debería retornar error 400 cuando falta ID de reseña', async () => {
      mockRequest = {
        url: 'http://localhost:3000/api/usuarios/resenas',
      } as NextRequest

      await deleteResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de reseña requerido' },
        { status: 400 },
      )
    })

    test('debería retornar error 400 para ID de reseña inválido', async () => {
      mockRequest = {
        url: 'http://localhost:3000/api/usuarios/resenas?reseñaId=invalid',
      } as NextRequest

      await deleteResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de reseña inválido' },
        { status: 400 },
      )
    })

    test('debería retornar error 404 cuando reseña no existe', async () => {
      mockGetResenaById.mockResolvedValue({
        success: false,
        error: 'Reseña no encontrada',
      })

      await deleteResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Reseña no encontrada' },
        { status: 404 },
      )
    })

    test('debería retornar error 403 cuando usuario no es propietario', async () => {
      const existingResena = {
        id_resena: 1,
        id_usuario: 2, // Diferente usuario
        id_destino: 1,
        calificacion: 5,
        comentario: 'Excelente lugar',
      }

      mockGetResenaById.mockResolvedValue({
        success: true,
        data: existingResena,
      })

      await deleteResenaUsuario(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'No tienes permisos para eliminar esta reseña' },
        { status: 403 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockGetResenaById.mockRejectedValue(new Error('Error de base de datos'))

      await deleteResenaUsuario(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })
})
