import { POST as uploadFotoPerfil } from '@/app/api/usuarios/foto-perfil/route'
import {
  getUserIdByUid,
  uploadAvatarToCloudinary,
} from '@/services/usuarios.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

jest.mock('@/services/usuarios.service')
jest.mock('@/utils/supabase/server')
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockGetUserIdByUid = getUserIdByUid as jest.MockedFunction<
  typeof getUserIdByUid
>
const mockUploadAvatarToCloudinary =
  uploadAvatarToCloudinary as jest.MockedFunction<
    typeof uploadAvatarToCloudinary
  >
const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('POST /api/usuarios/foto-perfil', () => {
  let mockJsonResponse: jest.Mock
  let mockSupabaseClient: {
    auth: {
      getUser: jest.Mock
    }
  }
  let mockRequest: NextRequest
  let mockFile: File

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

    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockFormData = new FormData()
    mockFormData.append('image', mockFile)

    mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserIdByUid.mockResolvedValue({
      data: { id_usuario: 1 },
      error: null,
    })

    jest.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  test('debería subir foto de perfil correctamente', async () => {
    mockUploadAvatarToCloudinary.mockResolvedValue({
      success: true,
      data: { avatar_url: 'https://cloudinary.com/avatar.jpg' },
    })

    await uploadFotoPerfil(mockRequest)

    expect(mockUploadAvatarToCloudinary).toHaveBeenCalledWith(mockFile, 1)
    expect(mockJsonResponse).toHaveBeenCalledWith(
      {
        success: true,
        data: { avatar_url: 'https://cloudinary.com/avatar.jpg' },
      },
      { status: 200 },
    )
  })

  test('debería retornar error 400 cuando no se envía imagen', async () => {
    const emptyFormData = new FormData()
    mockRequest = {
      formData: jest.fn().mockResolvedValue(emptyFormData),
    } as unknown as NextRequest

    await uploadFotoPerfil(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { message: 'No se encontró la imagen' },
      { status: 400 },
    )
  })

  test('debería retornar error 400 para tipo de archivo inválido', async () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    const mockFormData = new FormData()
    mockFormData.append('image', invalidFile)

    mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    await uploadFotoPerfil(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { message: 'El archivo debe ser una imagen (JPG, PNG, WebP)' },
      { status: 400 },
    )
  })

  test('debería manejar errores de autenticación', async () => {
    const mockRequest = {
      formData: jest.fn().mockResolvedValue(new FormData()),
    } as unknown as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Error de autenticación' },
    })

    await uploadFotoPerfil(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { message: 'Error de autenticación' },
      { status: 500 },
    )
  })

  test('debería manejar archivos muy grandes', async () => {
    // Crear un archivo mock que simule ser mayor a 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    })
    Object.defineProperty(largeFile, 'size', {
      value: 6 * 1024 * 1024, // 6MB
      writable: false,
    })

    const mockFormData = new FormData()
    mockFormData.append('image', largeFile)

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    await uploadFotoPerfil(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { message: 'La imagen es demasiado grande (máximo 5MB)' },
      { status: 400 },
    )
  })

  test('debería manejar error al obtener datos del usuario', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockFormData = new FormData()
    mockFormData.append('image', mockFile)

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserIdByUid.mockResolvedValue({
      data: undefined,
      error: 'Usuario no encontrado',
    })

    await uploadFotoPerfil(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { message: 'Usuario no encontrado' },
      { status: 500 },
    )
  })

  test('debería manejar error de Cloudinary', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const mockFormData = new FormData()
    mockFormData.append('image', mockFile)

    const mockRequest = {
      formData: jest.fn().mockResolvedValue(mockFormData),
    } as unknown as NextRequest

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockGetUserIdByUid.mockResolvedValue({
      data: { id_usuario: 1 },
      error: null,
    })

    mockUploadAvatarToCloudinary.mockResolvedValue({
      success: false,
      error: 'Error al subir imagen a Cloudinary',
    })

    await uploadFotoPerfil(mockRequest)

    expect(mockJsonResponse).toHaveBeenCalledWith(
      { message: 'Error al subir imagen a Cloudinary' },
      { status: 500 },
    )
  })
})
