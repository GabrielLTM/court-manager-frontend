import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const directory = 'docs/images/angular';
mkdirSync(directory, { recursive: true });
async function capture(name) {
  await expect(page.locator('main')).toBeVisible();
  await page.screenshot({ path: `${directory}/${name}.png`, fullPage: true });
}
await page.goto('http://127.0.0.1:5174/login');
await page.getByRole('button', { name: 'Cliente', exact: true }).waitFor();
await capture('login');
await page.setViewportSize({ width: 375, height: 812 });
await capture('mobile-login');
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole('button', { name: 'Cliente', exact: true }).click();
await expect(page.getByLabel('E-mail')).toHaveValue('isadora@email.com');
await page.getByRole('button', { name: 'Entrar', exact: true }).click();
await expect(page).toHaveURL(/reservar$/);
await expect(page.locator('.slots button').first()).toBeVisible();
await capture('reservar');
await page.setViewportSize({ width: 375, height: 812 });
await capture('mobile-reservar');
await page.setViewportSize({ width: 1440, height: 1000 });
await page.getByRole('link', { name: 'Minhas reservas', exact: true }).click();
await expect(page.getByRole('table')).toContainText('RSV-');
await capture('minhas-reservas');
await page.getByRole('link', { name: 'Meus dados', exact: true }).click();
await expect(page.getByLabel('Nome completo')).toHaveValue('Isadora Oliveira');
await capture('meus-dados');
await page.getByRole('button', { name: 'Admin', exact: true }).click();
await expect(page.getByRole('heading', { name: 'Ocupação por quadra' })).toBeVisible();
await capture('admin-dashboard');
for (const [label, name] of [
  ['Grade de reservas', 'admin-grade'],
  ['Quadras', 'admin-quadras'],
  ['Clientes', 'admin-clientes'],
  ['Pagamentos', 'admin-pagamentos'],
]) {
  await page.getByRole('link', { name: label, exact: true }).click();
  await expect(page.getByRole('heading', { name: label, exact: true })).toBeVisible();
  if (name === 'admin-quadras')
    await expect(page.getByRole('heading', { name: 'Quadra 01', exact: true })).toBeVisible();
  else
    await expect(page.getByRole('table')).toContainText(
      name === 'admin-grade' ? 'Quadra 01' : name === 'admin-clientes' ? 'Isadora' : 'RSV-',
    );
  await capture(name);
}
await browser.close();
