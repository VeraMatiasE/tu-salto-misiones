import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagenUpload } from '@/components/imagen-upload'
import { Imagen } from '@/types/imagenes'

jest.mock('next-cloudinary', () => ({
  CldImage: ({
    src,
    alt,
    fill,
    onLoad,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError,
    ...props
  }: {
    src: string
    alt: string
    fill: boolean
    onLoad?: () => void
    onError?: () => void
    [key: string]: unknown
  }) => {
    setTimeout(() => {
      if (onLoad) onLoad()
    }, 100)

    return (
      <img
        src={src}
        alt={alt}
        data-fill={fill}
        {...props}
        data-testid="cld-image"
      />
    )
  },
}))

// Mock de next/image
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    fill,
    ...props
  }: {
    src: string
    alt: string
    fill?: boolean
    [key: string]: unknown
  }) {
    return (
      <img
        src={src}
        alt={alt}
        data-fill={fill}
        {...props}
        data-testid="next-image"
      />
    )
  }
})

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

const mockGetImageSize = jest.fn()
const mockSetSizes = jest.fn()
jest.mock('@/hooks/useImageSizes', () => ({
  useImageSizes: () => ({
    sizes: {
      'test-image-1.jpg': { kb: 250, mb: 0.25 },
      'test-image-2.jpg': { kb: 500, mb: 0.5 },
    },
    setSizes: mockSetSizes,
    loading: {},
    errors: {},
    getImageSize: mockGetImageSize,
  }),
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.URL.createObjectURL = jest.fn(() => 'mock-blob-url')
global.URL.revokeObjectURL = jest.fn()

global.fetch = jest.fn()

describe('ImagenUpload', () => {
  const mockDate = '2024-01-15T10:30:00Z'

  const mockInitialImages: Imagen[] = [
    {
      id_imagen: '1',
      url_imagen: 'test-image-1.jpg',
      fecha_actualizacion: mockDate,
      public_id: 'test-image-1',
    },
    {
      id_imagen: '2',
      url_imagen: 'test-image-2.jpg',
      fecha_actualizacion: mockDate,
      public_id: 'test-image-2',
    },
  ]

  const defaultProps = {
    saltoId: 'test-salto-1',
    initialImages: mockInitialImages,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar las pestañas correctamente', () => {
      render(<ImagenUpload {...defaultProps} />)

      expect(screen.getByRole('tab', { name: 'Galería' })).toBeInTheDocument()
      expect(
        screen.getByRole('tab', { name: 'Subir imágenes' }),
      ).toBeInTheDocument()
    })

    it('debe mostrar la pestaña de galería por defecto', () => {
      render(<ImagenUpload {...defaultProps} />)

      expect(screen.getByRole('tab', { name: 'Galería' })).toHaveAttribute(
        'data-state',
        'active',
      )
      expect(
        screen.getByRole('tab', { name: 'Subir imágenes' }),
      ).toHaveAttribute('data-state', 'inactive')
    })

    it('debe mostrar el botón de volver a la galería', () => {
      render(<ImagenUpload {...defaultProps} />)

      expect(
        screen.getByRole('button', { name: 'Volver a la galería' }),
      ).toBeInTheDocument()
    })
  })

  describe('Pestaña de Galería - Con imágenes', () => {
    it('debe mostrar todas las imágenes iniciales', () => {
      render(<ImagenUpload {...defaultProps} />)

      const images = screen.getAllByTestId('cld-image')
      expect(images).toHaveLength(2)

      expect(images[0]).toHaveAttribute('src', 'test-image-1.jpg')
      expect(images[1]).toHaveAttribute('src', 'test-image-2.jpg')
    })

    it('debe mostrar información de las imágenes en cards', () => {
      render(<ImagenUpload {...defaultProps} />)

      expect(screen.getByText('Imagen 1')).toBeInTheDocument()
      expect(screen.getByText('Imagen 2')).toBeInTheDocument()
    })

    it('debe mostrar la tabla con información detallada', () => {
      render(<ImagenUpload {...defaultProps} />)

      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Tamaño')).toBeInTheDocument()
      expect(screen.getByText('Fecha')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()

      expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument()
      expect(screen.getByText('test-image-2.jpg')).toBeInTheDocument()
    })

    it('debe mostrar botones de eliminar para cada imagen', () => {
      render(<ImagenUpload {...defaultProps} />)

      const deleteButtons = screen.getAllByLabelText(/eliminar imagen/i)
      expect(deleteButtons).toHaveLength(4) // 2 en cards + 2 en tabla
    })
  })

  describe('Pestaña de Galería - Sin imágenes', () => {
    it('debe mostrar estado vacío cuando no hay imágenes', () => {
      render(<ImagenUpload saltoId="test-salto" initialImages={[]} />)

      expect(screen.getByText('No hay imágenes')).toBeInTheDocument()
      expect(
        screen.getByText('Este destino aún no tiene imágenes.'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Subir imágenes' }),
      ).toBeInTheDocument()
    })

    it('debe cambiar a pestaña de subir al hacer clic en el botón', async () => {
      const user = userEvent.setup()
      render(<ImagenUpload saltoId="test-salto" initialImages={[]} />)

      const uploadButton = screen.getByRole('button', {
        name: 'Subir imágenes',
      })
      await user.click(uploadButton)

      expect(
        screen.getByRole('tab', { name: 'Subir imágenes' }),
      ).toHaveAttribute('data-state', 'active')
    })
  })

  describe('Pestaña de Subir imágenes', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<ImagenUpload {...defaultProps} />)

      const uploadTab = screen.getByRole('tab', {
        name: 'Subir imágenes',
      })
      await user.click(uploadTab)
    })

    it('debe mostrar el formulario de subida', () => {
      expect(screen.getByLabelText('Seleccionar imágenes')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /subir/i })).toBeInTheDocument()
    })

    it('debe mostrar las recomendaciones para imágenes', () => {
      expect(
        screen.getByText('Recomendaciones para imágenes'),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/usa imágenes de alta calidad/i),
      ).toBeInTheDocument()
    })

    it('debe deshabilitar el botón de subir cuando no hay archivos seleccionados', () => {
      const uploadButton = screen.getByRole('button', { name: /subir/i })
      expect(uploadButton).toBeDisabled()
    })
  })

  describe('Selección de archivos', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<ImagenUpload {...defaultProps} />)

      const uploadTab = screen.getByRole('tab', {
        name: 'Subir imágenes',
      })
      await user.click(uploadTab)
    })

    it('debe permitir seleccionar archivos válidos', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText('Seleccionar imágenes')

      await user.upload(input, file)

      expect(screen.getByText('Vista previa (1 imagen)')).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Subir (1)' }),
      ).not.toBeDisabled()
    })

    it('debe mostrar error para archivos con tipo inválido', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByLabelText('Seleccionar imágenes')
      input.setAttribute('accept', 'text/plain')

      await user.upload(input, file)

      await waitFor(() => {
        expect(screen.getByText(/no es una imagen válida/i)).toBeInTheDocument()
      })
    })

    it('debe mostrar error para archivos muy grandes', async () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })
      const input = screen.getByLabelText('Seleccionar imágenes')

      await user.upload(input, largeFile)

      expect(screen.getByText(/excede el tamaño máximo/i)).toBeInTheDocument()
    })

    it('debe permitir seleccionar múltiples archivos', async () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.png', { type: 'image/png' }),
      ]
      const input = screen.getByLabelText('Seleccionar imágenes')

      await user.upload(input, files)

      expect(screen.getByLabelText('Vista previa')).toHaveTextContent(
        'Vista previa (2 imagenes)',
      )
      expect(
        screen.getByRole('button', { name: 'Subir (2)' }),
      ).not.toBeDisabled()
    })
  })

  describe('Vista previa de archivos', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<ImagenUpload {...defaultProps} />)

      const uploadTab = screen.getByRole('tab', {
        name: 'Subir imágenes',
      })
      await user.click(uploadTab)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText('Seleccionar imágenes')
      await user.upload(input, file)
    })

    it('debe mostrar vista previa de archivos seleccionados', () => {
      expect(screen.getByTestId('next-image')).toBeInTheDocument()
      expect(screen.getByTestId('next-image')).toHaveAttribute(
        'src',
        'mock-blob-url',
      )
    })

    it('debe permitir eliminar archivos de la vista previa', async () => {
      const removeButton = screen.getByRole('button', { name: '' })
      await user.click(removeButton)

      expect(screen.queryByText('Vista previa')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /subir/i })).toBeDisabled()
    })
  })

  describe('Subida de archivos', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(async () => {
      user = userEvent.setup()
      render(<ImagenUpload {...defaultProps} />)

      const uploadTab = screen.getByRole('tab', {
        name: 'Subir imágenes',
      })
      await user.click(uploadTab)

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const input = screen.getByLabelText('Seleccionar imágenes')
      await user.upload(input, file)
    })

    it('debe manejar errores durante la subida', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Upload failed'))

      const uploadButton = screen.getByRole('button', {
        name: 'Subir (1)',
      })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(
          screen.getByText(/ocurrió un error al subir/i),
        ).toBeInTheDocument()
      })
      ;(console.error as jest.Mock).mockRestore()
    })

    it('debe limpiar el formulario después de subida exitosa', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id_imagen: '3',
              url_imagen: 'new-image.jpg',
              fecha_actualizacion: mockDate,
              public_id: 'new-image',
            },
          }),
      })

      const uploadButton = screen.getByRole('button', {
        name: 'Subir (1)',
      })
      await user.click(uploadButton)

      await waitFor(() => {
        expect(screen.queryByText('Vista previa')).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: /subir/i })).toBeDisabled()
      })
    })
  })

  describe('Eliminación de imágenes', () => {
    let user: ReturnType<typeof userEvent.setup>

    beforeEach(() => {
      user = userEvent.setup()
    })

    it('debe mostrar diálogo de confirmación al eliminar', async () => {
      render(<ImagenUpload {...defaultProps} />)

      const deleteButtons = screen.getAllByLabelText(/eliminar imagen/i)
      await user.click(deleteButtons[0])

      expect(screen.getByText('¿Eliminar esta imagen?')).toBeInTheDocument()
      expect(screen.getByLabelText('¿Eliminar esta imagen?')).toHaveTextContent(
        'Esta acción no se puede deshacer',
      )
    })

    it('debe cancelar eliminación al hacer clic en Cancelar', async () => {
      render(<ImagenUpload {...defaultProps} />)

      const deleteButtons = screen.getAllByLabelText(/eliminar imagen/i)
      await user.click(deleteButtons[0])

      const cancelButton = screen.getByRole('button', {
        name: 'Cancelar',
      })
      await user.click(cancelButton)

      expect(
        screen.queryByText('¿Eliminar esta imagen?'),
      ).not.toBeInTheDocument()
    })

    it('debe eliminar imagen al confirmar', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      render(<ImagenUpload {...defaultProps} />)

      const deleteButtons = screen.getAllByLabelText(/eliminar imagen/i)
      await user.click(deleteButtons[0])

      const confirmButton = screen.getByRole('button', {
        name: 'Eliminar',
      })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/imagenes/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })
    })
  })

  describe('Navegación', () => {
    it('debe navegar de vuelta a la galería principal', async () => {
      const user = userEvent.setup()
      render(<ImagenUpload {...defaultProps} />)

      const backButton = screen.getByRole('button', {
        name: 'Volver a la galería',
      })
      await user.click(backButton)

      expect(mockPush).toHaveBeenCalledWith('/dashboard/imagenes')
    })
  })

  describe('Casos edge', () => {
    it('debe manejar imágenes sin fecha de actualización', () => {
      const imagesWithoutDate: Imagen[] = [
        {
          id_imagen: '1',
          url_imagen: 'test-image.jpg',
          fecha_actualizacion: '',
          public_id: 'test-image',
        },
      ]

      render(
        <ImagenUpload saltoId="test-salto" initialImages={imagesWithoutDate} />,
      )

      expect(screen.getByText('Imagen 1')).toBeInTheDocument()
    })
  })
})
