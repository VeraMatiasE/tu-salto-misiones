import { test, expect } from '@playwright/test'

const mockSaltos = [
  {
    id_destino: 1,
    nombre: 'Salto El Paraíso',
    descripcion: 'Un hermoso salto ubicado en el corazón de la selva misionera',
    ubicacion: 'Puerto Iguazú',
    dificultad: 'media',
    puntuacion: 4.5,
    infraestructura: ['estacionamiento', 'senderos', 'baños'],
    public_id: 'test-salto-1',
  },
  {
    id_destino: 2,
    nombre: 'Cascada Azul',
    descripcion: 'Una cascada cristalina perfecta para refrescarse',
    ubicacion: 'Eldorado',
    dificultad: 'baja',
    puntuacion: 4.2,
    infraestructura: ['estacionamiento', 'parrillas'],
    public_id: 'test-salto-1',
  },
]

const mockFilterOptions = {
  ubicaciones: ['Puerto Iguazú', 'Eldorado', 'Posadas'],
  dificultades: ['baja', 'media', 'alta', 'extrema'],
  servicios: ['estacionamiento', 'senderos', 'baños', 'parrillas', 'camping'],
}

test.describe('Saltos Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('/api/destinos/filter-options', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFilterOptions),
      })
    })

    await page.route('/api/destinos**', async (route) => {
      const url = new URL(route.request().url())
      const searchParams = url.searchParams

      let filteredSaltos = [...mockSaltos]

      // Apply search filter
      const search = searchParams.get('search')
      if (search) {
        filteredSaltos = filteredSaltos.filter(
          (salto) =>
            salto.nombre.toLowerCase().includes(search.toLowerCase())
            || salto.ubicacion.toLowerCase().includes(search.toLowerCase()),
        )
      }

      // Apply location filter
      const ubicaciones = searchParams.get('ubicaciones')
      if (ubicaciones) {
        const ubicacionesArray = ubicaciones.split(',')
        filteredSaltos = filteredSaltos.filter((salto) =>
          ubicacionesArray.includes(salto.ubicacion),
        )
      }

      // Apply difficulty filter
      const dificultades = searchParams.get('dificultades')
      if (dificultades) {
        const dificultadesArray = dificultades.split(',')
        filteredSaltos = filteredSaltos.filter((salto) =>
          dificultadesArray.includes(salto.dificultad),
        )
      }

      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '12')
      const total = filteredSaltos.length
      const totalPages = Math.ceil(total / limit)

      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedData = filteredSaltos.slice(startIndex, endIndex)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            data: paginatedData,
            pagination: {
              currentPage: page,
              limit,
              total,
              totalPages,
            },
          },
        }),
      })
    })

    await page.goto('/saltos')
  })

  test('should display the page title and search interface', async ({
    page,
  }) => {
    await expect(page.locator('h1')).toContainText('EXPLORA LOS SALTOS Y')
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()
    await expect(page.locator('button:has-text("Filtros")')).toBeVisible()
  })

  test('should load and display saltos', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Check if saltos are displayed
    await expect(page.locator('.flex.flex-col.md\\:flex-row')).toHaveCount(2)
    await expect(page.locator('text=Salto El Paraíso')).toBeVisible()
    await expect(page.locator('text=Cascada Azul')).toBeVisible()
  })

  test('should show results count', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=2 resultados encontrados')).toBeVisible()
  })

  test('should search for saltos', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]')

    await searchInput.fill('Paraíso')
    await page.waitForTimeout(500) // Wait for debounce
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Salto El Paraíso')).toBeVisible()
    await expect(page.locator('text=Cascada Azul')).not.toBeVisible()
    await expect(page.locator('text=1 resultado encontrado')).toBeVisible()
  })

  test('should clear search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]')

    await searchInput.fill('Paraíso')
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    await searchInput.clear()
    await page.waitForTimeout(500)
    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=2 resultados encontrados')).toBeVisible()
  })

  test('should open and close filters panel', async ({ page }) => {
    const filtersButton = page.locator('button:has-text("Filtros")')

    await filtersButton.click()
    await expect(page.getByRole('heading', { name: 'Ubicación' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Dificultad' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Puntuación' }),
    ).toBeVisible()

    await filtersButton.click()
    await expect(
      page.getByRole('heading', { name: 'Ubicación' }),
    ).not.toBeVisible()
  })

  test('should filter by location', async ({ page }) => {
    await page.locator('button:has-text("Filtros")').click()

    const puertoIguazuCheckbox = page.getByRole('checkbox', {
      name: 'Puerto Iguazú',
    })
    await puertoIguazuCheckbox.check()

    await page.waitForLoadState('networkidle')

    await expect(
      page.locator('section').filter({ hasText: 'Salto El ParaísoUn hermoso' }),
    ).toBeVisible()
    await expect(
      page.locator('section').filter({ hasText: 'Cascada Azul' }),
    ).not.toBeVisible()
    await expect(page.locator('text=1 resultado encontrado')).toBeVisible()

    // Check active filter badge
    await expect(
      page.locator('label').filter({ hasText: 'Puerto Iguazú' }),
    ).toBeVisible()
  })

  test('should filter by difficulty', async ({ page }) => {
    await page.locator('button:has-text("Filtros")').click()

    const bajaCheckbox = page.getByRole('checkbox', { name: 'baja' })
    await bajaCheckbox.check()

    await page.waitForLoadState('networkidle')

    await expect(page.locator('text=Cascada Azul')).toBeVisible()
    await expect(page.locator('text=Salto El Paraíso')).not.toBeVisible()
  })

  test('should adjust rating filter', async ({ page }) => {
    await page.locator('button:has-text("Filtros")').click()

    // Find the rating slider and adjust it
    const slider = page.locator('[role="slider"]').first()
    await slider.focus()

    // Simulate keyboard interaction to adjust minimum rating
    await slider.press('ArrowRight')
    await slider.press('ArrowRight')

    await page.waitForLoadState('networkidle')

    // The rating display should update
    const ratingDisplay = page.getByRole('heading', { name: 'Puntuación' })
    await expect(ratingDisplay).toBeVisible()
  })

  test('should clear all filters', async ({ page }) => {
    await page.locator('button:has-text("Filtros")').click()

    // Apply a filter
    const puertoIguazuCheckbox = page.getByRole('checkbox', {
      name: 'Puerto Iguazú',
    })
    await puertoIguazuCheckbox.check()

    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=1 resultado encontrado')).toBeVisible()

    // Clear filters
    await page.locator('button:has-text("Limpiar filtros")').click()

    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=2 resultados encontrados')).toBeVisible()
  })

  test('should sort saltos', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const sortSelect = page.locator(
      '[role="combobox"]:has-text("Nombre A - Z")',
    )
    await sortSelect.click()

    await page
      .locator('[role="option"]:has-text("Puntuación más alta")')
      .click()

    await page.waitForLoadState('networkidle')

    const firstSalto = page.locator('.hover\\:shadow-lg').first()
    await expect(firstSalto.locator('text=Salto El Paraíso')).toBeVisible()
  })

  test('should navigate to salto detail page', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    const verMasButton = page.locator('button:has-text("Ver Más")').first()
    await verMasButton.click()

    await expect(page).toHaveURL('/salto/1')
  })

  test('should handle loading states', async ({ page }) => {
    // Create a slow response to test loading state
    await page.route('/api/destinos**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            data: mockSaltos,
            pagination: {
              currentPage: 1,
              limit: 12,
              total: 2,
              totalPages: 1,
            },
          },
        }),
      })
    })

    await page.goto('/saltos')

    // Should show loading state
    await expect(page.getByText('Cargando saltos...')).toBeVisible()

    // Wait for content to load
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Salto El Paraíso')).toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    await page.route('/api/destinos**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.waitForLoadState('networkidle')
    await page.goto('/saltos')

    await expect(page.locator('text=Error:')).toBeVisible()
    await expect(page.locator('button:has-text("Reintentar")')).toBeVisible()
  })

  test('should handle empty results', async ({ page }) => {
    await page.route('/api/destinos**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            data: [],
            pagination: {
              currentPage: 1,
              limit: 12,
              total: 0,
              totalPages: 0,
            },
          },
        }),
      })
    })

    await page.waitForLoadState('networkidle')
    page.goto('/saltos')

    await expect(page.getByText('No encontramos saltos')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Limpiar todos los filtros' }),
    ).toBeVisible()
  })

  test('should update URL with search parameters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]')

    await searchInput.fill('Paraíso')
    await page.waitForTimeout(500)

    await expect(page).toHaveURL('/saltos?search=Para%C3%ADso')
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()
  })
})
