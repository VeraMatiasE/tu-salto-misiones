import {
  getAllDestinoWithImagenes,
  getImagenesByDestinoId,
  getImagenById,
  uploadImage,
  updateImagen,
  deleteImagen,
} from "@/services/imagenes-destino.service"
import { createSupabaseClient } from "@/utils/supabase/server"
import { MockCloudinary, MockSupabaseClient } from "@/types/test.types"
import cloudinary from "@/lib/cloudnary"

jest.mock("@/utils/supabase/server", () => ({
  createSupabaseClient: jest.fn(),
}))

jest.mock("@/lib/cloudnary", () => ({
  uploader: {
    upload_stream: jest.fn(() => ({ end: jest.fn() })),
    destroy: jest.fn(),
  },
}))

Object.defineProperty(File.prototype, 'arrayBuffer', {
  value: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  writable: true
});

describe("Image Service", () => {
  let mockSupabase: MockSupabaseClient
  const mockCloudinary: MockCloudinary = cloudinary as unknown as MockCloudinary;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
      or: jest.fn(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn(),
      maybeSingle: jest.fn(),
    }
    ;(createSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)

    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    ;(console.error as jest.Mock).mockRestore()
  })

  describe("getAllDestinoWithImagenes", () => {
    it("debería retornar destinos con sus imágenes", async () => {
      const mockData = [
        {
          id_destino: "1",
          nombre: "Destino 1",
          imagenes_destino: [
            {
              id_imagen: 1,
              url_imagen: "https://example.com/imagen1.jpg",
              public_id: "destinos/1/imagen1",
              fecha_actualizacion: "2023-01-01T00:00:00Z",
            },
            {
              id_imagen: 2,
              url_imagen: "https://example.com/imagen2.jpg",
              public_id: "destinos/1/imagen2",
              fecha_actualizacion: "2023-01-01T00:00:00Z",
            },
          ],
        },
        {
          id_destino: "2",
          nombre: "Destino 2",
          imagenes_destino: [
            {
              id_imagen: 3,
              url_imagen: "https://example.com/imagen3.jpg",
              public_id: "destinos/2/imagen3",
              fecha_actualizacion: "2023-01-01T00:00:00Z",
            },
          ],
        },
      ]

      mockSupabase.eq
        .mockImplementationOnce(() => ({
            eq: mockSupabase.eq,
        }))
        .mockImplementationOnce(() =>
            Promise.resolve({ data: mockData, error: null })
        );

      const result = await getAllDestinoWithImagenes()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data![0].id_destino).toBe("1")
      expect(result.data![0].imagenes).toHaveLength(2)
      expect(result.data![1].id_destino).toBe("2")
      expect(result.data![1].imagenes).toHaveLength(1)

      expect(mockSupabase.from).toHaveBeenCalledWith("destinos")
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        id_destino,
        nombre,
        imagenes_destino:imagenes_destino(
          id_imagen,
          url_imagen,
          public_id
        )
      `)
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
      expect(mockSupabase.eq).toHaveBeenCalledWith("imagenes_destino.estatus", true)
    })

    it("debería manejar datos vacíos", async () => {
      mockSupabase.eq
        .mockImplementationOnce(() => ({
            eq: mockSupabase.eq,
        }))
        .mockImplementationOnce(() =>
            Promise.resolve({ data: [], error: null })
        );

      const result = await getAllDestinoWithImagenes()

      expect(result.success).toBe(true)
      expect(result.data).toEqual([])
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error de base de datos")
      mockSupabase.eq
        .mockImplementationOnce(() => ({
            eq: mockSupabase.eq,
        }))
        .mockImplementationOnce(() =>
            Promise.resolve({ data: null, error: mockError })
        );

      const result = await getAllDestinoWithImagenes()

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("getImagenesByDestinoId", () => {
    it("debería retornar imágenes de un destino específico", async () => {
      const mockImagenes = [
        {
          id_imagen: 1,
          id_destino: 1,
          url_imagen: "https://example.com/imagen1.jpg",
          public_id: "destinos/1/imagen1",
          estatus: true,
        },
        {
          id_imagen: 2,
          id_destino: 1,
          url_imagen: "https://example.com/imagen2.jpg",
          public_id: "destinos/1/imagen2",
          estatus: true,
        },
      ]

      mockSupabase.eq
        .mockImplementationOnce(() => ({
            eq: mockSupabase.eq,
        }))
        .mockImplementationOnce(() =>
            Promise.resolve({ data: mockImagenes, error: null })
        );

      const result = await getImagenesByDestinoId(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockImagenes)
      expect(mockSupabase.from).toHaveBeenCalledWith("imagenes_destino")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_destino", 1)
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al obtener imágenes")
      mockSupabase.eq
        .mockImplementationOnce(() => ({
            eq: mockSupabase.eq,
        }))
        .mockImplementationOnce(() =>
            Promise.resolve({ data: null, error: mockError })
        );

      const result = await getImagenesByDestinoId(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("getImagenById", () => {
    it("debería retornar una imagen por ID", async () => {
      const mockImagen = {
        id_imagen: 1,
        id_destino: 1,
        url_imagen: "https://example.com/imagen1.jpg",
        public_id: "destinos/1/imagen1",
        estatus: true,
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockImagen, error: null })

      const result = await getImagenById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockImagen)
      expect(mockSupabase.from).toHaveBeenCalledWith("imagenes_destino")
      expect(mockSupabase.select).toHaveBeenCalledWith("*")
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_imagen", 1)
      expect(mockSupabase.eq).toHaveBeenCalledWith("estatus", true)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Imagen no encontrada")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const result = await getImagenById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("uploadImage", () => {
    it("debería subir una imagen exitosamente", async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(8));

      const mockCloudinaryResult = {
        secure_url: "https://cloudinary.com/image.jpg",
        public_id: "destinos/1/image123",
      }

      mockCloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        const stream = {
          end: jest.fn(() => {
            callback(null, mockCloudinaryResult)
          })
        }
        return stream
      })

      const mockImagenCreada = {
        id_imagen: 1,
        id_destino: 1,
        url_imagen: mockCloudinaryResult.secure_url,
        public_id: mockCloudinaryResult.public_id,
        estatus: true,
      }

      mockSupabase.single.mockResolvedValueOnce({ data: mockImagenCreada, error: null })

      const result = await uploadImage(mockFile, 1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockImagenCreada)
      expect(result.message).toBe("Imagen creada exitosamente")

      expect(mockCloudinary.uploader.upload_stream).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: "destinos/1",
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        }),
        expect.any(Function)
      )

      expect(mockSupabase.from).toHaveBeenCalledWith("imagenes_destino")
      expect(mockSupabase.insert).toHaveBeenCalledWith([{
        id_destino: 1,
        url_imagen: mockCloudinaryResult.secure_url,
        public_id: mockCloudinaryResult.public_id,
      }])
    })

    it("debería manejar errores de Cloudinary", async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(8))

      const mockCloudinaryError = new Error("Error de Cloudinary")
      mockCloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        const stream = {
          end: jest.fn(() => {
            callback(mockCloudinaryError, undefined)
          })
        }
        return stream
      })

      const result = await uploadImage(mockFile, 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockCloudinaryError.message)
    })

    it("debería eliminar imagen de Cloudinary si falla la inserción en BD", async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      jest.spyOn(mockFile, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(8))

      const mockCloudinaryResult = {
        secure_url: "https://cloudinary.com/image.jpg",
        public_id: "destinos/1/image123",
      }

      mockCloudinary.uploader.upload_stream.mockImplementation((options, callback) => {
        const stream = {
          end: jest.fn(() => {
            callback(null, mockCloudinaryResult)
          })
        }
        return stream
      })

      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "ok" })

      const mockError = new Error("Error de base de datos")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const result = await uploadImage(mockFile, 1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(`Error al guardar metadatos: ${mockError.message}`)
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(mockCloudinaryResult.public_id)
    })
  })

  describe("updateImagen", () => {
    it("debería actualizar una imagen", async () => {
      const actualizacion = {
        url_imagen: "https://example.com/nueva-imagen.jpg",
      }

      const imagenActualizada = {
        id_imagen: 1,
        id_destino: 1,
        url_imagen: "https://example.com/nueva-imagen.jpg",
        public_id: "destinos/1/imagen1",
        fecha_actualizacion: "2023-01-02T00:00:00Z",
      }

      mockSupabase.single.mockResolvedValue({ data: imagenActualizada, error: null })

      const result = await updateImagen(1, actualizacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(imagenActualizada)
      expect(result.message).toBe("Imagen actualizada exitosamente")

      expect(mockSupabase.from).toHaveBeenCalledWith("imagenes_destino")
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...actualizacion,
          fecha_actualizacion: expect.any(String),
        })
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_imagen", 1)
    })

    it("debería manejar errores", async () => {
      const mockError = new Error("Error al actualizar imagen")
      mockSupabase.single.mockResolvedValue({ data: null, error: mockError })

      const actualizacion = {
        url_imagen: "https://example.com/nueva-imagen.jpg",
      }

      const result = await updateImagen(1, actualizacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe("deleteImagen", () => {
    it("debería eliminar una imagen exitosamente", async () => {
      const mockImagen = {
        public_id: "destinos/1/imagen1",
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockImagen, error: null })

      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "ok" })

      const result = await deleteImagen(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe("Imagen eliminada exitosamente")

      expect(mockSupabase.from).toHaveBeenCalledWith("imagenes_destino")
      expect(mockSupabase.select).toHaveBeenCalledWith("public_id")
      expect(mockSupabase.eq).toHaveBeenCalledWith("id_imagen", 1)
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(mockImagen.public_id)
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus: false,
          fecha_actualizacion: expect.any(String),
        })
      )
    })

    it("debería manejar cuando la imagen no existe en Cloudinary", async () => {
      const mockImagen = {
        public_id: "destinos/1/imagen1",
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockImagen, error: null })
      
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "not found" })

      const result = await deleteImagen(1)

      expect(result.success).toBe(true)
      expect(result.message).toBe("Imagen eliminada exitosamente")
    })

    it("debería manejar error cuando no se encuentra el public_id", async () => {
      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })

      const result = await deleteImagen(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe("No se encontró el public_id")
    })

    it("debería manejar errores de Cloudinary", async () => {
      const mockImagen = {
        public_id: "destinos/1/imagen1",
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockImagen, error: null })
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "error" })

      const result = await deleteImagen(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Error al eliminar en Cloudinary: error")
    })

    it("debería manejar errores de base de datos", async () => {
      const mockImagen = {
        public_id: "destinos/1/imagen1",
      }

      mockSupabase.maybeSingle.mockResolvedValue({ data: mockImagen, error: null })
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "ok" })
      
      const mockError = new Error("Error de base de datos")
      mockSupabase.update.mockReturnValueOnce({
        eq: jest.fn(() => ({ error: mockError }))
      })

      const result = await deleteImagen(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })
})