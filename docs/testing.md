# Testes

A migração preserva a regressão TypeScript e testa a apresentação Angular com TestBed e Playwright.

## Suítes

| Nível | Local | Verifica |
| --- | --- | --- |
| Domínio | `src/domain/**/__tests__` | RN01–RN10, valores, horários e estados |
| Casos de uso | `src/application/**/__tests__` | Orquestração, pré-validação e portas |
| Backend simulado | `src/infrastructure/mock/__tests__` | Autorização, persistência e ciclos de reserva/pagamento |
| Adaptadores e sessão | `src/infrastructure/{http,storage}/__tests__`, `src/di/__tests__` | Erros, mapeamento, expiração e montagem mock/HTTP |
| Lógica de exibição | `src/presentation/features/**/__tests__/*.test.ts` | Filtros, grade, disponibilidade, resumo e conversões |
| Angular | `src/presentation/angular/__tests__` | Formulários, validação, busy, alterações não salvas e paginação |
| Navegador | `e2e/` | Rotas reais, perfil, CRUD, reserva, pagamento, cancelamento, recibo e layout estreito |

`npm test` executa Vitest 4 em jsdom. `src/test/setup.ts` carrega o compilador Angular e inicializa `BrowserTestingModule`; cada teste limpa o TestBed e o localStorage. Não usa React Testing Library. Os testes de domínio/infraestrutura mantêm relógios e armazenamento injetáveis.

```bash
npm test
npm test -- src/infrastructure/mock
npm run test:watch
npm run test:e2e
```

Playwright usa Chromium em `/usr/bin/chromium`; defina `CHROMIUM_PATH` para outra instalação. Cada contexto de navegador isola os dados do mock. O runner inicia o Angular CLI na porta 5174; localmente pode reutilizar uma instância dessa porta. CI exige uma instância nova. Screenshot e trace são retidos em falhas.

## Portão de qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

O `typecheck` usa `ngc` e inclui templates estritos da aplicação. O build AOT também valida imports, bindings e rotas lazy. Testes e scripts possuem verificação TypeScript separada em `tsconfig.tests.json`.

## Limites

Os E2E exercitam o backend simulado, não um servidor ASP.NET Core real. Não há afirmação de cobertura percentual, auditoria humana completa de leitores de tela nem compatibilidade testada em todos os navegadores. Os screenshots antigos foram substituídos por evidência da aplicação Angular onde documentado.

Ao adicionar funcionalidades, escreva regras no domínio e casos de integração no mock, depois testes Angular/E2E para o comportamento observável. Não reduza assertions para fazer uma migração passar. O relatório [angular-migration.md](angular-migration.md) relaciona as capacidades e a evidência de validação.
