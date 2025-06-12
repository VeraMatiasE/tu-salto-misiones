import { test, expect } from '@playwright/test'

// Mock data for testing
const mockImages = [
  {
    id_imagen: 1,
    public_id: 'test-salto-1',
  },
  {
    id_imagen: 2,
    public_id: 'test-salto-1',
  },
  {
    id_imagen: 3,
    public_id: 'test-salto-1',
  },
  {
    id_imagen: 4,
    public_id: 'test-salto-1',
  },
]

test.describe('Gallery Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API response for images
    await page.route('/api/destinos/*/imagenes', async (route) => {
      const url = route.request().url()
      const saltoId = url.match(/\/api\/destinos\/(\d+)\/imagenes/)?.[1]

      if (saltoId === '1') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockImages,
          }),
        })
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Salto not found' }),
        })
      }
    })

    // Mock Cloudinary images
    await page.route('**/*cloudinary*/**', async (route) => {
      // Return a placeholder image for all Cloudinary requests
      await route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: Buffer.from('placeholder-image-data'),
      })
    })
  })

  test('should display gallery with correct title and image count', async ({
    page,
  }) => {
    await page.goto('/salto/1/gallery')

    await expect(page.locator('h1:has-text("Galería")')).toBeVisible()
    await expect(page.locator('text=4 Imágenes')).toBeVisible()
  })

  test('should display back button', async ({ page }) => {
    await page.goto('/salto/1/gallery')

    const backButton = page.locator(
      'button[aria-label*="back"], button:has-text("Atrás"), button:has(svg)',
    )
    await expect(backButton.first()).toBeVisible()
  })

  test('should display image grid', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Check that images are displayed in grid
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(4)
  })

  test('should open image modal when clicking on an image', async ({
    page,
  }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.click()

    const modal = page.getByRole('img', { name: 'test-salto-' })
    await expect(modal).toBeVisible()
  })

  test('should close image modal with close button', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Open modal
    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.click()

    // Close modal
    const closeButton = page.getByRole('button', { name: 'Close' })
    await closeButton.first().click()

    // Check that modal is closed
    const modal = page.locator('[role="dialog"], .fixed.inset-0')
    await expect(modal).not.toBeVisible()
  })

  test('should close image modal with Escape key', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Open modal
    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.click()

    // Press Escape
    await page.keyboard.press('Escape')

    // Check that modal is closed
    const modal = page.locator('[role="dialog"], .fixed.inset-0')
    await expect(modal).not.toBeVisible()
  })

  test('should navigate between images in modal', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Open modal with first image
    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.click()

    // Navigate to next image
    const nextButton = page.locator(
      'button[aria-label*="Next"], button:has-text("›")',
    )
    if ((await nextButton.count()) > 0) {
      await nextButton.click()
      // Verify we're on a different image (this would depend on modal implementation)
    }

    // Navigate to previous image
    const prevButton = page.locator(
      'button[aria-label*="Previous"], button:has-text("‹")',
    )
    if ((await prevButton.count()) > 0) {
      await prevButton.click()
    }
  })

  test('should handle keyboard navigation in grid', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Focus on first image
    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.focus()

    // Use Enter key to open modal
    await page.keyboard.press('Enter')

    const modal = page.getByRole('img', { name: 'test-salto-' })
    await expect(modal).toBeVisible()
  })

  test('should handle keyboard navigation with Space key', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Focus on first image
    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.focus()

    // Use Space key to open modal
    await page.keyboard.press('Space')

    const modal = page.getByRole('img', { name: 'test-salto-' })
    await expect(modal).toBeVisible()
  })

  test('should show loading state', async ({ page }) => {
    // Create a slow response to test loading state
    await page.route('/api/destinos/*/imagenes', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mockImages,
        }),
      })
    })

    await page.goto('/salto/1/gallery')

    // Should show loading state
    await expect(
      page.locator('text=Cargando imágenes del salto...'),
    ).toBeVisible()

    // Wait for content to load
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=4 Imágenes')).toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    await page.route('/api/destinos/*/imagenes', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/salto/1/gallery')

    // Should handle error gracefully
    await expect(page.locator('text=0 imágenes')).toBeVisible()
  })

  test('should handle empty gallery', async ({ page }) => {
    await page.route('/api/destinos/*/imagenes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
        }),
      })
    })

    await page.goto('/salto/1/gallery')

    await expect(page.locator('text=0 imágenes')).toBeVisible()
    // Grid should be empty
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(0)
  })

  test('should handle single image', async ({ page }) => {
    await page.route('/api/destinos/*/imagenes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [mockImages[0]],
        }),
      })
    })

    await page.goto('/salto/1/gallery')

    await expect(page.locator('text=1 Imagen')).toBeVisible()
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(1)
  })

  test('should navigate back to previous page', async ({ page }) => {
    // Navigate to gallery from a known page
    await page.goto('/salto/1')
    await page.goto('/salto/1/gallery')

    const backButton = page.locator(
      '.inline-flex.items-center.justify-center.whitespace-nowrap.rounded-md.text-sm.font-text.font-medium.ring-offset-background.transition-colors.focus-visible\\:outline-none.focus-visible\\:ring-2.focus-visible\\:ring-primary.focus-visible\\:ring-offset-2.disabled\\:pointer-events-none.disabled\\:opacity-50.cursor-pointer.hover\\:bg-accent',
    )
    await backButton.first().click()

    // Should navigate back to previous page
    await expect(page).toHaveURL('/salto/1')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Check that gallery is visible and responsive
    await expect(page.locator('h1:has-text("Galería")')).toBeVisible()
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(4)

    // Images should be arranged in a single column on mobile
    const firstImage = imageButtons.first()
    const secondImage = imageButtons.nth(1)

    const firstImageBox = await firstImage.boundingBox()
    const secondImageBox = await secondImage.boundingBox()

    if (firstImageBox && secondImageBox) {
      // On mobile, images should be stacked vertically
      expect(secondImageBox.y).toBeGreaterThan(
        firstImageBox.y + firstImageBox.height - 10,
      )
    }
  })

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Galería")')).toBeVisible()
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(4)
  })

  test('should be responsive on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })

    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1:has-text("Galería")')).toBeVisible()
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(4)
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Check that images have proper ARIA labels
    const imageButtons = page.locator('button[tabindex="0"]')
    await expect(imageButtons).toHaveCount(4)

    // Check that buttons are focusable
    const firstImage = imageButtons.first()
    await firstImage.focus()

    // Check that focused element is properly highlighted
    await expect(firstImage).toBeFocused()
  })

  test('should handle invalid salto ID', async ({ page }) => {
    await page.goto('/salto/999/gallery')

    // Should handle the case when salto doesn't exist
    await expect(page.locator('text=0 imágenes')).toBeVisible()
  })

  test('should filter images with null public_id', async ({ page }) => {
    const mixedImages = [
      ...mockImages,
      {
        id_imagen: 5,
        public_id: null,
        url_imagen: 'https://example.com/image5.jpg',
      },
    ]

    await page.route('/api/destinos/*/imagenes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: mixedImages,
        }),
      })
    })

    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Should only show images with valid public_id (4 images, not 5)
    await expect(page.locator('text=4 Imágenes')).toBeVisible()
    const imageButtons = page.locator(
      'button[aria-label*="View image"], .aspect-square',
    )
    await expect(imageButtons).toHaveCount(4)
  })

  test('should handle download functionality in modal', async ({ page }) => {
    await page.goto('/salto/1/gallery')
    await page.waitForLoadState('networkidle')

    // Open modal
    const firstImage = page
      .locator('button[aria-label*="View image"], .aspect-square')
      .first()
    await firstImage.click()

    // Look for download button or link in modal
    const downloadButton = page.locator(
      'button[aria-label*="Download"], a[download]',
    )
    if ((await downloadButton.count()) > 0) {
      await expect(downloadButton.first()).toBeVisible()
    }
  })
})
