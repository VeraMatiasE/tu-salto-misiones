import {
  getDestinos,
  getDestinoById,
  createDestino,
  updateDestino,
  deleteDestino,
  searchDestinos,
  getFilterOptions,
} from '@/services/destinos.service'
import { createSupabaseClient } from '@/utils/supabase/server'
import { MockSupabaseClient } from '@/types/test.types'

// Mock de createSupabaseClient
jest.mock('@/utils/supabase/server', () => ({
  createSupabaseClient: jest.fn(),
}))

describe('Destinos Service', () => {
  let mockSupabase: MockSupabaseClient

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
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
    }
    ;(createSupabaseClient as jest.Mock).mockResolvedValue(mockSupabase)
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    console.error.mockClear()
  })

  describe('getDestinos', () => {
    it('debería retornar una lista de destinos', async () => {
      const mockDestinos = [
        {
          id_destino: 1,
          nombre: 'Destino 1',
          descripcion: 'Descripción 1',
          ubicacion: 'Misiones',
          dificultad: 'baja',
          infraestructura: '["wifi", "parking"]',
          estatus: true,
          imagenes_destino: [{ public_id: 'image1.jpg' }],
          resenas: [{ calificacion: 4.5 }, { calificacion: 3.8 }],
        },
        {
          id_destino: 2,
          nombre: 'Destino 2',
          descripcion: 'Descripción 2',
          ubicacion: 'Corrientes',
          dificultad: 'media',
          infraestructura: '["restaurante", "baños"]',
          estatus: true,
          imagenes_destino: [{ public_id: 'image2.jpg' }],
          resenas: [{ calificacion: 5.0 }],
        },
      ]

      mockSupabase.eq.mockResolvedValue({
        data: mockDestinos,
        error: null,
      })

      const result = await getDestinos()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.data).toHaveLength(2)

      const firstDestino = result.data?.data[0]
      expect(firstDestino?.nombre).toBe('Destino 1')
      expect(firstDestino?.puntuacion).toBe(4.2) // Promedio de 4.5 y 3.8
      expect(firstDestino?.public_id).toBe('image1.jpg')
      expect(firstDestino?.infraestructura).toEqual(['wifi', 'parking'])

      expect(firstDestino).not.toHaveProperty('resenas')
      expect(firstDestino).not.toHaveProperty('imagenes_destino')

      expect(result.data?.pagination).toBeDefined()
      expect(result.data?.pagination.total).toBe(2)
      expect(result.data?.pagination.currentPage).toBe(1)
      expect(result.data?.pagination.totalPages).toBe(1)
      expect(result.data?.pagination.hasNextPage).toBe(false)
      expect(result.data?.pagination.hasPrevPage).toBe(false)

      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
      expect(mockSupabase.select).toHaveBeenCalledWith(`
        *,
        imagenes_destino(public_id),
        resenas(calificacion)
      `)
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería retornar lista vacía cuando no hay datos', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null })

      const result = await getDestinos()

      expect(result.success).toBe(true)
      expect(result.data?.data).toEqual([])
      expect(result.data?.pagination.total).toBe(0)
      expect(result.data?.pagination.totalPages).toBe(1)
    })

    it('debería aplicar filtros de búsqueda', async () => {
      const mockDestinos = [
        {
          id_destino: 1,
          nombre: 'Salto Encantado',
          descripcion: 'Hermoso salto',
          ubicacion: 'Misiones',
          dificultad: 'baja',
          infraestructura: '[]',
          estatus: true,
          imagenes_destino: [],
          resenas: [],
        },
      ]

      mockSupabase.eq.mockResolvedValue({
        data: mockDestinos,
        error: null,
      })

      const filters = { search: 'Encantado' }
      await getDestinos(filters)

      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
    })

    it('debería aplicar filtros de ubicación', async () => {
      const mockDestinos = []
      mockSupabase.in.mockResolvedValue({
        data: mockDestinos,
        error: null,
      })

      const filters = { ubicaciones: ['Misiones', 'Corrientes'] }
      await getDestinos(filters)

      expect(mockSupabase.in).toHaveBeenCalledWith('ubicacion', [
        'Misiones',
        'Corrientes',
      ])
    })

    it('debería aplicar filtros de dificultad', async () => {
      const mockDestinos = []
      mockSupabase.in.mockResolvedValue({
        data: mockDestinos,
        error: null,
      })

      const filters = { dificultades: ['baja', 'media'] }
      await getDestinos(filters)

      expect(mockSupabase.in).toHaveBeenCalledWith('dificultad', [
        'baja',
        'media',
      ])
    })

    it('debería manejar infraestructura inválida', async () => {
      const mockDestinos = [
        {
          id_destino: 1,
          nombre: 'Destino Test',
          descripcion: 'Test',
          ubicacion: 'Misiones',
          dificultad: 'baja',
          infraestructura: 'invalid json',
          estatus: true,
          imagenes_destino: [],
          resenas: [],
        },
      ]

      mockSupabase.eq.mockResolvedValue({
        data: mockDestinos,
        error: null,
      })
      jest.spyOn(console, 'warn').mockImplementation(() => {})

      const result = await getDestinos()

      expect(result.success).toBe(true)
      expect(result.data?.data[0]?.infraestructura).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'Infraestructura no es un JSON válido:',
        'invalid json',
      )
      console.warn.mockClear()
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error de base de datos')
      mockSupabase.eq.mockResolvedValue({ data: null, error: mockError })

      const result = await getDestinos()

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('getFilterOptions', () => {
    it('debería retornar opciones de filtros correctamente', async () => {
      const mockUbicacionesData = [
        { ubicacion: 'Misiones' },
        { ubicacion: 'Corrientes' },
        { ubicacion: 'Misiones' }, // Duplicado para probar Set
        { ubicacion: 'Entre Ríos' },
      ]

      const mockServiciosData = [
        { infraestructura: '["wifi", "parking"]' },
        { infraestructura: '["restaurante", "baños"]' },
        { infraestructura: '["wifi", "guía"]' }, // wifi duplicado
        { infraestructura: '["mirador"]' },
      ]

      // Mock para la primera consulta (ubicaciones)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockUbicacionesData,
        error: null,
      })

      // Mock para la segunda consulta (servicios)
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockServiciosData,
        error: null,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      expect(result.data?.ubicaciones).toEqual([
        'Corrientes',
        'Entre Ríos',
        'Misiones',
      ])

      expect(result.data?.servicios).toEqual([
        'baños',
        'guía',
        'mirador',
        'parking',
        'restaurante',
        'wifi',
      ])

      expect(result.data?.dificultades).toEqual([
        'baja',
        'media',
        'alta',
        'extrema',
      ])

      expect(mockSupabase.from).toHaveBeenCalledTimes(2)
      expect(mockSupabase.from).toHaveBeenNthCalledWith(1, 'destinos')
      expect(mockSupabase.from).toHaveBeenNthCalledWith(2, 'destinos')

      expect(mockSupabase.select).toHaveBeenNthCalledWith(1, 'ubicacion')
      expect(mockSupabase.select).toHaveBeenNthCalledWith(2, 'infraestructura')

      expect(mockSupabase.eq).toHaveBeenCalledTimes(2)
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)

      expect(mockSupabase.not).toHaveBeenCalledTimes(2)
      expect(mockSupabase.not).toHaveBeenNthCalledWith(
        1,
        'ubicacion',
        'is',
        null,
      )
      expect(mockSupabase.not).toHaveBeenNthCalledWith(
        2,
        'infraestructura',
        'is',
        null,
      )
    })

    it('debería manejar datos vacíos correctamente', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(true)
      expect(result.data?.ubicaciones).toEqual([])
      expect(result.data?.servicios).toEqual([])
      expect(result.data?.dificultades).toEqual([
        'baja',
        'media',
        'alta',
        'extrema',
      ])
    })

    it('debería manejar datos null correctamente', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(true)
      expect(result.data?.ubicaciones).toEqual([])
      expect(result.data?.servicios).toEqual([])
      expect(result.data?.dificultades).toEqual([
        'baja',
        'media',
        'alta',
        'extrema',
      ])
    })

    it('debería manejar infraestructura con JSON inválido', async () => {
      const mockUbicacionesData = [{ ubicacion: 'Misiones' }]

      const mockServiciosData = [
        { infraestructura: '["wifi", "parking"]' }, // JSON válido
        { infraestructura: 'invalid json' }, // JSON inválido
        { infraestructura: null }, // null
        { infraestructura: '["restaurante"]' }, // JSON válido
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockUbicacionesData,
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockServiciosData,
        error: null,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(true)
      expect(result.data?.ubicaciones).toEqual(['Misiones'])
      expect(result.data?.servicios).toEqual(['parking', 'restaurante', 'wifi'])
    })

    it('debería filtrar ubicaciones vacías o null', async () => {
      const mockUbicacionesData = [
        { ubicacion: 'Misiones' },
        { ubicacion: '' },
        { ubicacion: null },
        { ubicacion: 'Corrientes' },
        { ubicacion: undefined },
      ]

      const mockServiciosData = [{ infraestructura: '["wifi"]' }]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockUbicacionesData,
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockServiciosData,
        error: null,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(true)
      expect(result.data?.ubicaciones).toEqual(['Corrientes', 'Misiones'])
    })

    it('debería manejar error en consulta de ubicaciones', async () => {
      const mockError = new Error('Error al consultar ubicaciones')

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: null,
        error: mockError,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
      expect(console.error).toHaveBeenCalledWith(
        'Error al obtener opciones de filtros:',
        mockError,
      )
    })

    it('debería manejar error en consulta de servicios', async () => {
      const mockUbicacionesData = [{ ubicacion: 'Misiones' }]
      const mockError = new Error('Error al consultar servicios')

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockUbicacionesData,
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: null,
        error: mockError,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
      expect(console.error).toHaveBeenCalledWith(
        'Error al obtener opciones de filtros:',
        mockError,
      )
    })

    it('debería manejar errores desconocidos', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockRejectedValueOnce('Error no identificado')

      const result = await getFilterOptions()

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Error desconocido al obtener opciones de filtros',
      )
      expect(console.error).toHaveBeenCalled()
    })

    it('debería manejar servicios con arrays anidados complejos', async () => {
      const mockUbicacionesData = [{ ubicacion: 'Misiones' }]
      const mockServiciosData = [
        { infraestructura: '["wifi", "parking", "restaurante"]' },
        { infraestructura: '["wifi", "baños", "mirador"]' },
        { infraestructura: '[]' },
        { infraestructura: '["guía", "wifi"]' },
      ]

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockUbicacionesData,
        error: null,
      })

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValueOnce(mockSupabase)
      mockSupabase.not.mockResolvedValueOnce({
        data: mockServiciosData,
        error: null,
      })

      const result = await getFilterOptions()

      expect(result.success).toBe(true)
      expect(result.data?.servicios).toEqual([
        'baños',
        'guía',
        'mirador',
        'parking',
        'restaurante',
        'wifi',
      ])
    })
  })

  describe('getDestinoById', () => {
    it('debería retornar un destino por ID', async () => {
      const mockDestino = {
        id_destino: 1,
        nombre: 'Destino 1',
        descripcion: 'Descripción 1',
      }

      mockSupabase.single.mockResolvedValue({
        data: mockDestino,
        error: null,
      })

      const result = await getDestinoById(1)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDestino)
      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_destino', 1)
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Destino no encontrado')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const result = await getDestinoById(999)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('createDestino', () => {
    it('debería crear un destino', async () => {
      const nuevoDestino = {
        nombre: 'Nuevo Destino',
        descripcion: 'Nueva Descripción',
        estatus: true,
      }

      const destinoCreado = {
        id_destino: 3,
        ...nuevoDestino,
        fecha_registro: '2023-01-01T00:00:00Z',
        fecha_actualizacion: '2023-01-01T00:00:00Z',
      }

      mockSupabase.single.mockResolvedValue({
        data: destinoCreado,
        error: null,
      })

      const result = await createDestino(nuevoDestino)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(destinoCreado)
      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
      expect(mockSupabase.insert).toHaveBeenCalledWith([{ ...nuevoDestino }])
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al crear destino')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const nuevoDestino = {
        nombre: 'Nuevo Destino',
        descripcion: 'Nueva Descripción',
        estatus: true,
      }

      const result = await createDestino(nuevoDestino)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('updateDestino', () => {
    it('debería actualizar un destino', async () => {
      const actualizacion = {
        nombre: 'Destino Actualizado',
      }

      const destinoActualizado = {
        id_destino: 1,
        nombre: 'Destino Actualizado',
        descripcion: 'Descripción 1',
        fecha_actualizacion: '2023-01-02T00:00:00Z',
      }

      mockSupabase.single.mockResolvedValue({
        data: destinoActualizado,
        error: null,
      })

      const result = await updateDestino(1, actualizacion)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(destinoActualizado)
      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ...actualizacion,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_destino', 1)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al actualizar destino')
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: mockError,
      })

      const actualizacion = {
        nombre: 'Destino Actualizado',
      }

      const result = await updateDestino(1, actualizacion)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('deleteDestino', () => {
    it('debería eliminar (soft delete) un destino', async () => {
      mockSupabase.eq.mockResolvedValue({ error: null })

      const result = await deleteDestino(1)

      expect(result.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          estatus: false,
          fecha_actualizacion: expect.any(String),
        }),
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('id_destino', 1)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al eliminar destino')
      mockSupabase.eq.mockResolvedValue({ error: mockError })

      const result = await deleteDestino(1)

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })

  describe('searchDestinos', () => {
    it('debería buscar destinos por query', async () => {
      const mockDestinos = [
        {
          id_destino: 1,
          nombre: 'Playa',
          descripcion: 'Hermosa playa',
        },
        {
          id_destino: 2,
          nombre: 'Otra playa',
          descripcion: 'Otra hermosa playa',
        },
      ]

      mockSupabase.eq.mockResolvedValue({
        data: mockDestinos,
        error: null,
      })

      const result = await searchDestinos('playa')

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockDestinos)
      expect(mockSupabase.from).toHaveBeenCalledWith('destinos')
      expect(mockSupabase.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'nombre.ilike.%playa%,descripcion.ilike.%playa%,ubicacion.ilike.%playa%',
      )
      expect(mockSupabase.eq).toHaveBeenCalledWith('estatus', true)
    })

    it('debería manejar errores', async () => {
      const mockError = new Error('Error al buscar destinos')
      mockSupabase.eq.mockResolvedValue({ data: null, error: mockError })

      const result = await searchDestinos('playa')

      expect(result.success).toBe(false)
      expect(result.error).toBe(mockError.message)
    })
  })
})
