import { test, expect, type Page } from '@playwright/test';
const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(({ page }) => {
  expect(runtimeErrors.get(page)).toEqual([]);
});
async function login(page: Page, admin = false) {
  await page.goto('/login');
  await page
    .getByRole('button', { name: admin ? 'Administrador' : 'Cliente', exact: true })
    .click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(admin ? /admin\/dashboard$/ : /reservar$/);
}
async function tomorrow(page: Page) {
  return page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  });
}
async function book(page: Page, method = '1') {
  await page.getByLabel('Escolher outra data').fill(await tomorrow(page));
  await page.locator('.slots button:not([aria-disabled="true"])').first().click();
  await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
  await page
    .getByLabel('Método de pagamento')
    .selectOption({ label: method === '3' ? 'Dinheiro' : 'Pix' });
  await page.getByRole('button', { name: 'Confirmar e pagar' }).click();
  await expect(page).toHaveURL(/minhas-reservas$/);
}
test('client booking, payment and cancellation preserve the financial lifecycle', async ({
  page,
}) => {
  await login(page);
  await book(page);
  const row = page
    .getByRole('row')
    .filter({ has: page.getByText('RSV-', { exact: false }) })
    .filter({ has: page.getByRole('button', { name: 'Cancelar', exact: true }) })
    .first();
  await expect(row).toContainText('Pago');
  await row.getByRole('button', { name: 'Cancelar', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('estornado');
  await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page.getByRole('table')).toContainText('Estornado');
});
test('admin confirms cash, sees receipt, and changes a reservation from the grade', async ({
  page,
}) => {
  await login(page);
  await book(page, '3');
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard$/);
  await page.getByRole('link', { name: 'Pagamentos', exact: true }).click();
  await page.getByRole('button', { name: 'Pendentes', exact: true }).click();
  const row = page
    .getByRole('row')
    .filter({ has: page.getByText('Isadora', { exact: false }) })
    .first();
  await row.getByRole('button', { name: /Confirmar pagamento/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await page.getByRole('button', { name: 'Pagos', exact: true }).click();
  await page
    .getByRole('button', { name: /Recibo RSV/ })
    .first()
    .click();
  await expect(page.getByRole('dialog')).toContainText('Pago em');
  await page.getByRole('button', { name: 'Fechar', exact: true }).click();
  await page.getByRole('link', { name: 'Grade de reservas' }).click();
  await page.getByLabel('Data', { exact: true }).fill(await tomorrow(page));
  await page.locator('.grade-cell.reserved').first().click();
  await page.getByRole('button', { name: 'Alterar', exact: true }).click();
  await page.getByRole('button', { name: '1h30', exact: true }).click();
  await page.locator('.slots button:not([aria-disabled="true"])').first().click();
  await page.getByRole('button', { name: 'Salvar alteração', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Alterar reserva', exact: true })
    .getByRole('button', { name: 'Salvar alteração', exact: true })
    .click();
  await expect(page.locator('.summary').getByRole('alert')).toContainText('RN07');
  await page.getByRole('button', { name: '1h', exact: true }).click();
  await page.locator('.slots button:not([aria-disabled="true"])').nth(1).click();
  await page.getByRole('button', { name: 'Salvar alteração', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Alterar reserva', exact: true })
    .getByRole('button', { name: 'Salvar alteração', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('court and client CRUD, filters, empty states and status persist', async ({ page }) => {
  await login(page, true);
  await page.getByRole('link', { name: 'Quadras', exact: true }).click();
  await page.getByRole('button', { name: '+ Nova quadra' }).click();
  await page.getByLabel('Identificação').fill('Quadra Angular');
  await page.getByLabel('Tipo', { exact: true }).fill('Beach Tennis');
  await page.getByLabel('Valor por hora (R$)').fill('95,50');
  await page.getByRole('button', { name: 'Cadastrar quadra', exact: true }).click();
  const card = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Quadra Angular', exact: true }) });
  await expect(card).toContainText('95,50');
  await card.getByRole('button', { name: 'Manutenção', exact: true }).click();
  await expect(card.getByText('Manutenção', { exact: true })).toHaveCount(2);
  await card.getByRole('button', { name: 'Editar', exact: false }).click();
  await page.getByLabel('Identificação').fill('Quadra Angular Editada');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quadra Angular Editada' })).toBeVisible();
  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await page.getByLabel('Buscar clientes').fill('inexistente');
  await expect(page.getByRole('table')).toContainText('Nenhum cliente encontrado');
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await page.getByRole('button', { name: '+ Novo cliente' }).click();
  await page.getByLabel('Nome completo').fill('Cliente Angular');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByLabel('Data de nascimento').fill('1995-01-10');
  await page.getByLabel('Telefone').fill('11987654321');
  await page.getByLabel('E-mail').fill('angular@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('angular123');
  await page.getByRole('button', { name: 'Cadastrar cliente', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Buscar clientes').fill('Cliente Angular');
  const row = page.getByRole('row').filter({ hasText: 'angular@example.com' });
  await expect(row).toContainText('Ativo');
  await row.getByRole('button', { name: 'Inativar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(row).toContainText('Inativo');
  await row.getByRole('button', { name: 'Reativar', exact: true }).click();
  await expect(row).toContainText('Ativo');
});
test('guards, invalid login, keyboard, narrow layout and profile edits', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/admin/clientes');
  await expect(page).toHaveURL(/login\?from=/);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Informe o e-mail.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cliente', exact: true }).click();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/reservar$/);
  await page.goto('/admin/clientes');
  await expect(page).toHaveURL(/reservar$/);
  await page.getByRole('link', { name: 'Meus dados' }).click();
  await page.getByLabel('Nome completo').fill('Isadora Angular');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.locator('.shell-header')).toContainText('Isadora Angular');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByLabel('Nome completo').fill('Não salvar');
  await page.getByRole('link', { name: 'Reservar quadra', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Os dados não salvos');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/meus-dados$/);
});

test('registration, duplicate email, field errors, password retention and logout across tabs', async ({
  page,
  context,
}) => {
  await page.goto('/cadastro');
  await page.getByLabel('Nome completo').fill('Cliente Novo Angular');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByLabel('Data de nascimento').fill('1995-01-10');
  await page.getByLabel('Telefone').fill('11987654321');
  await page.getByLabel('E-mail').fill('isadora@email.com');
  await page.getByLabel('Senha', { exact: true }).fill('angular123');
  await page.getByRole('button', { name: 'Criar conta e entrar' }).click();
  await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Nome completo')).toHaveValue('Cliente Novo Angular');
  await page.getByLabel('E-mail').fill('novo-angular@example.com');
  await page.getByRole('button', { name: 'Criar conta e entrar' }).click();
  await expect(page).toHaveURL(/reservar$/);
  await page.getByRole('link', { name: 'Meus dados' }).click();
  await page.getByLabel('Nome completo').fill('Nome Atualizado Angular');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.locator('.shell-header')).toContainText('Nome Atualizado Angular');
  const second = await context.newPage();
  await second.goto('/minhas-reservas');
  await expect(second.getByRole('heading', { name: 'Minhas reservas' })).toBeVisible();
  await page.getByLabel('Nome completo').fill('Rascunho não salvo');
  await second.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('E-mail').fill('novo-angular@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('angular123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/meus-dados$/);
  await expect(page.getByLabel('Nome completo')).toHaveValue('Nome Atualizado Angular');
});

test('404, browser reload, admin client editing, pagination and native select keyboard', async ({
  page,
}) => {
  await page.goto('/nao-existe');
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible();
  await login(page, true);
  await page.getByRole('link', { name: 'Clientes', exact: true }).click();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Paginação' })).toContainText('Página 2');
  await page.getByLabel('Buscar clientes').fill('isadora');
  await expect(page.getByRole('navigation', { name: 'Paginação' })).toContainText('Página 1');
  await page.getByRole('button', { name: 'Editar Isadora Oliveira' }).click();
  await page.getByLabel('Nome completo').fill('Isadora Editada');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('table')).toContainText('Isadora Editada');
  await page.reload();
  await expect(page.getByRole('table')).toContainText('Isadora Editada');
  await page.getByLabel('Status', { exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Status', { exact: true })).toHaveValue('ativos');
  await expect(page).toHaveTitle('Clientes · Arena Beach Tennis');
  expect(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor),
  ).not.toBe('auto');
});
