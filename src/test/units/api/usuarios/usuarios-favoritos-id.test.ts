// favoritos.[id].route.test.ts
import { GET as checkFavorito } from '@/app/api/usuarios/favoritos/[id]/route'
import { getUserByUid } from '@/services/usuarios.service'
import { checkIfFavorito } from '@/services/favoritos.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Mocks
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
const mockCheckIfFavorito = checkIfFavorito as jest.MockedFunction<
  typeof checkIfFavorito
>
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('GET /api/usuarios/favoritos/[id]', () => {
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

  test('debería verificar si destino es favorito', async () => {
    const mockParams = Promise.resolve({ id: '1' })
    const mockRequest = {} as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserByUid.mockResolvedValue({
      success: true,
      data: { id_usuario: 1, nombre: 'Usuario Test' },
    })

    mockCheckIfFavorito.mockResolvedValue({
      success: true,
      data: { isFavorito: true },
    })

    await checkFavorito(mockRequest, { params: mockParams })

    expect(mockCheckIfFavorito).toHaveBeenCalledWith(1, 1)
    expect(mockJsonResponse).toHaveBeenCalledWith({ isFavorito: true })
  })

  test('debería retornar error 401 para usuario no autenticado', async () => {
    const mockParams = Promise.resolve({ id: '1' })
    const mockRequest = {} as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No autorizado' },
    })

    await checkFavorito(mockRequest, { params: mockParams })

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'No autorizado' },
      { status: 401 },
    )
  })

  test('debería retornar error 404 cuando usuario no existe en BD', async () => {
    const mockParams = Promise.resolve({ id: '1' })
    const mockRequest = {} as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserByUid.mockResolvedValue({
      success: false,
      error: 'Usuario no encontrado',
    })

    await checkFavorito(mockRequest, { params: mockParams })

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Usuario no encontrado en la base de datos' },
      { status: 404 },
    )
  })

  test('debería manejar errores del servidor', async () => {
    const mockParams = Promise.resolve({ id: '1' })
    const mockRequest = {} as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserByUid.mockResolvedValue({
      success: true,
      data: { id_usuario: 1, nombre: 'Usuario Test' },
    })

    mockCheckIfFavorito.mockRejectedValue(new Error('Error de base de datos'))

    await checkFavorito(mockRequest, { params: mockParams })

    expect(mockConsoleError).toHaveBeenCalled()
    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  })
})
