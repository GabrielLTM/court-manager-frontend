# Documentação

Mapa da documentação do frontend da Arena Beach Tennis. Se for a primeira vez aqui, comece pelo
[README](../README.md) do projeto e depois siga a trilha que combina com o que você precisa fazer.

## Por onde começar

| Eu quero... | Leia |
| --- | --- |
| Rodar o sistema na minha máquina | [Guia de instalação e execução](getting-started.md) |
| Conhecer as telas e o que cada uma faz | [Telas e fluxos](screens.md) |
| Entender as regras do negócio e quem pode fazer o quê | [Regras de negócio](business-rules.md) |
| Entender como o código está organizado | [Arquitetura](architecture.md) |
| Saber por que uma decisão técnica foi tomada | [Registros de decisão (ADRs)](adr/README.md) |
| Implementar o backend ou integrar com ele | [Contrato da API](api-contract.md) |
| Mexer em cores, fontes ou componentes visuais | [Design system](design-system.md) |
| Escrever ou rodar testes | [Estratégia de testes](testing.md) |
| Contribuir com código | [Guia de contribuição](../CONTRIBUTING.md) |
| Ver o que mudou entre versões | [Changelog](../CHANGELOG.md) |

## Índice

### Começar

| Documento | Conteúdo |
| --- | --- |
| [getting-started.md](getting-started.md) | Pré-requisitos, instalação, contas de demonstração, variáveis de ambiente, backend simulado, API real, build, deploy e solução de problemas |

### Entender o sistema

| Documento | Conteúdo |
| --- | --- |
| [screens.md](screens.md) | Mapa de navegação, descrição de cada tela com capturas e os fluxos principais de uso |
| [business-rules.md](business-rules.md) | Requisitos funcionais (RF01–RF16), regras de negócio (RN01–RN10), perfis e permissões, ciclos de vida de reserva e pagamento |

### Entender o código

| Documento | Conteúdo |
| --- | --- |
| [architecture.md](architecture.md) | Camadas e regra de dependência, injeção de dependência, estado, rotas, erros, autenticação e guia para criar funcionalidades |
| [adr/README.md](adr/README.md) | Registros das decisões de arquitetura, com contexto, decisão e consequências |
| [design-system.md](design-system.md) | Paleta, tipografia, tokens, componentes e acessibilidade |
| [testing.md](testing.md) | Pirâmide de testes, como executar, convenções e auxiliares |

### Referência

| Documento | Conteúdo |
| --- | --- |
| [api-contract.md](api-contract.md) | Rotas, formatos, enums, regras validadas no servidor e erros da API REST esperada do backend |

## Documentos de origem

Estes documentos orientaram o desenvolvimento, mas **não fazem parte do repositório**:

- **Especificação 1.0 — Sistema de Gestão de Arena de Beach Tennis** (equipe Ottawa Tech): requisitos,
  regras de negócio, entidades e plano de sprints. É a fonte dos códigos RFxx e RNxx.
- **Protótipo "Arena Beach Tennis"** (HTML): origem do layout e dos fluxos das telas.
- **Design v2 (Ottawa Tech):** paleta, tipografia, logotipo e textos da interface atual.

## Convenções desta documentação

- Escrita em português do Brasil, com diagramas em [Mermaid](https://mermaid.js.org), que o GitHub
  renderiza.
- Links sempre relativos, para continuarem válidos em qualquer branch.
- As capturas de tela ficam em [`images/`](images).
- Documentos explicam o **porquê** e o **como usar**; o código é a fonte da verdade sobre o **como é feito**.
  Por isso as referências apontam para arquivos, e não para linhas.

## Mantendo a documentação em dia

A documentação muda no mesmo pull request que o código. A tabela "Documentação" do
[guia de contribuição](../CONTRIBUTING.md#documentação) diz qual documento atualizar para cada tipo de mudança.
Decisões de arquitetura novas viram um [ADR](adr/README.md); ADRs aceitos não são reescritos.
