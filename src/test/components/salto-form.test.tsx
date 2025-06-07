import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { SaltoForm } from '@/components/salto-form'
import { SaltoFormProps } from '@/types/salto'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

global.fetch = jest.fn()

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true
});

const mockRouter = {
  push: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  replace: jest.fn(),
}

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>

describe('SaltoForm', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter)
    jest.clearAllMocks()
    ;(global.fetch as jest.MockedFunction<typeof fetch>).mockClear()
  })

  const validFormData = {
    nombre: 'Salto del Arcoiris',
    descripcion: 'Un hermoso salto con formaciones rocosas',
    ubicacion: '-27.0875, -54.4444',
    url_mapa: 'https://maps.google.com/?q=-27.0875,-54.4444',
    costo_entrada: 1000,
    infraestructura: ['baños', 'estacionamiento', 'camping', 'guias', 'senderos', 'miradores'],
    biodiversidad: 'Rica fauna y flora nativa',
    dificultad: 'media' as const,
  }

  const initialData: SaltoFormProps['initialData'] = {
    id_destino: "1",
    ...validFormData,
  }

  describe('Renderizado inicial', () => {
    test('renderiza el formulario vacío correctamente', () => {
      render(<SaltoForm />)
      
      expect(screen.getByText('Información básica')).toBeInTheDocument()
      expect(screen.getByText('Características')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre del destino')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument()
    })

    test('renderiza el formulario con datos iniciales para edición', () => {
      render(<SaltoForm initialData={initialData} />)
      
      expect(screen.getByDisplayValue('Salto del Arcoiris')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Un hermoso salto con formaciones rocosas')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument()
    })

    test('muestra las pestañas correctamente', () => {
      render(<SaltoForm />)
      
      const tabInformacion = screen.getByRole('tab', { name: 'Información básica' })
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      
      expect(tabInformacion).toBeInTheDocument()
      expect(tabCaracteristicas).toBeInTheDocument()
      expect(tabInformacion).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Validación de formulario', () => {
    test('muestra errores de validación cuando los campos están vacíos', async () => {
      const user = userEvent.setup()
      render(<SaltoForm />)
      
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('El nombre debe tener al menos 3 caracteres.')).toBeInTheDocument()
        expect(screen.getByText('La descripción debe tener al menos 10 caracteres.')).toBeInTheDocument()
        expect(screen.getByText('Ingresa coordenadas válidas.')).toBeInTheDocument()
      })
    })

    test('valida URL de Google Maps', async () => {
      const user = userEvent.setup()
      render(<SaltoForm />)
      
      const urlInput = screen.getByLabelText('Link a Google Maps')
      await user.type(urlInput, 'invalid-url')
      
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Ingresa una URL válida de Google Maps.')).toBeInTheDocument()
      })
    })

    test('valida costo de entrada no negativo', async () => {
      render(<SaltoForm />)
      
      const costoInput = screen.getByLabelText('Costo (ARS)')
      fireEvent.change(costoInput, { target: { value: '-100' } });

      const submitButton = screen.getByRole('button', { name: 'Crear' })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('El valor debe de ser mayor o igual a 0')).toBeInTheDocument()
      })
    })
  })

  describe('Interacción con pestañas', () => {
    test('cambia entre pestañas correctamente', async () => {
      render(<SaltoForm />)

      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      const tabInformacion = screen.getByRole('tab', { name: 'Información básica' })

      expect(tabInformacion).toHaveAttribute('aria-selected', 'true')
      expect(tabInformacion).toHaveAttribute('data-state', 'active')
      expect(tabCaracteristicas).toHaveAttribute('aria-selected', 'false')
      expect(tabCaracteristicas).toHaveAttribute('data-state', 'inactive')

      fireEvent.keyDown(tabCaracteristicas, {key: 'Enter', code: 'Enter', charCode: 13, bubbles: true})

      await waitFor(() => {
        expect(tabCaracteristicas).toHaveAttribute('aria-selected', 'true')
        expect(tabCaracteristicas).toHaveAttribute('data-state', 'active')
        expect(tabInformacion).toHaveAttribute('aria-selected', 'false')
        expect(tabInformacion).toHaveAttribute('data-state', 'inactive')
      })
      
      expect(screen.getByLabelText('Nivel de dificultad del acceso')).toBeInTheDocument()
    })

    test('muestra opciones de infraestructura en la pestaña características', async () => {
      render(<SaltoForm />)
      
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      fireEvent.keyDown(tabCaracteristicas, {key: 'Enter', code: 'Enter', charCode: 13, bubbles: true})
      
      expect(screen.getByText('Baños')).toBeInTheDocument()
      expect(screen.getByText('Estacionamiento')).toBeInTheDocument()
      expect(screen.getByText('Áreas de camping')).toBeInTheDocument()
    })
  })

  describe('Selección de infraestructura', () => {
    test('permite seleccionar y deseleccionar opciones de infraestructura', async () => {
      const user = userEvent.setup()
      render(<SaltoForm />)
      
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      await user.click(tabCaracteristicas)
      
      const bañosCheckbox = screen.getByRole('checkbox', { name: 'Baños' })
      await user.click(bañosCheckbox)
      expect(bañosCheckbox).toBeChecked()
      
      await user.click(bañosCheckbox)
      expect(bañosCheckbox).not.toBeChecked()
    })

    test('carga correctamente las opciones de infraestructura desde datos iniciales', async () => {
      const user = userEvent.setup()
      render(<SaltoForm initialData={initialData} />)
      
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      await user.click(tabCaracteristicas)
      
      const bañosCheckbox = screen.getByRole('checkbox', { name: 'Baños' })
      const estacionamientoCheckbox = screen.getByRole('checkbox', { name: 'Estacionamiento' })
      
      expect(bañosCheckbox).toBeChecked()
      expect(estacionamientoCheckbox).toBeChecked()
    })
  })

  describe('Envío del formulario', () => {
    test('envía datos correctamente para crear nuevo salto', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      } as Response)

      render(<SaltoForm />)
      
      await user.type(screen.getByLabelText('Nombre del destino'), validFormData.nombre)
      await user.type(screen.getByRole('textbox', { name: 'Coordenadas' }), validFormData.ubicacion)
      await user.type(screen.getByLabelText('Link a Google Maps'), validFormData.url_mapa)
      await user.clear(screen.getByLabelText('Costo (ARS)'))
      await user.type(screen.getByLabelText('Costo (ARS)'), validFormData.costo_entrada.toString())
      await user.type(screen.getByLabelText('Descripción del salto'), validFormData.descripcion)
      
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      await user.click(tabCaracteristicas)
      
      await user.type(screen.getByLabelText('Flora y fauna'), validFormData.biodiversidad)
      
      await user.click(screen.getByLabelText('Baños'))
      await user.click(screen.getByLabelText('Estacionamiento'))
      await user.click(screen.getByLabelText('Áreas de camping'))
      await user.click(screen.getByLabelText('Guías turísticos'))
      await user.click(screen.getByLabelText('Senderos señalizados'))
      await user.click(screen.getByLabelText('Miradores'))

      const submitButton = screen.getByRole('button', { name: 'Crear' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/destinos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: validFormData.nombre,
            descripcion: validFormData.descripcion,
            ubicacion: validFormData.ubicacion,
            url_mapa: validFormData.url_mapa,
            costo_entrada: validFormData.costo_entrada,
            infraestructura: validFormData.infraestructura,
            biodiversidad: validFormData.biodiversidad,
            dificultad: validFormData.dificultad,
          }),
        })
      })
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/saltos')
      expect(mockRouter.refresh).toHaveBeenCalled()
    })

    test('envía datos correctamente para actualizar salto existente', async () => {
      const user = userEvent.setup()
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      } as Response)

      render(<SaltoForm initialData={initialData} />)
      
      const submitButton = screen.getByRole('button', { name: 'Actualizar' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/destinos/1', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...validFormData,
            nombre: validFormData.nombre,
          }),
        })
      })
    })

    test('maneja errores de la API correctamente', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response)

      render(<SaltoForm />)
      
      await user.type(screen.getByLabelText('Nombre del destino'), 'Test')
      await user.type(screen.getByLabelText('Coordenadas'), '-27.0875, -54.4444')
      await user.type(screen.getByLabelText('Link a Google Maps'), 'https://maps.google.com')
      await user.type(screen.getByLabelText('Descripción del salto'), 'Descripción de prueba')
      
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      await user.click(tabCaracteristicas)
      await user.type(screen.getByLabelText('Flora y fauna'), 'Flora y fauna de prueba')
      
      const submitButton = screen.getByRole('button', { name: 'Crear' })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error al crear el salto:',
          expect.any(Error)
        )
      })
      
      consoleSpy.mockRestore()
    })

    test('deshabilita el botón durante el envío', async () => {
      const user = userEvent.setup()
      
      ;(global.fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ id: 1 }),
        } as Response), 100))
      )

      render(<SaltoForm initialData={initialData} />)
      
      const submitButton = screen.getByRole('button', { name: 'Actualizar' })
      await user.click(submitButton)
      
      expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalled()
      })
    })
  })

  describe('Navegación', () => {
    test('cancela y navega de vuelta al dashboard', async () => {
      const user = userEvent.setup()
      render(<SaltoForm />)
      
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      await user.click(cancelButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/saltos')
    })
  })

  describe('Selector de dificultad', () => {
    test('permite seleccionar nivel de dificultad', async () => {
      const user = userEvent.setup()
      render(<SaltoForm />)
      
      const tabCaracteristicas = screen.getByRole('tab', { name: 'Características' })
      fireEvent.keyDown(tabCaracteristicas, {key: 'Enter', code: 'Enter', charCode: 13, bubbles: true})
      
      const selectTrigger = screen.getByRole('combobox')
      fireEvent.click(selectTrigger)
      
      const altaOption = screen.getByRole('option', { name: 'Alta - Requiere buena condición física' });

      await user.click(altaOption)
      
      expect(selectTrigger).toHaveTextContent('Alta - Requiere buena condición física')
    })
  })
})