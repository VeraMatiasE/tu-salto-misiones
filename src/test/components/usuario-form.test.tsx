import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { UsuarioForm } from '@/components/usuario-form'
import { signUp } from '@/actions/auth'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/actions/auth', () => ({
  signUp: jest.fn(),
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.fetch = jest.fn()

describe('UsuarioForm', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
    ;(fetch as jest.Mock).mockClear()
    ;(signUp as jest.Mock).mockClear()
  })

  describe('Modo creación', () => {
    it('debe renderizar el formulario en modo creación', () => {
      render(<UsuarioForm />)
      
      expect(screen.getByText('Nombre completo')).toBeInTheDocument()
      expect(screen.getByText('Correo electrónico')).toBeInTheDocument()
      expect(screen.getByText('Contraseña')).toBeInTheDocument()
      expect(screen.getByText('Confirmar contraseña')).toBeInTheDocument()
      expect(screen.getByText('Rol del usuario')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
    })

    it('debe mostrar campos de contraseña en modo creación', () => {
      render(<UsuarioForm />)
      
      expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirmar contraseña')).toBeInTheDocument()
    })

    it('debe llamar a signUp al enviar el formulario', async () => {
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const nombreInput = screen.getByLabelText('Nombre completo')
      const emailInput = screen.getByLabelText('Correo electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      const confirmPasswordInput = screen.getByLabelText('Confirmar contraseña')
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      
      await user.type(nombreInput, 'Juan Pérez')
      await user.type(emailInput, 'juan@ejemplo.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith(expect.any(FormData))
      })
    })

    it('debe mostrar error cuando las contraseñas no coinciden', async () => {
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const nombreInput = screen.getByLabelText('Nombre completo')
      const emailInput = screen.getByLabelText('Correo electrónico')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirmar contraseña')
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      
      await user.type(nombreInput, 'Juan Pérez')
      await user.type(emailInput, 'juan@ejemplo.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password456')
      
      await user.click(submitButton)
      
      expect(signUp).not.toHaveBeenCalled()
    })
  })

  describe('Modo edición', () => {
    const mockInitialData = {
      id_usuario: '123',
      nombre: 'Juan Pérez',
      email: 'juan@ejemplo.com',
      rol: true,
    }

    it('debe renderizar el formulario en modo edición', () => {
      render(<UsuarioForm initialData={mockInitialData} />)
      
      expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument()
      expect(screen.getByDisplayValue('juan@ejemplo.com')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
      
      expect(screen.queryByPlaceholderText('Contraseña')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Confirmar contraseña')).not.toBeInTheDocument()
    })

    it('debe deshabilitar el campo de email en modo edición', () => {
      render(<UsuarioForm initialData={mockInitialData} />)
      
      const emailInput = screen.getByDisplayValue('juan@ejemplo.com')
      expect(emailInput).toBeDisabled()
    })

    it('debe llamar a la API PUT al actualizar', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      })
      
      const user = userEvent.setup()
      render(<UsuarioForm initialData={mockInitialData} />)
      
      const nombreInput = screen.getByDisplayValue('Juan Pérez')
      const submitButton = screen.getByRole('button', { name: 'Actualizar' })
      
      await user.clear(nombreInput)
      await user.type(nombreInput, 'Juan Carlos Pérez')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/usuarios/123', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: 'Juan Carlos Pérez',
            email: 'juan@ejemplo.com',
            rol: true,
          }),
        })
      })
    })

    it('debe redirigir después de actualizar exitosamente', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      })
      
      const user = userEvent.setup()
      render(<UsuarioForm initialData={mockInitialData} />)
      
      const submitButton = screen.getByRole('button', { name: 'Actualizar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/usuarios')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('debe mostrar error si falla la actualización', async () => {
      ;(fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const user = userEvent.setup()
      render(<UsuarioForm initialData={mockInitialData} />)
      
      const submitButton = screen.getByRole('button', { name: 'Actualizar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Ocurrió un error al procesar la solicitud. Por favor, inténtalo de nuevo.')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Interacciones generales', () => {
    it('debe navegar de regreso al hacer clic en Cancelar', async () => {
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard/usuarios')
    })

    it('debe permitir cambiar el rol del usuario', async () => {
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const adminRadio = screen.getByRole('radio', { name: 'Usuario' })
      const userRadio = screen.getByRole('radio', { name: 'Administrador' })
      
      expect(adminRadio).toBeChecked()
      expect(userRadio).not.toBeChecked()
      
      await user.click(userRadio)
      
      expect(userRadio).toBeChecked()
      expect(adminRadio).not.toBeChecked()
    })

    it('debe deshabilitar el botón mientras se envía', async () => {
      let resolveSignUp: () => void
      const mockPromise = new Promise<void>((resolve) => {
        resolveSignUp = resolve
      })
      ;(signUp as jest.Mock).mockReturnValue(mockPromise)
      
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const nombreInput = screen.getByLabelText('Nombre completo')
      const emailInput = screen.getByLabelText('Correo electrónico')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirmar contraseña')
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      
      await user.type(nombreInput, 'Juan Pérez')
      await user.type(emailInput, 'juan@ejemplo.com')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByText('Guardando...')).toBeInTheDocument()
      })
      
      await act(async () => {
        resolveSignUp!()
        await mockPromise
      })

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('debe validar campos requeridos', async () => {
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      await user.click(submitButton)
      
      expect(signUp).not.toHaveBeenCalled()
    })

    it('debe validar formato de email', async () => {
      const user = userEvent.setup()
      render(<UsuarioForm />)
      
      const nombreInput = screen.getByLabelText('Nombre completo')
      const emailInput = screen.getByLabelText('Correo electrónico')
      const passwordInput = screen.getByPlaceholderText('Contraseña')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirmar contraseña')
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      
      await user.type(nombreInput, 'Juan Pérez')
      await user.type(emailInput, 'email-invalido')
      await user.type(passwordInput, 'password123')
      await user.type(confirmPasswordInput, 'password123')
      
      await user.click(submitButton)
      
      expect(signUp).not.toHaveBeenCalled()
    })
  })
})