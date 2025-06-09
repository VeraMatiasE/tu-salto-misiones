import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import Navigation from '@/components/navigation'

interface MockLinkProps {
  children: React.ReactNode
  href: string
  [key: string]: unknown
}

interface MockCldImageProps {
  src: string
  alt: string
  [key: string]: unknown
}

interface MockButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: string
  size?: string
  className?: string
  [key: string]: unknown
}

interface MockUseMobileMenuReturn {
  isMobile: boolean
  isMobileMenuOpen: boolean
  toggleMobileMenu: jest.Mock
  closeMobileMenu: jest.Mock
}

interface MockUserProfile {
  user: {
    id: string
    email: string
    nombre: string
  }
  profile: {
    id: string
    nombre: string
    foto_perfil: string | null
    usuario_id: string
    telefono: string | null
    fecha_nacimiento: string | null
    genero: string | null
    ubicacion: string | null
    biografia: string | null
    redes_sociales: string | null
    fecha_registro: string
    ultima_actividad: string
    verificado: boolean
    activo: boolean
  }
}

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: MockLinkProps) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

jest.mock('next-cloudinary', () => ({
  CldImage: ({ src, alt, ...props }: MockCldImageProps) => (
    <img src={src} alt={alt} {...props} />
  ),
}))

jest.mock('@/hooks/use-mobile-menu', () => ({
  useMobileMenu: jest.fn<MockUseMobileMenuReturn, []>(() => ({
    isMobile: false,
    isMobileMenuOpen: false,
    toggleMobileMenu: jest.fn(),
    closeMobileMenu: jest.fn(),
  })),
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    size,
    className,
    ...props
  }: MockButtonProps) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/actions/auth', () => ({
  logOut: jest.fn(),
}))

jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User</div>,
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  LogOut: () => <div data-testid="logout-icon">LogOut</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  UserPlus: () => <div data-testid="user-plus-icon">UserPlus</div>,
  LogIn: () => <div data-testid="login-icon">LogIn</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  Map: () => <div data-testid="map-icon">Map</div>,
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Navigation Component', () => {
  const mockUseMobileMenu = jest.requireMock('@/hooks/use-mobile-menu')
    .useMobileMenu as jest.Mock<MockUseMobileMenuReturn, []>

  beforeEach(() => {
    mockFetch.mockClear()
    mockUseMobileMenu.mockReturnValue({
      isMobile: false,
      isMobileMenuOpen: false,
      toggleMobileMenu: jest.fn(),
      closeMobileMenu: jest.fn(),
    })
  })

  describe('Variante default - Usuario no autenticado', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })
    })

    test('debe renderizar el título principal', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByText('Tu Salto Misiones')).toBeInTheDocument()
      })
    })

    test('debe mostrar botones de login y registro para usuarios no autenticados', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
        expect(screen.getByText('Registrarse')).toBeInTheDocument()
      })
    })

    test('debe mostrar enlace "Todos los Saltos" en desktop', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByText('Todos los Saltos')).toBeInTheDocument()
      })
    })
  })

  describe('Variante default - Usuario autenticado', () => {
    const mockUserProfile: MockUserProfile = {
      user: {
        id: '1',
        email: 'test@example.com',
        nombre: 'Usuario Test',
      },
      profile: {
        id: '1',
        nombre: 'Usuario Test',
        foto_perfil: null,
        usuario_id: '1',
        telefono: null,
        fecha_nacimiento: null,
        genero: null,
        ubicacion: null,
        biografia: null,
        redes_sociales: null,
        fecha_registro: '2024-01-01',
        ultima_actividad: '2024-01-01',
        verificado: false,
        activo: true,
      },
    }

    beforeAll(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUserProfile),
      })
    })

    test('debe mostrar información del usuario cuando está autenticado', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByText('Usuario Test')).toBeInTheDocument()
        expect(screen.getByText('Salir')).toBeInTheDocument()
      })
    })

    test('debe mostrar enlaces de navegación para usuarios autenticados', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeInTheDocument()
        expect(screen.getByText('Favoritos')).toBeInTheDocument()
      })
    })

    test('debe renderizar imagen de perfil cuando existe', async () => {
      const userWithPhoto: MockUserProfile = {
        ...mockUserProfile,
        profile: {
          ...mockUserProfile.profile,
          nombre: 'Usuario Mock',
          foto_perfil: 'test-image-url',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(userWithPhoto),
      })

      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByAltText('Foto de perfil')).toBeInTheDocument()
      })
    })
  })

  describe('Variante back', () => {
    test('debe renderizar botón de volver', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      render(<Navigation variant="back" currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument()
      })
    })

    test('debe tener enlace de navegación hacia atrás', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false })

      render(<Navigation variant="back" currentPage="inicio" />)

      await waitFor(() => {
        const backLink = screen.getByLabelText('Volver al inicio')
        expect(backLink).toHaveAttribute('href', '/')
      })
    })
  })

  describe('Funcionalidad móvil', () => {
    beforeEach(() => {
      mockUseMobileMenu.mockReturnValue({
        isMobile: true,
        isMobileMenuOpen: false,
        toggleMobileMenu: jest.fn(),
        closeMobileMenu: jest.fn(),
      })
      mockFetch.mockResolvedValueOnce({ ok: false })
    })

    test('debe mostrar botón de menú en móvil', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByTestId('menu-icon')).toBeInTheDocument()
      })
    })

    test('debe abrir menú móvil al hacer click', async () => {
      const toggleMobileMenu = jest.fn()
      mockUseMobileMenu.mockReturnValue({
        isMobile: true,
        isMobileMenuOpen: false,
        toggleMobileMenu,
        closeMobileMenu: jest.fn(),
      })

      render(<Navigation currentPage="inicio" />)

      await waitFor(async () => {
        const menuButton = screen.getByLabelText('Abrir menú')
        await userEvent.click(menuButton)

        expect(toggleMobileMenu).toHaveBeenCalled()
      })
    })
  })

  describe('Menú móvil abierto', () => {
    const closeMobileMenu = jest.fn()

    beforeEach(() => {
      mockUseMobileMenu.mockReturnValue({
        isMobile: true,
        isMobileMenuOpen: true,
        toggleMobileMenu: jest.fn(),
        closeMobileMenu,
      })
      mockFetch.mockResolvedValueOnce({ ok: false })
    })

    test('debe renderizar menú móvil cuando está abierto', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(async () => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByLabelText('Menú de navegación')).toBeInTheDocument()
      })
    })

    test('debe cerrar menú al hacer click en X', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(async () => {
        const closeButton = screen.getByLabelText('Cerrar menú')
        await userEvent.click(closeButton)
      })

      expect(closeMobileMenu).toHaveBeenCalled()
    })

    test('debe cerrar menú al presionar Escape', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(async () => {
        fireEvent.keyDown(document, { key: 'Escape' })
        expect(closeMobileMenu).toHaveBeenCalled()
      })
    })

    test('debe mostrar enlaces de navegación en menú móvil', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(async () => {
        expect(screen.getByTestId('home-icon')).toBeInTheDocument()
        expect(screen.getByTestId('map-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Usuario autenticado en menú móvil', () => {
    const mockUserProfile: MockUserProfile = {
      user: {
        id: '1',
        email: 'test@example.com',
        nombre: 'Usuario Test',
      },
      profile: {
        id: '1',
        nombre: 'Usuario Test',
        foto_perfil: null,
        usuario_id: '1',
        telefono: null,
        fecha_nacimiento: null,
        genero: null,
        ubicacion: null,
        biografia: null,
        redes_sociales: null,
        fecha_registro: '2024-01-01',
        ultima_actividad: '2024-01-01',
        verificado: false,
        activo: true,
      },
    }

    beforeEach(() => {
      mockUseMobileMenu.mockReturnValue({
        isMobile: true,
        isMobileMenuOpen: true,
        toggleMobileMenu: jest.fn(),
        closeMobileMenu: jest.fn(),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserProfile),
      })
    })

    test('debe mostrar perfil de usuario en menú móvil', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByText('Usuario Test')).toBeInTheDocument()
        expect(screen.getByText('Cuenta activa')).toBeInTheDocument()
      })
    })

    test('debe mostrar enlace de favoritos para usuarios autenticados', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(screen.getByTestId('star-icon')).toBeInTheDocument()
      })
    })
  })

  describe('Página actual', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({ ok: false })
      mockUseMobileMenu.mockReturnValue({
        isMobile: true,
        isMobileMenuOpen: true,
        toggleMobileMenu: jest.fn(),
        closeMobileMenu: jest.fn(),
      })
    })

    test('debe marcar página de inicio como activa', async () => {
      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        const inicioLink = screen.getByText('Inicio').closest('a')
        expect(inicioLink).toHaveAttribute('data-active', 'true')
      })
    })

    test('debe marcar página de saltos como activa', async () => {
      render(<Navigation currentPage="saltos" />)

      await waitFor(() => {
        const saltosLink = screen.getByText('Todos los Saltos').closest('a')
        expect(saltosLink).toHaveAttribute('data-active', 'true')
      })
    })
  })

  describe('Manejo de errores', () => {
    test('debe manejar errores de fetch correctamente', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      render(<Navigation currentPage="inicio" />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching user:',
          expect.any(Error),
        )
      })

      consoleSpy.mockRestore()
    })
  })
})
