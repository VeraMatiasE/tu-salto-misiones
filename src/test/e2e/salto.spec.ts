import { test, expect } from '@playwright/test'

// Mock data for testing
const mockSaltoData = {
  id_destino: 1,
  nombre: 'Salto del Mocona',
  descripcion: 'Un hermoso salto de agua en la provincia de Misiones',
  ubicacion: 'El Soberbio, Misiones',
  dificultad: 'media',
  costo_entrada: 2000,
  biodiversidad:
    'Rica biodiversidad con especies nativas de la selva misionera',
  infraestructura: '["baños","estacionamiento","senderos"]',
  url_mapa: 'https://maps.google.com/embed?pb=...',
}

const mockComentarios = [
  {
    id_comentario: 1,
    id_usuario: 1,
    usuarios: {
      foto_perfil: 'test',
      nombre: 'Juan Pérez',
    },
    comentario: 'Excelente lugar para visitar en familia',
    calificacion: 5,
    fecha_comentario: '2024-06-01T10:00:00Z',
  },
  {
    id_comentario: 2,
    id_usuario: 2,
    usuarios: {
      foto_perfil: 'test',
      nombre: 'María González',
    },
    comentario: 'Muy lindo pero el acceso es un poco difícil',
    calificacion: 4,
    fecha_comentario: '2024-06-02T15:30:00Z',
  },
]

const mockUserProfile = {
  id_usuario: 1,
  nombre: 'Usuario Test',
  email: 'test@example.com',
}

test.describe('Página de Detalle del Salto', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        json: { data: mockSaltoData },
      })
    })

    await page.route('/api/destinos/1/portada', async (route) => {
      await route.fulfill({
        json: {
          data: {
            public_id: 'test-salto-1',
          },
        },
      })
    })

    await page.route('/api/destinos/1/calificacion', async (route) => {
      await route.fulfill({
        json: { data: { promedio: 4.5 } },
      })
    })

    await page.route('/api/destinos/1/comentarios', async (route) => {
      await route.fulfill({
        json: { data: { data: mockComentarios } },
      })
    })

    await page.route('/api/usuarios/favoritos/1', async (route) => {
      await route.fulfill({
        json: { isFavorite: false },
      })
    })
  })

  test('debe mostrar información básica del salto', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar que se muestra el nombre del salto
    await expect(page.locator('h1')).toContainText('Salto del Mocona')

    // Verificar que se muestra la calificación
    await expect(page.locator('text=4.5')).toBeVisible()

    // Verificar que se muestra la descripción
    await expect(page.locator('text=Un hermoso salto de agua')).toBeVisible()

    // Verificar que se muestra la ubicación
    await expect(page.locator('text=El Soberbio, Misiones')).toBeVisible()

    // Verificar que se muestra el costo
    await expect(page.locator('text=$2.000')).toBeVisible()

    // Verificar que se muestra la dificultad
    await expect(page.locator('text=media')).toBeVisible()
  })

  test('debe mostrar la imagen del salto', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar que la imagen se carga
    const image = page.locator('img[alt="Salto del Mocona"]')
    await expect(image).toBeVisible()
  })

  test('debe mostrar las actividades disponibles', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar actividades disponibles (según mock data: baños, estacionamiento, senderos)
    await expect(page.locator('text=Baños')).toBeVisible()
    await expect(page.locator('text=Estacionamiento')).toBeVisible()
    await expect(page.locator('text=Senderos señalizados')).toBeVisible()

    // Verificar que las actividades disponibles tienen el check verde
    const bañosRow = page.locator('text=Baños').locator('..')
    await expect(bañosRow.locator('.bg-green-500')).toBeVisible()

    // Verificar que las actividades no disponibles tienen la X roja
    const campingRow = page.locator('text=Áreas de camping').locator('..')
    await expect(campingRow.locator('.text-red-500')).toBeVisible()
  })

  test('debe mostrar biodiversidad', async ({ page }) => {
    await page.goto('/salto/1')

    await expect(
      page.locator('text=Rica biodiversidad con especies nativas'),
    ).toBeVisible()
  })

  test('debe mostrar mapa', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar que el componente de mapa está presente
    await expect(page.locator('text=Ubicación').nth(1)).toBeVisible()
  })

  test('debe mostrar lista de comentarios', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar título de comentarios
    await expect(page.locator('text=Comentarios (2)')).toBeVisible()

    // Verificar que se muestran los comentarios
    await expect(page.locator('text=Juan Pérez')).toBeVisible()
    await expect(
      page.locator('text=Excelente lugar para visitar'),
    ).toBeVisible()
    await expect(page.locator('text=María González')).toBeVisible()
    await expect(page.locator('text=Muy lindo pero el acceso')).toBeVisible()
  })

  test('debe navegar a la galería', async ({ page }) => {
    await page.goto('/salto/1')

    // Click en botón de galería
    await page.click('text=Ir a Galería')

    // Verificar navegación
    await expect(page).toHaveURL('/salto/1/gallery')
  })

  test('debe mostrar estado de carga', async ({ page }) => {
    // Simular carga lenta
    await page.route('/api/destinos/1', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        json: { data: mockSaltoData },
      })
    })

    await page.goto('/salto/1')

    // Verificar mensaje de carga
    await expect(page.locator('text=Cargando salto...')).toBeVisible()
  })

  test('debe manejar errores de carga', async ({ page }) => {
    // Mock error response
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        status: 404,
        json: { error: 'Salto no encontrado' },
      })
    })

    await page.goto('/salto/1')

    // Verificar mensaje de error
    await expect(page.locator('text=Error al cargar el salto')).toBeVisible()
    await expect(page.locator('text=Intentar nuevamente')).toBeVisible()
  })

  test('debe funcionar el botón de reintentar', async ({ page }) => {
    // Mock initial error
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        status: 500,
        json: { error: 'Error del servidor' },
      })
    })

    await page.goto('/salto/1')

    // Verificar error inicial
    await expect(page.locator('text=Error al cargar el salto')).toBeVisible()

    // Mock successful retry
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        json: { data: mockSaltoData },
      })
    })

    // Click en reintentar
    await page.click('text=Intentar nuevamente')

    // Verificar que se carga correctamente
    await expect(page.locator('h1')).toContainText('Salto del Mocona')
  })
})

test.describe('Funcionalidad de Favoritos', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.route('/api/auth/user', async (route) => {
      await route.fulfill({
        json: { profile: mockUserProfile },
      })
    })

    // Mock other required APIs
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        json: { data: mockSaltoData },
      })
    })

    await page.route('/api/destinos/1/portada', async (route) => {
      await route.fulfill({
        json: { data: { public_id: 'saltos/mocona_portada' } },
      })
    })

    await page.route('/api/destinos/1/calificacion', async (route) => {
      await route.fulfill({
        json: { data: { promedio: 4.5 } },
      })
    })

    await page.route('/api/destinos/1/comentarios', async (route) => {
      await route.fulfill({
        json: { data: { data: [] } },
      })
    })

    await page.route('/api/usuarios/favoritos/1', async (route) => {
      await route.fulfill({
        json: { isFavorite: false },
      })
    })

    // Mock context to simulate authenticated user
    await page.addInitScript(() => {
      window.localStorage.setItem('isAuthenticated', 'true')
    })
  })

  test('debe agregar a favoritos', async ({ page }) => {
    let favoriteToggled = false

    await page.route('/api/usuarios/favoritos', async (route) => {
      favoriteToggled = true
      await route.fulfill({
        json: { estatus: true },
      })
    })

    await page.goto('/salto/1')

    // Click en corazón para agregar a favoritos
    const heartIcon = page.locator('svg[class*="text-gray-400"]').first()
    await heartIcon.click()

    // Verificar que se hizo la petición
    await page.waitForTimeout(500)
    expect(favoriteToggled).toBe(true)
  })

  test('debe quitar de favoritos', async ({ page }) => {
    // Mock como favorito inicialmente
    await page.route('/api/usuarios/favoritos/1', async (route) => {
      await route.fulfill({
        json: { isFavorite: true },
      })
    })

    let favoriteToggled = false

    await page.route('/api/usuarios/favoritos', async (route) => {
      favoriteToggled = true
      await route.fulfill({
        json: { estatus: false },
      })
    })

    await page.goto('/salto/1')

    // Click en corazón para quitar de favoritos
    const heartIcon = page.locator('svg[class*="text-red-500"]').first()
    await heartIcon.click()

    // Verificar que se hizo la petición
    await page.waitForTimeout(500)
    expect(favoriteToggled).toBe(true)
  })
})

test.describe('Navegación', () => {
  test.beforeEach(async ({ page }) => {
    // Mock basic data
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        json: { data: mockSaltoData },
      })
    })

    await page.route('/api/destinos/1/portada', async (route) => {
      await route.fulfill({
        json: { data: { public_id: 'saltos/mocona_portada' } },
      })
    })

    await page.route('/api/destinos/1/calificacion', async (route) => {
      await route.fulfill({
        json: { data: { promedio: 4.5 } },
      })
    })

    await page.route('/api/destinos/1/comentarios', async (route) => {
      await route.fulfill({
        json: { data: { data: [] } },
      })
    })

    await page.route('/api/usuarios/favoritos/1', async (route) => {
      await route.fulfill({
        json: { isFavorite: false },
      })
    })
  })

  test('debe funcionar el botón de retroceso', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar que el componente de navegación está presente
    await expect(page.locator('nav')).toBeVisible()
  })

  test('debe mostrar footer', async ({ page }) => {
    await page.goto('/salto/1')

    // Verificar que el footer está presente
    await expect(page.locator('footer')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Mock basic data
    await page.route('/api/destinos/1', async (route) => {
      await route.fulfill({
        json: { data: mockSaltoData },
      })
    })

    await page.route('/api/destinos/1/portada', async (route) => {
      await route.fulfill({
        json: { data: { public_id: 'saltos/mocona_portada' } },
      })
    })

    await page.route('/api/destinos/1/calificacion', async (route) => {
      await route.fulfill({
        json: { data: { promedio: 4.5 } },
      })
    })

    await page.route('/api/destinos/1/comentarios', async (route) => {
      await route.fulfill({
        json: { data: { data: [] } },
      })
    })

    await page.route('/api/usuarios/favoritos/1', async (route) => {
      await route.fulfill({
        json: { isFavorite: false },
      })
    })
  })

  test('debe verse bien en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/salto/1')

    // Verificar que el contenido se adapta a móvil
    await expect(page.locator('h1')).toContainText('Salto del Mocona')

    // Verificar que la imagen se ve correctamente
    const image = page.locator('img[alt="Salto del Mocona"]')
    await expect(image).toBeVisible()
  })

  test('debe verse bien en tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/salto/1')

    await expect(page.locator('h1')).toContainText('Salto del Mocona')
  })

  test('debe verse bien en desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/salto/1')

    await expect(page.locator('h1')).toContainText('Salto del Mocona')
  })
})
