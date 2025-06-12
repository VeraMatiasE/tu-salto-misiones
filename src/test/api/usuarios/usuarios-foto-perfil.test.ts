import { POST } from '@/app/api/usuarios/foto-perfil/route'
import {
  uploadAvatarToCloudinary,
  getUserIdByUid,
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

const mockUpload = uploadAvatarToCloudinary as jest.MockedFunction<
  typeof uploadAvatarToCloudinary
>
const mockGetUserIdByUid = getUserIdByUid as jest.MockedFunction<
  typeof getUserIdByUid
>
const mockCreateSupabaseClient = createSupabaseClient as jest.Mock
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {})

describe('/api/usuarios/foto-perfil', () => {
  let mockRequest: NextRequest
  const mockJson = NextResponse.json as jest.Mock

  beforeEach(() => {
    mockJson.mockClear()
    mockUpload.mockClear()
    mockGetUserIdByUid.mockClear()
    mockCreateSupabaseClient.mockReset()
  })

  afterAll(() => {
    mockConsoleError.mockRestore()
  })

  test('debería subir imagen válida', async () => {
    const mockImage = new File(['fake content'], 'avatar.png', {
      type: 'image/png',
    })
    const formData = new FormData()
    formData.append('image', mockImage)

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }

    mockCreateSupabaseClient.mockResolvedValue(mockSupabase)
    mockGetUserIdByUid.mockResolvedValue({
      data: { id_usuario: 42 },
      error: null,
    })
    mockUpload.mockResolvedValue({
      success: true,
      url: 'https://cloud.url/avatar.png',
    })

    mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as NextRequest

    await POST(mockRequest)

    expect(mockUpload).toHaveBeenCalledWith(mockImage, 42)
    expect(mockJson).toHaveBeenCalledWith(
      { success: true, url: 'https://cloud.url/avatar.png' },
      { status: 200 },
    )
  })

  test('debería devolver error si no hay imagen', async () => {
    const formData = new FormData()

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    }

    mockCreateSupabaseClient.mockResolvedValue(mockSupabase)
    mockRequest = {
      formData: jest.fn().mockResolvedValue(formData),
    } as unknown as NextRequest

    await POST(mockRequest)

    expect(mockJson).toHaveBeenCalledWith(
      { message: 'No se encontró la imagen' },
      { status: 400 },
    )
  })
})
