import { GET as getUsuarios } from '@/app/api/usuarios/route'
import { getUsuarios as getUsuariosService } from '@/services/usuarios.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/usuarios.service')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockGetUsuarios = getUsuariosService as jest.MockedFunction<
  typeof getUsuariosService
>
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('GET /api/usuarios', () => {
  let mockJsonResponse: jest.Mock
  let mockRequest: NextRequest

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    mockRequest = {
      url: 'http://localhost:3000/api/usuarios',
    } as NextRequest

    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  test('debería procesar correctamente los parámetros por defecto', async () => {
    mockGetUsuarios.mockResolvedValue({
      success: true,
      data: {
        data: [],
        pagination: {
          total: 0,
          currentPage: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    })

    await getUsuarios(mockRequest)

    expect(mockGetUsuarios).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: '',
      orderBy: 'fecha_registro',
      orderDirection: 'desc',
    })

    expect(mockJsonResponse).toHaveBeenCalledWith({
      data: [],
      pagination: {
        total: 0,
        currentPage: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    })
  })

  test('debería procesar correctamente parámetros personalizados', async () => {
    mockRequest.url =
      'http://localhost:3000/api/usuarios?page=2&limit=20&search=test&orderBy=nombre&orderDirection=asc'

    mockGetUsuarios.mockResolvedValue({
      success: true,
      data: {
        data: [],
        pagination: {
          total: 0,
          currentPage: 2,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: true,
        },
      },
    })

    await getUsuarios(mockRequest)

    expect(mockGetUsuarios).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      search: 'test',
      orderBy: 'nombre',
      orderDirection: 'asc',
    })
  })

  test('debería retornar error 400 para parámetros de paginación inválidos', async () => {
    mockRequest.url = 'http://localhost:3000/api/usuarios?page=0&limit=101'

    await getUsuarios(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Parámetros de paginación inválidos' },
      { status: 400 },
    )
  })

  test('debería retornar error 500 cuando el servicio falla', async () => {
    mockGetUsuarios.mockResolvedValue({
      success: false,
      error: 'Error del servidor',
    })

    await getUsuarios(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { error: 'Error del servidor' },
      { status: 500 },
    )
  })

  test('debería manejar parámetros límite', async () => {
    mockRequest.url = 'http://localhost:3000/api/usuarios?page=1&limit=1'

    mockGetUsuarios.mockResolvedValue({
      success: true,
      data: {
        data: [],
        pagination: {
          total: 0,
          currentPage: 1,
          limit: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    })

    await getUsuarios(mockRequest)

    expect(mockGetUsuarios).toHaveBeenCalledWith({
      page: 1,
      limit: 1,
      search: '',
      orderBy: 'fecha_registro',
      orderDirection: 'desc',
    })
  })

  test('debería manejar parámetros máximo permitido', async () => {
    mockRequest.url = 'http://localhost:3000/api/usuarios?page=1&limit=100'

    mockGetUsuarios.mockResolvedValue({
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

    await getUsuarios(mockRequest)

    expect(mockGetUsuarios).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      search: '',
      orderBy: 'fecha_registro',
      orderDirection: 'desc',
    })
  })
})
