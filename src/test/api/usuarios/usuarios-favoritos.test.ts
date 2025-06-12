import {
  GET as getFavoritos,
  POST as createFavorito,
  DELETE as deleteFavorito,
} from '@/app/api/usuarios/favoritos/route'
import { getUserByUid } from '@/services/usuarios.service'
import {
  getFavoritosByUsuario,
  createFavorito as createFavoritoService,
  deleteFavorito as deleteFavoritoService,
} from '@/services/favoritos.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/usuarios.service')
jest.mock('@/services/favoritos.service')
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
const mockGetFavoritosByUsuario = getFavoritosByUsuario as jest.MockedFunction<
  typeof getFavoritosByUsuario
>
const mockCreateFavorito = createFavoritoService as jest.MockedFunction<
  typeof createFavoritoService
>
const mockDeleteFavorito = deleteFavoritoService as jest.MockedFunction<
  typeof deleteFavoritoService
>
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API /api/usuarios/favoritos', () => {
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

    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('GET /api/usuarios/favoritos', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        url: 'http://localhost:3000/api/usuarios/favoritos',
      } as NextRequest

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockGetUserByUid.mockResolvedValue({
        success: true,
        data: { id_usuario: 1, nombre: 'Usuario Test' },
      })
    })

    test('debería obtener favoritos del usuario autenticado', async () => {
      const favoritosData = {
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

      mockGetFavoritosByUsuario.mockResolvedValue({
        success: true,
        data: favoritosData,
      })

      await getFavoritos(mockRequest)

      expect(mockGetFavoritosByUsuario).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 10,
        orderBy: 'fecha_actualizacion',
        orderDirection: 'desc',
      })

      expect(mockJsonResponse).toHaveBeenCalledWith(favoritosData)
    })

    test('debería retornar error 401 para usuario no autenticado', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No autorizado' },
      })

      await getFavoritos(mockRequest)

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

      await getFavoritos(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Usuario no encontrado en la base de datos' },
        { status: 404 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockGetFavoritosByUsuario.mockRejectedValue(
        new Error('Error de base de datos'),
      )

      await getFavoritos(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })

  describe('POST /api/usuarios/favoritos', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({ id_destino: 1 }),
      } as unknown as NextRequest

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockGetUserByUid.mockResolvedValue({
        success: true,
        data: { id_usuario: 1, nombre: 'Usuario Test' },
      })
    })

    test('debería crear favorito correctamente', async () => {
      const favoritoData = { id_favorito: 1, id_usuario: 1, id_destino: 1 }

      mockCreateFavorito.mockResolvedValue({
        success: true,
        data: favoritoData,
      })

      await createFavorito(mockRequest)

      expect(mockCreateFavorito).toHaveBeenCalledWith({
        id_usuario: 1,
        id_destino: 1,
        estatus: true,
      })

      expect(mockJsonResponse).toHaveBeenCalledWith(favoritoData, {
        status: 201,
      })
    })

    test('debería retornar error 400 cuando falta id_destino', async () => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest

      await createFavorito(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino es requerido' },
        { status: 400 },
      )
    })

    test('debería retornar error 409 para favorito duplicado', async () => {
      mockCreateFavorito.mockResolvedValue({
        success: false,
        error: 'Este destino ya está en tus favoritos',
      })

      await createFavorito(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Este destino ya está en tus favoritos' },
        { status: 409 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockCreateFavorito.mockRejectedValue(new Error('Error de base de datos'))

      await createFavorito(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })

  describe('DELETE /api/usuarios/favoritos', () => {
    let mockRequest: NextRequest

    beforeEach(() => {
      mockRequest = {
        json: jest.fn().mockResolvedValue({ id_destino: 1 }),
      } as unknown as NextRequest

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      mockGetUserByUid.mockResolvedValue({
        success: true,
        data: { id_usuario: 1, nombre: 'Usuario Test' },
      })
    })

    test('debería eliminar favorito correctamente', async () => {
      mockDeleteFavorito.mockResolvedValue({
        success: true,
        data: { message: 'Favorito eliminado' },
      })

      await deleteFavorito(mockRequest)

      expect(mockDeleteFavorito).toHaveBeenCalledWith({
        id_usuario: 1,
        id_destino: 1,
      })

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { message: 'Salto eliminado de favoritos' },
        { status: 200 },
      )
    })

    test('debería retornar error 404 cuando favorito no existe', async () => {
      mockDeleteFavorito.mockResolvedValue({
        success: false,
        error: 'Favorito no encontrado',
      })

      await deleteFavorito(mockRequest)

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Favorito no encontrado' },
        { status: 404 },
      )
    })

    test('debería manejar errores del servidor', async () => {
      mockDeleteFavorito.mockRejectedValue(new Error('Error de base de datos'))

      await deleteFavorito(mockRequest)

      expect(mockConsoleError).toHaveBeenCalled()
      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error interno del servidor' },
        { status: 500 },
      )
    })
  })
})
