import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuarioByEmail,
  getUserByUid,
  getUserIdByUid,
  uploadAvatarToCloudinary,
  updateUserAvatar,
  cleanupUnusedImage,
} from '@/services/usuarios.service'
import { MockSupabaseClient } from '@/types/test.types'
import { createSupabaseClient } from '@/utils/supabase/server'
import cloudinary from '@/lib/cloudnary'

jest.mock('@/utils/supabase/server', () => ({
  createSupabaseClient: jest.fn(),
}))

jest.mock('@/lib/cloudnary', () => ({
  uploader: {
    upload_stream: jest.fn(),
    destroy: jest.fn(),
  },
}))

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud-name'

describe('Usuarios Service', () => {
  let mockSupabase: MockSupabaseClient

  beforeEach(() => {
    // Configurar el mock para cada test
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    }
    ;(createSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    ;(console.error as jest.Mock).mockRestore()
    ;(console.warn as jest.Mock).mockRestore()
    ;(console.log as jest.Mock).mockRestore()
  })

  describe('getUsuarios', () => {
    it('debería retornar una lista paginada de usuarios con parámetros por defecto', async () => {
      const mockUsuarios = [
        {
          id_usuario: '1',
          nombre: 'Usuario 1',
          email: 'usuario1@example.com',
          estatus: true,
          fecha_registro: '2024-01-01',
        },
        {
          id_usuario: '2',
          nombre: 'Usuario 2',
          email: 'usuario2@example.com',
          estatus: true,
          fecha_registro: '2024-01-02',
        },
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 15,
      })

      const result = await getUsuarios()

      expect(result.success).toBe(true)
      expect(result.data?.data).toEqual(mockUsuarios)
      expect(result.data?.pagination).toEqual({
        currentPage: 1,
        totalPages: 2,
        total: 15,
        limit: 10,
        hasNextPage: true,
        hasPrevPage: false,
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('*', {
        count: 'exact',
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
      expect(mockSupabase.order).toHaveBeenCalledWith('fecha_registro', {
        ascending: false,
      })
      expect(mockSupabase.range).toHaveBeenCalledWith(0, 9)
    })

    it('debería aplicar paginación correctamente', async () => {
      const mockUsuarios = [
        {
          id_usuario: '11',
          nombre: 'Usuario 11',
          email: 'usuario11@example.com',
          estatus: true,
        },
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 25,
      })

      const result = await getUsuarios({ page: 3, limit: 5 })

      expect(result.success).toBe(true)
      expect(result.data?.pagination).toEqual({
        currentPage: 3,
        totalPages: 5,
        total: 25,
        limit: 5,
        hasNextPage: true,
        hasPrevPage: true,
      })

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 14)
    })

    it('debería aplicar búsqueda correctamente', async () => {
      const mockUsuarios = [
        {
          id_usuario: '1',
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
          estatus: true,
        },
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 1,
      })

      const result = await getUsuarios({ search: 'Juan' })

      expect(result.success).toBe(true)
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'nombre.ilike.%Juan%,email.ilike.%Juan%',
      )
    })

    it('no debería aplicar búsqueda con string vacío', async () => {
      const mockUsuarios: unknown[] = []

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 0,
      })

      await getUsuarios({ search: '   ' })

      expect(mockSupabase.or).not.toHaveBeenCalled()
    })

    it('debería aplicar ordenamiento personalizado', async () => {
      const mockUsuarios: unknown[] = []

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 0,
      })

      await getUsuarios({ orderBy: 'nombre', orderDirection: 'asc' })

      expect(mockSupabase.order).toHaveBeenCalledWith('nombre', {
        ascending: true,
      })
    })

    it('debería manejar errores de Supabase', async () => {
      const mockError = new Error('Error de conexión a la base de datos')

      mockSupabase.range.mockResolvedValue({
        data: null,
        error: mockError,
        count: null,
      })

      const result = await getUsuarios()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de conexión a la base de datos')
    })

    it('debería manejar errores inesperados', async () => {
      mockSupabase.range.mockRejectedValue('Error no estándar')

      const result = await getUsuarios()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error desconocido al obtener usuarios')
    })

    it('debería manejar count null o undefined', async () => {
      const mockUsuarios = [
        {
          id_usuario: '1',
          nombre: 'Usuario 1',
          email: 'usuario1@example.com',
        },
      ]

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: null,
      })

      const result = await getUsuarios()

      expect(result.success).toBe(true)
      expect(result.data?.pagination.total).toBe(0)
      expect(result.data?.pagination.totalPages).toBe(0)
    })
  })

  describe('getUsuarioById', () => {
    it('debería retornar un usuario por ID', async () => {
      const mockUsuario = {
        id_usuario: 1,
        nombre: 'Usuario 1',
        email: 'usuario1@example.com',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockUsuario,
        error: null,
      })

      const result = await getUsuarioById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUsuario)
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_usuario', 1)
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Usuario no encontrado')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const result = await getUsuarioById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('getUsuarioByEmail', () => {
    it('debería retornar un usuario por email', async () => {
      const mockUsuario = {
        id_usuario: 1,
        nombre: 'Usuario 1',
        email: 'usuario1@example.com',
      }
      mockSupabase.single.mockResolvedValue({
        data: mockUsuario,
        error: null,
      })
      const result = await getUsuarioByEmail('usuario1@example.com')
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUsuario)
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith(
        'email',
        'usuario1@example.com',
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Usuario no encontrado')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })
      const result = await getUsuarioByEmail('usuario@noexiste.com')
      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('getUserByUid', () => {
    it('debería retornar un usuario por UID', async () => {
      const mockUsuario = {
        id_usuario: 1,
        nombre: 'Usuario 1',
        email: 'usuario1@example.com',
        uid_usuario: 'uid123',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockUsuario,
        error: null,
      })

      const result = await getUserByUid('uid123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUsuario)
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('uid_usuario', 'uid123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería manejar cuando no se encuentra el usuario', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getUserByUid('uid_no_existe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Usuario no encontrado')
    })

    it('debería manejar errores de Supabase', async () => {
      const mockError = new Error('Error de conexión')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const result = await getUserByUid('uid123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al obtener datos del usuario')
    })

    it('debería manejar errores inesperados', async () => {
      mockSupabase.single.mockRejectedValue('Error inesperado')

      const result = await getUserByUid('uid123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error interno al obtener usuario')
    })
  })

  describe('getUserIdByUid', () => {
    it('debería retornar el ID de usuario por UID', async () => {
      const mockData = {
        id_usuario: 1,
      }

      mockSupabase.single.mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await getUserIdByUid('uid123')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('id_usuario')
      expect(mockSupabase.eq).toHaveBeenCalledWith('uid_usuario', 'uid123')
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería manejar cuando no se encuentra el usuario', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await getUserIdByUid('uid_no_existe')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Usuario no encontrado')
    })

    it('debería manejar errores de Supabase', async () => {
      const mockError = new Error('Error de conexión')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const result = await getUserIdByUid('uid123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al obtener datos del usuario')
    })
  })

  describe('createUsuario', () => {
    it('debería crear un usuario', async () => {
      const nuevoUsuario = {
        nombre: 'Nuevo Usuario',
        email: 'nuevo@example.com',
        rol: false,
        estatus: true,
        uid_usuario: 'uid123',
      }

      const usuarioCreado = {
        id_usuario: 3,
        ...nuevoUsuario,
        fecha_registro: '2023-01-01T00:00:00Z',
        fecha_actualizacion: '2023-01-01T00:00:00Z',
      }

      mockSupabase.single.mockResolvedValue({
        data: usuarioCreado,
        error: null,
      })

      const result = await createUsuario(nuevoUsuario)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(usuarioCreado)
      expect(result.message).toBe('Usuario creado exitosamente')
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ ...nuevoUsuario }])
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al crear usuario')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const nuevoUsuario = {
        nombre: 'Nuevo Usuario',
        email: 'nuevo@example.com',
        rol: false,
        estatus: true,
        uid_usuario: 'uid123',
      }

      const result = await createUsuario(nuevoUsuario)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('updateUsuario', () => {
    it('debería actualizar un usuario', async () => {
      const actualizacion = {
        nombre: 'Usuario Actualizado',
      }

      const usuarioActualizado = {
        id_usuario: 1,
        nombre: 'Usuario Actualizado',
        email: 'usuario1@example.com',
        fecha_actualizacion: '2023-01-02T00:00:00Z',
      }

      mockSupabase.single.mockResolvedValue({
        data: usuarioActualizado,
        error: null,
      })

      const result = await updateUsuario(1, actualizacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(usuarioActualizado)
      expect(result.message).toBe('Usuario actualizado exitosamente')
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...actualizacion,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_usuario', 1)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al actualizar usuario')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const actualizacion = {
        nombre: 'Usuario Actualizado',
      }

      const result = await updateUsuario(1, actualizacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('deleteUsuario', () => {
    it('debería eliminar (soft delete) un usuario', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null })

      const result = await deleteUsuario(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe('Usuario eliminado exitosamente')
      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus: false,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_usuario', 1)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al eliminar usuario')
      mockSupabase.eq.mockResolvedValue({ error: mockError })

      const result = await deleteUsuario(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('uploadAvatarToCloudinary', () => {
    it('debería subir una imagen a Cloudinary exitosamente', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFile)
      const bufferSpy = jest.spyOn(Buffer, 'from').mockReturnValue(mockFile)

      const mockCloudinaryResult = {
        public_id: 'avatar/1/test123',
        url: 'https://res.cloudinary.com/test/image/upload/avatar/1/test123',
      }

      const mockUploadStream = jest.fn((options, callback) => {
        setTimeout(() => callback(null, mockCloudinaryResult), 0)
        return { end: jest.fn() }
      })

      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        mockUploadStream,
      )

      const result = await uploadAvatarToCloudinary(mockFile, 1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        public_id: 'avatar/1/test123',
        imageUrl:
          'https://res.cloudinary.com/test/image/upload/avatar/1/test123',
      })
      expect(result.message).toBe('Imagen subida exitosamente a Cloudinary')
      bufferSpy.mockRestore()
    })

    it('debería manejar errores de Cloudinary', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFile)
      const bufferSpy = jest.spyOn(Buffer, 'from').mockReturnValue(mockFile)
      const mockError = new Error('Error de Cloudinary')

      const mockUploadStream = jest.fn((options, callback) => {
        setTimeout(() => callback(mockError, null), 0)
        return { end: jest.fn() }
      })

      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        mockUploadStream,
      )

      const result = await uploadAvatarToCloudinary(mockFile, 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error de Cloudinary')
      bufferSpy.mockRestore()
    })

    it('debería manejar respuesta vacía de Cloudinary', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(mockFile)
      const bufferSpy = jest.spyOn(Buffer, 'from').mockReturnValue(mockFile)

      const mockUploadStream = jest.fn((options, callback) => {
        setTimeout(() => callback(null, null), 0)
        return { end: jest.fn() }
      })

      ;(cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        mockUploadStream,
      )

      const result = await uploadAvatarToCloudinary(mockFile, 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe('No se recibió respuesta de Cloudinary')
      bufferSpy.mockRestore()
    })
  })

  describe('updateUserAvatar', () => {
    it('debería actualizar el avatar del usuario', async () => {
      const mockExistingUser = { foto_perfil: 'old_public_id' }
      const newPublicId = 'new_public_id'

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockExistingUser,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { foto_perfil: newPublicId },
          error: null,
        })
      ;(cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      })

      const result = await updateUserAvatar(1, newPublicId)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        oldPublicId: 'old_public_id',
        newPublicId: 'new_public_id',
        imageUrl: `https://res.cloudinary.com/test-cloud-name/image/upload/new_public_id`,
      })
      expect(result.message).toBe('Avatar actualizado exitosamente')
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('old_public_id')
    })

    it('debería manejar errores en la actualización', async () => {
      const mockError = new Error('Error al actualizar')

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { foto_perfil: 'old_id' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: mockError,
        })
      ;(cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      })

      const result = await updateUserAvatar(1, 'new_id')

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Error al actualizar avatar: Error al actualizar',
      )
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('new_id')
    })

    it('no debería eliminar imagen anterior si es la misma', async () => {
      const samePublicId = 'same_public_id'
      const mockExistingUser = { foto_perfil: samePublicId }

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockExistingUser,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { foto_perfil: samePublicId },
          error: null,
        })

      const result = await updateUserAvatar(1, samePublicId)

      expect(result.success).toBe(true)
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled()
    })
  })

  describe('cleanupUnusedImage', () => {
    it('debería eliminar imagen no utilizada', async () => {
      ;(cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      })

      await cleanupUnusedImage('unused_public_id')

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(
        'unused_public_id',
      )
    })

    it('debería manejar errores silenciosamente', async () => {
      ;(cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(
        new Error('Error al eliminar'),
      )

      // No debería lanzar error
      await expect(
        cleanupUnusedImage('unused_public_id'),
      ).resolves.toBeUndefined()
      expect(console.warn).toHaveBeenCalledWith(
        'Error al limpiar imagen no utilizada:',
        expect.any(Error),
      )
    })
  })
})
