import { test, expect } from '@playwright/test'

test.describe('Página de Inicio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test.describe('Estructura y elementos básicos', () => {
    test('debe cargar correctamente con todos los elementos principales', async ({
      page,
    }) => {
      await expect(page.locator('h1')).toContainText('EXPLORA LOS SALTOS Y')
      await expect(page.locator('h1')).toContainText('CASCADAS DE MISIONES')

      await expect(page.locator('img[alt="Logo"]')).toBeVisible()

      await expect(
        page.locator('input[placeholder="Buscar salto"]'),
      ).toBeVisible()

      await expect(
        page
          .locator('section')
          .filter({ hasText: 'EXPLORA LOS SALTOS YCASCADAS' })
          .getByRole('button'),
      ).toBeVisible()

      await expect(page.locator('h2')).toContainText('Saltos destacados')

      await expect(
        page.getByRole('button', { name: 'Ver Todos los Saltos' }),
      ).toBeVisible()
    })

    test('debe tener el gradiente de fondo correcto', async ({ page }) => {
      const mainContainer = page.locator('div.min-h-screen.bg-gradient-to-b')
      await expect(mainContainer).toBeVisible()

      const heroSection = page.locator('section.bg-gradient-to-r.from-teal-400')
      await expect(heroSection).toBeVisible()
    })
  })

  test.describe('Funcionalidad de búsqueda', () => {
    test('debe permitir escribir en el campo de búsqueda', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="Buscar salto"]')
      await searchInput.fill('Iguazú')
      await expect(searchInput).toHaveValue('Iguazú')
    })

    test('debe navegar a la página de saltos con término de búsqueda al hacer clic en el botón', async ({
      page,
    }) => {
      const searchInput = page.getByRole('textbox', { name: 'Buscar salto' })
      const searchButton = page
        .locator('section')
        .filter({ hasText: 'EXPLORA LOS SALTOS YCASCADAS' })
        .getByRole('button')

      await searchInput.fill('Mocona')
      await expect(searchInput).toHaveValue('Mocona')

      await searchButton.click()

      await expect(page).toHaveURL('/saltos?search=Mocona')
    })

    test('debe manejar espacios en blanco en la búsqueda', async ({ page }) => {
      const searchInput = page.locator('input[placeholder="Buscar salto"]')
      const searchButton = page
        .locator('section')
        .filter({ hasText: 'EXPLORA LOS SALTOS YCASCADAS' })
        .getByRole('button')

      await searchInput.fill('   ')
      await searchButton.click()

      await expect(page).toHaveURL('/saltos')
    })

    test('debe trimear espacios en los términos de búsqueda', async ({
      page,
    }) => {
      const searchInput = page.getByRole('textbox', { name: 'Buscar salto' })

      await searchInput.fill('  Iguazú  ')
      await searchInput.press('Enter')

      await expect(page).toHaveURL('/saltos?search=Iguaz%C3%BA')
    })
  })

  test.describe('Saltos destacados', () => {
    test('debe cargar y mostrar saltos destacados', async ({ page }) => {
      await page.waitForFunction(
        () => {
          const cards = document.querySelectorAll(
            '[data-testid="salto-card"], .grid .cursor-pointer',
          )
          return cards.length > 0
        },
        { timeout: 10000 },
      )

      const saltoCards = page.locator('.grid .cursor-pointer')
      await expect(saltoCards.first()).toBeVisible()
    })

    test('debe mostrar información básica de cada salto destacado', async ({
      page,
    }) => {
      await page.waitForLoadState('networkidle')

      const firstCard = page.locator('.grid .cursor-pointer').first()
      await expect(firstCard).toBeVisible()

      await expect(firstCard.locator('img')).toBeVisible()

      await expect(firstCard.locator('h3')).toBeVisible()

      await expect(firstCard.locator('svg.lucide-map-pin')).toBeVisible()
    })

    test('debe navegar al detalle del salto al hacer clic en una card', async ({
      page,
    }) => {
      await page.waitForLoadState('networkidle')

      const firstCard = page
        .locator('section', { hasText: 'Saltos destacados' })
        .getByRole('link')
        .filter({ hasNotText: 'Ver todos los saltos' })
        .first()

      await expect(firstCard).toBeVisible()

      await firstCard.click()

      await expect(page).toHaveURL(/\/salto\/\d+/)
    })

    test('debe mostrar efecto hover en las cards', async ({ page }) => {
      await page.waitForLoadState('networkidle')

      const firstCard = page.locator('.grid .cursor-pointer').first()
      await expect(firstCard).toBeVisible()

      await firstCard.hover()

      const boxShadow = await firstCard.evaluate(
        (el) => window.getComputedStyle(el).boxShadow,
      )

      expect(boxShadow).not.toBe('none')
    })
  })

  test.describe('Navegación y enlaces', () => {
    test('debe navegar a la página de todos los saltos', async ({ page }) => {
      const verTodosButton = page
        .locator('section')
        .filter({ hasText: 'Ver Todos los Saltos' })
        .getByRole('button')
      await verTodosButton.click()

      await expect(page).toHaveURL('/saltos')
    })

    test('debe tener navegación y footer visibles', async ({ page }) => {
      await expect(page.locator('nav, [role="navigation"]')).toBeVisible()

      await expect(page.locator('footer, [role="contentinfo"]')).toBeVisible()
    })
  })
})
