import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { UsuariosList } from '@/components/usuarios-list'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.fetch = jest.fn()
global.alert = jest.fn()

describe('UsuariosList', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()

  const mockDate = new Date().toISOString();
  
  const mockUsuarios = [
    {
      id_usuario: '1',
      nombre: 'Juan Pérez',
      email: 'juan@ejemplo.com',
      rol: true, // admin
      fecha_registro: mockDate,
    },
    {
      id_usuario: '2',
      nombre: 'María García',
      email: 'maria@ejemplo.com',
      rol: false, // usuario
      fecha_registro: mockDate,
    },
    {
      id_usuario: '3',
      nombre: 'Carlos López',
      email: 'carlos@ejemplo.com',
      rol: true, // admin
      fecha_registro: mockDate,
    },
  ]
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    ;(fetch as jest.Mock).mockClear()
    ;(alert as jest.Mock).mockClear()
  })

  describe('Renderizado inicial', () => {
    it('debe renderizar la tabla con headers correctos', () => {
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      expect(screen.getByText('Nombre')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Rol')).toBeInTheDocument()
      expect(screen.getByText('Acciones')).toBeInTheDocument()
    })

    it('debe renderizar todos los usuarios proporcionados', () => {
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByText('juan@ejemplo.com')).toBeInTheDocument()
      expect(screen.getByText('María García')).toBeInTheDocument()
      expect(screen.getByText('maria@ejemplo.com')).toBeInTheDocument()
      expect(screen.getByText('Carlos López')).toBeInTheDocument()
      expect(screen.getByText('carlos@ejemplo.com')).toBeInTheDocument()
    })

    it('debe mostrar los roles correctamente', () => {
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const adminBadges = screen.getAllByText('Administrador')
      const usuarioBadges = screen.getAllByText('Usuario')
      
      expect(adminBadges).toHaveLength(2)
      expect(usuarioBadges).toHaveLength(1) 
    })

    it('debe mostrar mensaje cuando no hay usuarios', () => {
      render(<UsuariosList usuarios={[]} />)
      
      expect(screen.getByText('No hay usuarios registrados.')).toBeInTheDocument()
    })

    it('debe renderizar botones de editar y eliminar para cada usuario', () => {
      render(<UsuariosList usuarios={mockUsuarios} />)

      const editButtons = screen.getAllByRole('button', { name: /editar/i })
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar/i })
      
      expect(editButtons).toHaveLength(3)
      expect(deleteButtons).toHaveLength(3)
    })
  })

  describe('Funcionalidad de edición', () => {
    it('debe tener el href correcto en el enlace de editar', async () => {
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstEditLink = screen.getAllByRole('link', { name: /editar/i })[0]
      expect(firstEditLink).toHaveAttribute('href', '/dashboard/usuarios/1')
    })
  })

  describe('Funcionalidad de eliminación', () => {
    it('debe mostrar dialog de confirmación al hacer clic en eliminar', async () => {
      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument()
      expect(screen.getByText(/Esta acción no se puede deshacer.*Juan Pérez/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Eliminar definitivamente' })).toBeInTheDocument()
    })

    it('debe cerrar dialog al hacer clic en cancelar', async () => {
      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      await waitFor(() => {
        expect(screen.queryByText('¿Estás seguro?')).not.toBeInTheDocument()
      })
    })

    it('debe llamar a la API DELETE al confirmar eliminación', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      })

      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const confirmButton = screen.getByRole('button', { name: 'Eliminar definitivamente' })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/usuarios/1', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      })
    })

    it('debe llamar onUsuarioDeleted después de eliminación exitosa', async () => {
      const mockOnUsuarioDeleted = jest.fn()
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      })

      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} onUsuarioDeleted={mockOnUsuarioDeleted} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const confirmButton = screen.getByRole('button', { name: 'Eliminar definitivamente' })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockOnUsuarioDeleted).toHaveBeenCalledWith('1')
      })
    })

    it('debe hacer refresh del router si no se proporciona onUsuarioDeleted', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      })

      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const confirmButton = screen.getByRole('button', { name: 'Eliminar definitivamente' })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('debe mostrar alert de error si falla la eliminación', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Failed to parse JSON')),
      })

      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const confirmButton = screen.getByRole('button', { name: 'Eliminar definitivamente' })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith('Error al eliminar juan@ejemplo.com: Error 500: Internal Server Error')
      })
    })

    it('debe mostrar alert con mensaje de error del servidor si está disponible', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest.fn().mockResolvedValue({ message: 'Usuario no encontrado' }),
      })

      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const confirmButton = screen.getByRole('button', { name: 'Eliminar definitivamente' })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(alert).toHaveBeenCalledWith('Error al eliminar juan@ejemplo.com: Usuario no encontrado')
      })
    })

    it('debe resetear estado de carga después de error', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Failed to parse JSON')),
      })

      const user = userEvent.setup()
      render(<UsuariosList usuarios={mockUsuarios} />)
      
      const firstDeleteButton = screen.getAllByRole('button', { name: /eliminar/i })[0]
      await user.click(firstDeleteButton)
      
      const confirmButton = screen.getByRole('button', { name: 'Eliminar definitivamente' })
      await user.click(confirmButton)
      
      await waitFor(() => {
        expect(alert).toHaveBeenCalled()
      })

      expect(screen.queryByText('Eliminando...')).not.toBeInTheDocument()
      expect(confirmButton).not.toBeDisabled()
    })
  })

  describe('Casos edge', () => {
    it('debe manejar usuarios con campos faltantes', () => {
      const usuariosIncompletos = [
        {
          id_usuario: '1',
          nombre: '',
          email: 'test@ejemplo.com',
          rol: true,
          fecha_registro: mockDate,
        },
        {
          id_usuario: '2',
          nombre: 'Usuario Sin Email',
          email: '',
          rol: false,
          fecha_registro: mockDate,
        },
      ]

      render(<UsuariosList usuarios={usuariosIncompletos} />)
      
      expect(screen.getByText('test@ejemplo.com')).toBeInTheDocument()
      expect(screen.getByText('Usuario Sin Email')).toBeInTheDocument()
    })
  })
})