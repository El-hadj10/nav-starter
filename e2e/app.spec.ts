import { expect, test } from '@playwright/test'

test('renders app shell, map canvas and language toggle', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('map-canvas')).toBeVisible()
  await expect(page.getByTestId('locale-toggle')).toBeVisible()

  const loginButton = page.getByRole('button', { name: /Login|Se connecter/i })
  await expect(loginButton).toBeVisible()
})

test('switches locale label on toggle click', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByTestId('locale-toggle')
  const initial = await toggle.textContent()
  await toggle.click()
  await expect(toggle).not.toHaveText(initial || '')
})
