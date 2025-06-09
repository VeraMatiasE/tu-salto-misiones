import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { SaltosList } from '@/components/saltos-list'
import { SaltoConId } from '@/types/salto'

// Tipos para respuestas de API
interface ApiSuccessResponse {
  success: boolean
  message?: string
}

interface ApiErrorResponse {
  message: string
  error?: string
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next/link', () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>
  Link.displayName = 'Link'
  return Link
})

interface MockRouter {
  refresh: jest.Mock<void, []>
  push: jest.Mock<void, [string]>
  back: jest.Mock<void, []>
  forward: jest.Mock<void, []>
  prefetch: jest.Mock<Promise<void>, [string]>
  replace: jest.Mock<void, [string]>
}

interface MockResponse {
  ok: boolean
  status: number
  statusText: string
  json: jest.Mock<Promise<ApiResponse>, []>
}

const mockFetch = jest.fn<
  Promise<Response>,
  [RequestInfo | URL, RequestInit?]
>()
global.fetch = mockFetch

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('SaltosList', () => {
  const mockRouter: MockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    replace: jest.fn(),
  }

  const mockSaltos: SaltoConId[] = [
    {
      id_destino: '1',
      nombre: 'Salto del Moconá',
      ubicacion: 'El Soberbio, Misiones',
      url_mapa: 'https://maps.google.com/mocona',
      costo_entrada: 0,
      dificultad: 'baja',
      descripcion: '',
      biodiversidad: '',
      infraestructura: [''],
    },
    {
      id_destino: '2',
      nombre: 'Cataratas del Iguazú',
      ubicacion: 'Puerto Iguazú, Misiones',
      url_mapa: 'https://maps.google.com/iguazu',
      costo_entrada: 5000,
      dificultad: 'media',
      descripcion: '',
      biodiversidad: '',
      infraestructura: [''],
    },
    {
      id_destino: '3',
      nombre: 'Salto Encantado',
      ubicacion: 'Aristóbulo del Valle, Misiones',
      url_mapa: 'https://maps.google.com/encantado',
      costo_entrada: 2000,
      dificultad: 'alta',
      descripcion: '',
      biodiversidad: '',
      infraestructura: [''],
    },
  ]

  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter)
    mockFetch.mockClear()
    mockRouter.refresh.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const createMockResponse = (
    data: ApiResponse,
    options: Partial<MockResponse> = {},
  ): MockResponse => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn<Promise<ApiResponse>, []>().mockResolvedValue(data),
    ...options,
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const findDeleteButton = (_container: HTMLElement): HTMLElement => {
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons.find(
      (button) =>
        button.querySelector('svg')?.getAttribute('data-testid')
          === 'trash-icon'
        || button.innerHTML.includes('Trash2')
        || button.className.includes('text-red-500'),
    )
    if (!deleteButton) {
      throw new Error('No se encontró el botón de eliminar')
    }
    return deleteButton
  }

  describe('Renderizado básico', () => {
    test('renderiza la tabla con headers correctos', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Ubicación')).toBeInTheDocument()
      expect(screen.getByText('Costo')).toBeInTheDocument()
      expect(screen.getByText('Dificultad')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()
    })

    test('renderiza todos los saltos proporcionados', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('Salto del Moconá')).toBeInTheDocument()
      expect(screen.getByText('Cataratas del Iguazú')).toBeInTheDocument()
      expect(screen.getByText('Salto Encantado')).toBeInTheDocument()
    })

    test('muestra mensaje cuando no hay saltos', () => {
      render(<SaltosList saltos={[]} />)

      expect(
        screen.getByText(
          'No hay saltos registrados. Agrega uno nuevo para comenzar.',
        ),
      ).toBeInTheDocument()
    })
  })

  describe('Renderizado de datos', () => {
    test('muestra "Gratuito" para costo 0', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('Gratuito')).toBeInTheDocument()
    })

    test('muestra precio formateado para costos > 0', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('$5000')).toBeInTheDocument()
      expect(screen.getByText('$2000')).toBeInTheDocument()
    })

    test('renderiza links de ubicación correctamente', () => {
      render(<SaltosList saltos={mockSaltos} />)

      const linkMocona = screen.getByRole('link', {
        name: /El Soberbio, Misiones/i,
      })
      expect(linkMocona).toHaveAttribute(
        'href',
        'https://maps.google.com/mocona',
      )
      expect(linkMocona).toHaveAttribute('target', '_blank')
      expect(linkMocona).toHaveAttribute('rel', 'noopener noreferrer')
    })

    test('aplica colores correctos según dificultad', () => {
      render(<SaltosList saltos={mockSaltos} />)

      const bajaBadge = screen.getByText('Baja')
      const mediaBadge = screen.getByText('Media')
      const altaBadge = screen.getByText('Alta')

      expect(bajaBadge).toHaveClass('bg-header', 'text-text-secondary')
      expect(mediaBadge).toHaveClass('bg-accent', 'text-text-secondary')
      expect(altaBadge).toHaveClass('bg-primary', 'text-white')
    })

    test('capitaliza correctamente las dificultades', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('Baja')).toBeInTheDocument()
      expect(screen.getByText('Media')).toBeInTheDocument()
      expect(screen.getByText('Alta')).toBeInTheDocument()
    })

    test('maneja dificultad "extrema" correctamente', () => {
      const saltoExtremo: SaltoConId = {
        ...mockSaltos[0],
        dificultad: 'extrema',
      }

      render(<SaltosList saltos={[saltoExtremo]} />)

      const badge = screen.getByText('Extrema')
      expect(badge).toHaveClass('bg-red-100', 'text-red-800')
    })
  })

  describe('Botones de acción', () => {
    test('renderiza botones de editar y eliminar para cada salto', () => {
      render(<SaltosList saltos={mockSaltos} />)

      const editButtons = screen.getAllByRole('button', { name: '' })
      expect(editButtons.length).toBeGreaterThanOrEqual(6)
    })

    test('links de edición apuntan a la URL correcta', () => {
      render(<SaltosList saltos={mockSaltos} />)

      const editLinks = screen.getAllByRole('link')
      const editLinksFiltered = editLinks.filter((link) =>
        link.getAttribute('href')?.includes('/dashboard/saltos/'),
      )

      expect(editLinksFiltered[0]).toHaveAttribute(
        'href',
        '/dashboard/saltos/1',
      )
      expect(editLinksFiltered[1]).toHaveAttribute(
        'href',
        '/dashboard/saltos/2',
      )
      expect(editLinksFiltered[2]).toHaveAttribute(
        'href',
        '/dashboard/saltos/3',
      )
    })
  })

  describe('Funcionalidad de eliminación', () => {
    test('abre dialog de confirmación al hacer clic en eliminar', async () => {
      render(<SaltosList saltos={[mockSaltos[0]]} />)

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument()
        expect(
          screen.getByText(/Esta acción no se puede deshacer/),
        ).toBeInTheDocument()
        expect(
          screen.getByText(
            /Se eliminará permanentemente el registro de Salto del Moconá/,
          ),
        ).toBeInTheDocument()
      })
    })

    test('cancela eliminación correctamente', async () => {
      render(<SaltosList saltos={[mockSaltos[0]]} />)

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancelar')
        fireEvent.click(cancelButton)
      })

      await waitFor(() => {
        expect(screen.queryByText('¿Estás seguro?')).not.toBeInTheDocument()
      })
    })

    test('elimina salto exitosamente con callback', async () => {
      const mockOnSaltoDeleted = jest.fn<void, [string]>()
      const mockResponse = createMockResponse({ success: true })
      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response)

      render(
        <SaltosList
          saltos={[mockSaltos[0]]}
          onSaltoDeleted={mockOnSaltoDeleted}
        />,
      )

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        const confirmButton = screen.getByText('Eliminar definitivamente')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/destinos/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        expect(mockOnSaltoDeleted).toHaveBeenCalledWith('1')
      })
    })

    test('llama a router.refresh cuando no hay callback onSaltoDeleted', async () => {
      const mockResponse = createMockResponse({ success: true })
      mockFetch.mockResolvedValueOnce(mockResponse as unknown as Response)

      render(<SaltosList saltos={[mockSaltos[0]]} />)

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        const confirmButton = screen.getByText('Eliminar definitivamente')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled()
      })
    })

    test('maneja errores de red correctamente', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<SaltosList saltos={[mockSaltos[0]]} />)

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        const confirmButton = screen.getByText('Eliminar definitivamente')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error al eliminar Salto del Moconá: Network error',
        )
      })

      alertSpy.mockRestore()
    })

    test('maneja errores HTTP correctamente', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

      const errorResponse = createMockResponse(
        { message: 'Salto no encontrado' },
        { ok: false, status: 404, statusText: 'Not Found' },
      )
      mockFetch.mockResolvedValueOnce(errorResponse as unknown as Response)

      render(<SaltosList saltos={[mockSaltos[0]]} />)

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        const confirmButton = screen.getByText('Eliminar definitivamente')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error al eliminar Salto del Moconá: Salto no encontrado',
        )
      })

      alertSpy.mockRestore()
    })

    test('maneja errores HTTP sin mensaje personalizado', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

      const errorResponse: MockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest
          .fn<Promise<ApiResponse>, []>()
          .mockRejectedValue(new Error('Invalid JSON')),
      }
      mockFetch.mockResolvedValueOnce(errorResponse as unknown as Response)

      render(<SaltosList saltos={[mockSaltos[0]]} />)

      const deleteButton = findDeleteButton(document.body)
      fireEvent.click(deleteButton)

      await waitFor(() => {
        const confirmButton = screen.getByText('Eliminar definitivamente')
        fireEvent.click(confirmButton)
      })

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Error al eliminar Salto del Moconá: Error 500: Internal Server Error',
        )
      })

      alertSpy.mockRestore()
    })
  })

  describe('Casos edge', () => {
    test('maneja dificultad desconocida', () => {
      const saltoConDificultadRara: SaltoConId = {
        ...mockSaltos[0],
        dificultad: 'super_extrema' as unknown as SaltoConId['dificultad'],
      }

      render(<SaltosList saltos={[saltoConDificultadRara]} />)

      const badge = screen.getByText('Super_extrema')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    test('maneja múltiples eliminaciones simultáneas', async () => {
      const mockResponse = createMockResponse({ success: true })
      mockFetch.mockResolvedValue(mockResponse as unknown as Response)

      render(<SaltosList saltos={mockSaltos} />)

      const deleteButtons = screen
        .getAllByRole('button')
        .filter((button) => button.className.includes('text-red-500'))

      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        const confirmButton = screen.getByText('Eliminar definitivamente')
        fireEvent.click(confirmButton)
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('renderiza correctamente con props opcionales', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('Salto del Moconá')).toBeInTheDocument()
    })
  })

  describe('Tipos y propiedades', () => {
    test('acepta callback onSaltoDeleted tipado correctamente', () => {
      const mockCallback: (id: string) => void = jest.fn()

      render(<SaltosList saltos={mockSaltos} onSaltoDeleted={mockCallback} />)

      expect(screen.getByText('Salto del Moconá')).toBeInTheDocument()
    })

    test('funciona sin callback onSaltoDeleted', () => {
      render(<SaltosList saltos={mockSaltos} />)

      expect(screen.getByText('Salto del Moconá')).toBeInTheDocument()
    })
  })
})
