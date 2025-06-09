import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagenesList } from '@/components/imagenes-list'
import { ImagenesDestino } from '@/types/imagenes'

jest.mock('next-cloudinary', () => ({
  CldImage: ({
    src,
    alt,
    fill,
    ...props
  }: {
    src: string
    alt: string
    fill: boolean
    [key: string]: unknown
  }) => (
    <img
      src={src}
      alt={alt}
      data-fill={fill}
      {...props}
      data-testid="cld-image"
    />
  ),
}))

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('ImagenesList', () => {
  const mockDate = new Date().toISOString()

  const mockImagenesDestino: ImagenesDestino[] = [
    {
      id_destino: '1',
      nombre: 'Salto del Arcoíris',
      imagenes: [
        {
          id_imagen: '1',
          url_imagen:
            'https://res.cloudinary.com/demo/image/upload/v1/sample1.jpg',
          fecha_actualizacion: mockDate,
          public_id: 'sample1.jpg',
        },
        {
          id_imagen: '2',
          url_imagen:
            'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg',
          fecha_actualizacion: mockDate,
          public_id: 'sample2.jpg',
        },
        {
          id_imagen: '3',
          url_imagen:
            'https://res.cloudinary.com/demo/image/upload/v1/sample3.jpg',
          fecha_actualizacion: mockDate,
          public_id: 'sample3.jpg',
        },
      ],
    },
    {
      id_destino: '2',
      nombre: 'Salto Encantado',
      imagenes: [
        {
          id_imagen: '4',
          url_imagen:
            'https://res.cloudinary.com/demo/image/upload/v1/sample4.jpg',
          fecha_actualizacion: mockDate,
          public_id: 'sample4.jpg',
        },
      ],
    },
    {
      id_destino: '3',
      nombre: 'Salto Sin Imágenes',
      imagenes: [],
    },
  ]

  describe('Renderizado inicial', () => {
    it('debe renderizar todos los destinos proporcionados', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      expect(screen.getByText('Salto del Arcoíris')).toBeInTheDocument()
      expect(screen.getByText('Salto Encantado')).toBeInTheDocument()
      expect(screen.getByText('Salto Sin Imágenes')).toBeInTheDocument()
    })

    it('debe mostrar el contador de imágenes correctamente', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      expect(screen.getByText('3 imágenes')).toBeInTheDocument()
      expect(screen.getByText('1 imagen')).toBeInTheDocument()
      expect(screen.getByText('0 imágenes')).toBeInTheDocument()
    })

    it('debe renderizar botones de gestionar imágenes para todos los destinos', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const buttons = screen.getAllByText('Gestionar imágenes')
      expect(buttons).toHaveLength(3)
    })
  })

  describe('Manejo de imágenes', () => {
    it('debe mostrar la primera imagen como imagen principal cuando hay imágenes', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const mainImages = screen.getAllByTestId('cld-image')

      expect(mainImages[0]).toHaveAttribute(
        'src',
        'https://res.cloudinary.com/demo/image/upload/v1/sample1.jpg',
      )
      expect(mainImages[0]).toHaveAttribute('alt', 'Salto del Arcoíris')

      expect(mainImages[4]).toHaveAttribute(
        'src',
        'https://res.cloudinary.com/demo/image/upload/v1/sample4.jpg',
      )
      expect(mainImages[4]).toHaveAttribute('alt', 'Salto Encantado')
    })

    it('debe mostrar icono placeholder cuando no hay imágenes', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const placeholderIcon = screen.getByLabelText('placeholder')
      expect(placeholderIcon).toBeInTheDocument()
      expect(placeholderIcon).toHaveClass(
        'h-12',
        'w-12',
        'text-muted-foreground',
        'opacity-50',
      )
    })

    it('debe mostrar thumbnails adicionales cuando hay múltiples imágenes', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const allImages = screen.getAllByTestId('cld-image')

      // Salto del Arcoíris debe tener 1 imagen principal + 3 thumbnails = 4 total
      // Salto Encantado debe tener 1 imagen principal + 1 thumbnail = 2 total
      // Salto Sin Imágenes debe tener 0 imágenes
      expect(allImages).toHaveLength(6) // 4 + 2 + 0
    })

    it('debe limitar thumbnails a máximo 4 imágenes', () => {
      const destinoConMuchasImagenes: ImagenesDestino[] = [
        {
          id_destino: '1',
          nombre: 'Salto con Muchas Imágenes',
          imagenes: Array.from({ length: 10 }, (_, i) => ({
            id_imagen: `${i + 1}`,
            url_imagen: `https://res.cloudinary.com/demo/image/upload/v1/sample${i + 1}.jpg`,
            public_id: `sample${i + 1}.jpg`,
            fecha_actualizacion: mockDate,
          })),
        },
      ]

      render(<ImagenesList imagenes_saltos={destinoConMuchasImagenes} />)

      const allImages = screen.getAllByTestId('cld-image')
      // Debe mostrar 1 imagen principal + 4 thumbnails máximo = 5 total
      expect(allImages).toHaveLength(5)
    })

    it('debe mostrar thumbnails con aspect ratio cuadrado', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const thumbnailContainers = screen
        .getAllByTestId('cld-image')
        .slice(1, 4) // Los thumbnails del primer destino
        .map((img) => img.parentElement)

      thumbnailContainers.forEach((container) => {
        expect(container).toHaveClass('aspect-square')
      })
    })
  })

  describe('Navegación', () => {
    it('debe crear enlaces correctos para gestionar imágenes', () => {
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const links = screen.getAllByRole('link')

      expect(links[0]).toHaveAttribute('href', '/dashboard/imagenes/1')
      expect(links[1]).toHaveAttribute('href', '/dashboard/imagenes/2')
      expect(links[2]).toHaveAttribute('href', '/dashboard/imagenes/3')
    })

    it('debe hacer los botones de gestionar imágenes clickeables', async () => {
      const user = userEvent.setup()
      render(<ImagenesList imagenes_saltos={mockImagenesDestino} />)

      const firstButton = screen.getAllByText('Gestionar imágenes')[0]

      await user.click(firstButton)

      expect(firstButton).toBeInTheDocument()
    })
  })

  describe('Casos edge', () => {
    it('debe manejar lista vacía de destinos', () => {
      render(<ImagenesList imagenes_saltos={[]} />)

      expect(screen.queryByText('Gestionar imágenes')).not.toBeInTheDocument()
    })

    it('debe manejar destinos con nombres vacíos', () => {
      const destinosConNombresVacios: ImagenesDestino[] = [
        {
          id_destino: '1',
          nombre: '',
          imagenes: [],
        },
      ]

      render(<ImagenesList imagenes_saltos={destinosConNombresVacios} />)

      expect(screen.getByText('Gestionar imágenes')).toBeInTheDocument()
      expect(screen.getByText('0 imágenes')).toBeInTheDocument()
    })
  })
})
