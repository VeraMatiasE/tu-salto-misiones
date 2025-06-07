import {
  getDestinos,
  getDestinoById,
  createDestino,
  updateDestino,
  deleteDestino,
  searchDestinos,
} from "@/services/destinos.service"
import { createSupabaseClient } from "@/utils/supabase/server"
import { MockSupabaseClient } from "@/types/test.types"

// Mock de createSupabaseClient
jest.mock("@/utils/supabase/server", () => ({
  createSupabaseClient: jest.fn(),
}));

describe("Destinos Service", () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Configurar el mock para cada test
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn(),
      maybeSingle: jest.fn(),
    }
    ;(createSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.error.mockClear()
  })

  describe("getDestinos", () => {
    it("debería retornar una lista de destinos", async () => {
      const mockDestinos = [
        { id_destino: 1, nombre: "Destino 1", descripcion: "Descripción 1" },
        { id_destino: 2, nombre: "Destino 2", descripcion: "Descripción 2" },
      ]

      mockSupabase.eq.mockResolvedValue({ data: mockDestinos, error: null })

      const result = await getDestinos()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDestinos)
      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error de base de datos")
      mockSupabase.eq.mockResolvedValue({ data: null, error: mockError })

      const result = await getDestinos()

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("getDestinoById", () => {
    it("debería retornar un destino por ID", async () => {
      const mockDestino = { id_destino: 1, nombre: "Destino 1", descripcion: "Descripción 1" }

      mockSupabase.single.mockResolvedValue({ data: mockDestino, error: null })

      const result = await getDestinoById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDestino)
      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_destino", 1)
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Destino no encontrado")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const result = await getDestinoById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("createDestino", () => {
    it("debería crear un destino", async () => {
      const nuevoDestino = {
        nombre: "Nuevo Destino",
        descripcion: "Nueva Descripción",
        estatus: true,
      }

      const destinoCreado = {
        id_destino: 3,
        ...nuevoDestino,
        fecha_registro: "2023-01-01T00:00:00Z",
        fecha_actualizacion: "2023-01-01T00:00:00Z",
      }

      mockSupabase.single.mockResolvedValue({ data: destinoCreado, error: null })

      const result = await createDestino(nuevoDestino)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(destinoCreado)
      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ ...nuevoDestino }])
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al crear destino")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const nuevoDestino = {
        nombre: "Nuevo Destino",
        descripcion: "Nueva Descripción",
        estatus: true,
      }

      const result = await createDestino(nuevoDestino)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("updateDestino", () => {
    it("debería actualizar un destino", async () => {
      const actualizacion = {
        nombre: "Destino Actualizado",
      }

      const destinoActualizado = {
        id_destino: 1,
        nombre: "Destino Actualizado",
        descripcion: "Descripción 1",
        fecha_actualizacion: "2023-01-02T00:00:00Z",
      }

      mockSupabase.single.mockResolvedValue({ data: destinoActualizado, error: null })

      const result = await updateDestino(1, actualizacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(destinoActualizado)
      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...actualizacion,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_destino", 1)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al actualizar destino")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const actualizacion = {
        nombre: "Destino Actualizado",
      }

      const result = await updateDestino(1, actualizacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("deleteDestino", () => {
    it("debería eliminar (soft delete) un destino", async () => {
      mockSupabase.eq.mockResolvedValue({ error: null })

      const result = await deleteDestino(1)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus: false,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_destino", 1)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al eliminar destino")
      mockSupabase.eq.mockResolvedValue({ error: mockError })

      const result = await deleteDestino(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("searchDestinos", () => {
    it("debería buscar destinos por query", async () => {
      const mockDestinos = [
        { id_destino: 1, nombre: "Playa", descripcion: "Hermosa playa" },
        { id_destino: 2, nombre: "Otra playa", descripcion: "Otra hermosa playa" },
      ]

      mockSupabase.eq.mockResolvedValue({ data: mockDestinos, error: null })

      const result = await searchDestinos("playa")

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDestinos)
      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.or).toHaveBeenCalledWith(
        "nombre.ilike.%playa%,descripcion.ilike.%playa%,ubicacion.ilike.%playa%",
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al buscar destinos")
      mockSupabase.eq.mockResolvedValue({ data: null, error: mockError })

      const result = await searchDestinos("playa")

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })
})
