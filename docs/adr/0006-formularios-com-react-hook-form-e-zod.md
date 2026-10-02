# ADR-0006 — Formulários com React Hook Form e Zod

- **Status:** Aceita
- **Data:** 2026-09-25
- **Decisores:** Equipe Ottawa Tech

## Contexto

O sistema tem vários formulários: login, autocadastro (RF01), "Meus dados" (RF02), cliente e quadra do administrador. Os campos do cliente (nome, CPF, data de nascimento, telefone, e-mail e senha) aparecem em três deles, com máscaras de CPF e telefone e senha obrigatória ou opcional conforme o caso.

A Especificação 1.0 (seção 6.1) lista as validações de interface (campos obrigatórios, formato de e-mail, formato de dados, senhas e formulários incompletos) e deixa claro que elas não substituem as do backend. O servidor, por sua vez, devolve erros por campo e conflitos de CPF (RN01) e e-mail (RN02) que precisam aparecer junto ao campo correspondente.

## Decisão

- Usar **React Hook Form** (`useForm`, `FormProvider` e `useFormContext`) com esquemas **Zod** definidos em `presentation/validation/schemas.ts`, ligados por `@hookform/resolvers/zod`. Os `<form>` usam `noValidate`, de modo que as mensagens, em português, vêm do Zod.
- Reutilizar os predicados do domínio (`cpfValido`, `emailValido` e `telefoneValido`) dentro de `refine`.
- Compartilhar os campos do cliente em `ClienteFields`, parametrizado por `senha` (`obrigatoria`, `opcional` ou `oculta`) e `incluirStatus`. As máscaras (`maskCpf` e `maskTelefone`) entram via `Controller`; os demais campos usam `register`.
- Tratar os valores de formulário como **strings** (por exemplo, `status` é `z.enum(['1', '2'])` e `valorHora` é texto) e converter para DTOs em funções puras dos `*.utils.ts` (`formParaNovoCliente` e `formParaAtualizarCliente`).
- Exibir erros do servidor com `aplicarErrosDoServidor`, que copia `fieldErrors` para os campos e mapeia RN01 para `cpf` e RN02 para `email`; o resumo vai para `toast.error(getErrorMessage(erro))`.
- Manter três níveis de validação: esquema Zod (feedback imediato), caso de uso (`validarDadosCliente`, com `DomainError`) e backend (autoridade).

## Consequências

**Positivas**

- A validação é declarativa e tipada: `z.infer` produz tipos como `LoginFormValues` e `ClienteFormValues`.
- Os campos do cliente, as máscaras e as regras de formato ficam em um só componente e um só arquivo de esquemas, usados nos três formulários.
- Os erros do servidor aparecem junto ao campo, com foco no primeiro deles.
- A maioria dos campos usa `register` (não controlados); só os mascarados usam `Controller`.

**Negativas e trade-offs**

- As regras de formato existem em três lugares: esquemas Zod, `validarDadosCliente` e backend. Os textos são iguais e mantidos à mão.
- Valores em string exigem conversão no envio (`Number(values.status)`, `parseDecimal`).
- `aplicarErrosDoServidor` compara nomes de campo sem diferenciar caixa nem símbolos e exige uma lista explícita de campos por formulário.
- São três dependências a mais (`react-hook-form`, `zod` e `@hookform/resolvers`), e o código usa a API do Zod 4 (`{ error: ... }`).
- `dataNascimentoValida` usa `new Date()` direto, e não o `Clock` injetado.
- O diálogo `AlterarReservaDialog` é uma exceção: usa `useState` e validação manual, sem React Hook Form nem Zod.

## Alternativas consideradas

- **Formulários controlados com `useState`.** Não adotada: cada formulário reimplementaria estado, validação, foco no erro e mensagens, inclusive para os campos repetidos do cliente.
- **Validação nativa do HTML5 (`required`, `type="email"`).** Não adotada: não padroniza as mensagens em português nem integra os erros do servidor por campo; por isso os formulários usam `noValidate`.
- **Validar só nos casos de uso (`validarDadosCliente`).** Não adotada: ele lança `DomainError` na primeira falha, sem indicar o campo, e a interface perderia o feedback por campo antes do envio.

## Referências

- [`schemas.ts`](../../src/presentation/validation/schemas.ts) e [`ClienteFields.tsx`](../../src/presentation/components/forms/ClienteFields.tsx).
- [`serverErrors.ts`](../../src/presentation/lib/serverErrors.ts) e [`errors.ts`](../../src/presentation/lib/errors.ts).
- [`CadastroForm.tsx`](../../src/presentation/features/auth/CadastroForm.tsx) e [`ClienteFormDialog.tsx`](../../src/presentation/features/admin/clientes/components/ClienteFormDialog.tsx).
- [`validarDadosCliente.ts`](../../src/application/use-cases/validarDadosCliente.ts) e [`masks.ts`](../../src/shared/lib/masks.ts).
- [`architecture.md`](../architecture.md) (seção 7) e [`screens.md`](../screens.md).
- [ADR-0004](0004-regras-de-negocio-no-dominio.md).
