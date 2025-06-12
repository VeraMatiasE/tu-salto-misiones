import {
  GET as getUsuarioById,
  PUT as updateUsuario,
  DELETE as deleteUsuario,
} from '@/app/api/usuarios/[id]/route'
import {
  getUsuarioById as getUsuarioByIdService,
  updateUsuario as updateUsuarioService,
  deleteUsuario as deleteUsuarioService,
} from '@/services/usuarios.service'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/usuarios.service')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockGetUsuarioById = getUsuarioByIdService as jest.MockedFunction<
  typeof getUsuarioByIdService
>
const mockUpdateUsuario = updateUsuarioService as jest.MockedFunction<
  typeof updateUsuarioService
>
const mockDeleteUsuario = deleteUsuarioService as jest.MockedFunction<
  typeof deleteUsuarioService
>
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('API /api/usuarios/[id]', () => {
  let mockJsonResponse: jest.Mock

  beforeEach(() => {
    mockJsonResponse = jest.fn()
    ;(NextResponse.json as jest.Mock) = mockJsonResponse

    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  describe('GET /api/usuarios/[id]', () => {
    test('debería obtener usuario por ID válido', async () => {
      const mockParams = Promise.resolve({ id: '1' })
      const mockRequest = {} as NextRequest
      const userData = { id_usuario: 1, nombre: 'Usuario Test' }

      mockGetUsuarioById.mockResolvedValue({
        success: true,
        data: userData,
      })

      await getUsuarioById(mockRequest, { params: mockParams })

      expect(mockGetUsuarioById).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: userData,
      })
    })

    test('debería retornar error 400 para ID inválido', async () => {
      const mockParams = Promise.resolve({ id: 'invalid' })
      const mockRequest = {} as NextRequest

      await getUsuarioById(mockRequest, { params: mockParams })

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de usuario inválido' },
        { status: 400 },
      )
    })

    test('debería retornar error 404 cuando usuario no existe', async () => {
      const mockParams = Promise.resolve({ id: '999' })
      const mockRequest = {} as NextRequest

      mockGetUsuarioById.mockResolvedValue({
        success: false,
        error: 'Usuario no encontrado',
      })

      await getUsuarioById(mockRequest, { params: mockParams })

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      )
    })
  })

  describe('PUT /api/usuarios/[id]', () => {
    test('debería actualizar usuario correctamente', async () => {
      const mockParams = Promise.resolve({ id: '1' })
      const mockRequest = {
        json: jest.fn().mockResolvedValue({ nombre: 'Nuevo Nombre' }),
      } as unknown as NextRequest
      const updatedUser = { id_usuario: 1, nombre: 'Nuevo Nombre' }

      mockUpdateUsuario.mockResolvedValue({
        success: true,
        data: updatedUser,
      })

      await updateUsuario(mockRequest, { params: mockParams })

      expect(mockUpdateUsuario).toHaveBeenCalledWith(1, {
        nombre: 'Nuevo Nombre',
      })
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: updatedUser,
      })
    })

    test('debería retornar error 400 para ID inválido', async () => {
      const mockParams = Promise.resolve({ id: 'invalid' })
      const mockRequest = {} as NextRequest

      await updateUsuario(mockRequest, { params: mockParams })

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de usuario inválido' },
        { status: 400 },
      )
    })

    test('debería retornar error 400 cuando JSON es inválido', async () => {
      const mockParams = Promise.resolve({ id: '1' })
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('JSON inválido')),
      } as unknown as NextRequest

      await updateUsuario(mockRequest, { params: mockParams })

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'Error al procesar la solicitud' },
        { status: 400 },
      )
    })
  })

  describe('DELETE /api/usuarios/[id]', () => {
    test('debería eliminar usuario correctamente', async () => {
      const mockParams = Promise.resolve({ id: '1' })
      const mockRequest = {} as NextRequest

      mockDeleteUsuario.mockResolvedValue({
        success: true,
        data: { message: 'Usuario eliminado' },
      })

      await deleteUsuario(mockRequest, { params: mockParams })

      expect(mockDeleteUsuario).toHaveBeenCalledWith(1)
      expect(mockJsonResponse).toHaveBeenCalledWith({
        success: true,
        data: { message: 'Usuario eliminado' },
      })
    })

    test('debería retornar error 400 para ID inválido', async () => {
      const mockParams = Promise.resolve({ id: 'invalid' })
      const mockRequest = {} as NextRequest

      await deleteUsuario(mockRequest, { params: mockParams })

      expect(mockJsonResponse).toHaveBeenCalledWith(
        { error: 'ID de destino inválido' },
        { status: 400 },
      )
    })
  })
})
