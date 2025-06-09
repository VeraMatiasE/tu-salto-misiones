import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getUsuarioByEmail,
} from '@/services/usuarios.service'
import { MockSupabaseClient } from '@/types/test.types'
import { createSupabaseClient } from '@/utils/supabase/server'

// Mock de createSupabaseClient
jest.mock('@/utils/supabase/server', () => ({
  createSupabaseClient: jest.fn(),
}))

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
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.error.mockClear()
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
        totalPages: 2, // Math.ceil(15 / 10)
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
        totalPages: 5, // Math.ceil(25 / 5)
        total: 25,
        limit: 5,
        hasNextPage: true,
        hasPrevPage: true,
      })

      expect(mockSupabase.range).toHaveBeenCalledWith(10, 14) // offset (3-1)*5 = 10, range 10-14
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
      const mockUsuarios = []

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 0,
      })

      await getUsuarios({ search: '   ' }) // String con espacios

      expect(mockSupabase.or).not.toHaveBeenCalled()
    })

    it('debería aplicar ordenamiento personalizado', async () => {
      const mockUsuarios = []

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
        count: null, // Simular count null
      })

      const result = await getUsuarios()

      expect(result.success).toBe(true)
      expect(result.data?.pagination.total).toBe(0)
      expect(result.data?.pagination.totalPages).toBe(0)
    })

    it('debería calcular correctamente hasNextPage y hasPrevPage', async () => {
      // Caso: página del medio
      mockSupabase.range.mockResolvedValue({
        data: [],
        error: null,
        count: 50,
      })

      const result = await getUsuarios({ page: 3, limit: 10 }) // página 3 de 5

      expect(result.data?.pagination.hasNextPage).toBe(true)
      expect(result.data?.pagination.hasPrevPage).toBe(true)

      // Caso: primera página
      const resultFirstPage = await getUsuarios({ page: 1, limit: 10 })
      expect(resultFirstPage.data?.pagination.hasPrevPage).toBe(false)

      // Caso: última página
      const resultLastPage = await getUsuarios({ page: 5, limit: 10 })
      expect(resultLastPage.data?.pagination.hasNextPage).toBe(false)
    })

    it('debería manejar todos los parámetros combinados', async () => {
      const mockUsuarios = []

      mockSupabase.range.mockResolvedValue({
        data: mockUsuarios,
        error: null,
        count: 0,
      })

      await getUsuarios({
        page: 2,
        limit: 20,
        search: 'admin',
        orderBy: 'email',
        orderDirection: 'asc',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('usuarios')
      expect(mockSupabase.select).toHaveBeenCalledWith('*', {
        count: 'exact',
      })
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'nombre.ilike.%admin%,email.ilike.%admin%',
      )
      expect(mockSupabase.order).toHaveBeenCalledWith('email', {
        ascending: true,
      })
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 39)
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

  describe('createUsuario', () => {
    it('debería crear un usuario', async () => {
      const nuevoUsuario = {
        nombre: 'Nuevo Usuario',
        email: 'nuevo@example.com',
        contrasena: 'password123',
        rol: false,
        estatus: true,
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
        contrasena: 'password123',
        rol: false,
        estatus: true,
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
})
