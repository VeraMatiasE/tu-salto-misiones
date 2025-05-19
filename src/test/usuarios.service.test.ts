import { getUsuarios, getUsuarioById, createUsuario, updateUsuario, deleteUsuario } from "@/services/usuarios.service"
import { createSupabaseClient } from "@/utils/supabase/server"

// Mock de createSupabaseClient
jest.mock("@/utils/supabase/server", () => ({
  createSupabaseClient: jest.fn(),
}))

describe("Usuarios Service", () => {
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
    }
    ;(createSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    jest.spyOn(console, 'error').mockImplementation(() => {});
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.error.mockClear()
  })

  describe("getUsuarios", () => {
    it("debería retornar una lista de usuarios", async () => {
      const mockUsuarios = [
        { id_usuario: 1, nombre: "Usuario 1", email: "usuario1@example.com" },
        { id_usuario: 2, nombre: "Usuario 2", email: "usuario2@example.com" },
      ]

      mockSupabase.eq.mockResolvedValue({ data: mockUsuarios, error: null })

      const result = await getUsuarios()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUsuarios)
      expect(mockSupabase.from).toHaveBeenCalledWith("usuarios")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error de base de datos")
      mockSupabase.eq.mockResolvedValue({ data: null, error: mockError })

      const result = await getUsuarios()

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("getUsuarioById", () => {
    it("debería retornar un usuario por ID", async () => {
      const mockUsuario = { id_usuario: 1, nombre: "Usuario 1", email: "usuario1@example.com" }

      mockSupabase.single.mockResolvedValue({ data: mockUsuario, error: null })

      const result = await getUsuarioById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockUsuario)
      expect(mockSupabase.from).toHaveBeenCalledWith("usuarios")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_usuario", 1)
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Usuario no encontrado")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const result = await getUsuarioById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("createUsuario", () => {
    it("debería crear un usuario", async () => {
      const nuevoUsuario = {
        nombre: "Nuevo Usuario",
        email: "nuevo@example.com",
        contrasena: "password123",
        rol: false,
        estatus: true,
      }

      const usuarioCreado = {
        id_usuario: 3,
        ...nuevoUsuario,
        fecha_registro: "2023-01-01T00:00:00Z",
        fecha_actualizacion: "2023-01-01T00:00:00Z",
      }

      mockSupabase.single.mockResolvedValue({ data: usuarioCreado, error: null })

      const result = await createUsuario(nuevoUsuario)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(usuarioCreado)
      expect(mockSupabase.from).toHaveBeenCalledWith("usuarios")
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ ...nuevoUsuario }])
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al crear usuario")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const nuevoUsuario = {
        nombre: "Nuevo Usuario",
        email: "nuevo@example.com",
        contrasena: "password123",
        rol: false,
        estatus: true,
      }

      const result = await createUsuario(nuevoUsuario)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("updateUsuario", () => {
    it("debería actualizar un usuario", async () => {
      const actualizacion = {
        nombre: "Usuario Actualizado",
      }

      const usuarioActualizado = {
        id_usuario: 1,
        nombre: "Usuario Actualizado",
        email: "usuario1@example.com",
        fecha_actualizacion: "2023-01-02T00:00:00Z",
      }

      mockSupabase.single.mockResolvedValue({ data: usuarioActualizado, error: null })

      const result = await updateUsuario(1, actualizacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(usuarioActualizado)
      expect(mockSupabase.from).toHaveBeenCalledWith("usuarios")
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...actualizacion,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_usuario", 1)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al actualizar usuario")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const actualizacion = {
        nombre: "Usuario Actualizado",
      }

      const result = await updateUsuario(1, actualizacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("deleteUsuario", () => {
    it("debería eliminar (soft delete) un usuario", async () => {
      mockSupabase.eq.mockResolvedValue({ error: null })

      const result = await deleteUsuario(1)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith("usuarios")
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus: false,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_usuario", 1)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al eliminar usuario")
      mockSupabase.eq.mockResolvedValue({ error: mockError })

      const result = await deleteUsuario(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })
})
