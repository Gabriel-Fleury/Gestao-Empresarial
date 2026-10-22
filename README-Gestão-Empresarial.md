<div align="center">

<img src="ProjetoElvolcks/public/emblema-elvolcks-13anos.svg" alt="Elvolcks Auto Som — 13 anos" width="150" />

# Gestão Empresarial · Elvolcks Auto Som

**Sistema de gestão sob medida para uma loja de som e acessórios automotivos:<br>orçamentos, vendas, serviços, estoque e caixa num só lugar.**

[![Site no ar](https://img.shields.io/badge/no%20ar-elvolcks--auto--som.web.app-1E5BB8?style=for-the-badge&logo=firebase&logoColor=white)](https://elvolcks-auto-som.web.app)
[![Publicar site](https://img.shields.io/github/actions/workflow/status/Gabriel-Fleury/gestao-empresarial/publicar.yml?branch=main&style=for-the-badge&label=deploy)](../../actions/workflows/publicar.yml)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-C9A13B?style=for-the-badge)](LICENSE)

![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?logo=firebase&logoColor=white)

</div>

---

## Sobre o projeto

A **Elvolcks Auto Som** atua há 13 anos em Barra do Garças (MT) com instalação de som, acessórios e serviços automotivos. Até 2026 todo o controle da loja era feito **em cadernos**: sem estoque confiável, sem histórico de vendas e sem visão clara do caixa.

Este sistema nasceu para resolver isso. Ele foi desenhado a partir da rotina real da loja, conversado requisito por requisito antes de qualquer linha de código, e hoje está **em produção** sendo usado pela equipe no balcão.

> O fluxo segue a operação da loja: **orçamento → venda ou serviço → estoque e caixa atualizados**, sem passos extras.

## Funcionalidades

### Lançamentos em três tipos
| Tipo | O que faz |
|---|---|
| **Orçamento** | Não mexe em estoque nem caixa. Validade de 7 dias, sem reserva de peças. Pode ser **convertido** em venda ou serviço com um clique. |
| **Venda** | Só peças. Baixa o estoque e entra no caixa na hora. |
| **Serviço realizado** | Peças + mão de obra, com instalador, comissão, placa, KM e descrição do serviço. Baixa o estoque ao salvar. |

- Numeração sequencial por tipo (**O-1, V-1, S-1…**) gerada em transação, sem números repetidos
- Pagamento em **PIX, dinheiro, débito, crédito à vista ou parcelado**, com até **duas formas no mesmo lançamento**
- Registro de **nota fiscal** emitida fora do sistema (número da NF)
- Data e hora do lançamento e **quem lançou**, sempre registrados
- **Impressão em A4** e **PDF** com cabeçalho da loja, itens, totais, pagamento e campos de assinatura

### Painel e consultas
- **Início**: totais do dia, estoque baixo, últimos lançamentos e botão rápido para novo lançamento
- **Busca de peças** por código, nome ou marca, com preço e quantidade em estoque
- **Clientes** com sugestão automática ao digitar nome ou telefone

### Estoque
- Cadastro de produtos com código sequencial, marca, preço de custo e preço de venda
- Entrada de mercadoria, correção de estoque e **histórico de movimentações**
- Alerta visual de estoque baixo ou zerado

### Caixa e relatórios
- **Caixa diário** por data, com entradas detalhadas (visível só para administradores)
- **Relatórios mensais**: faturamento, peças mais vendidas, melhor dia e quantidade de serviços

### Equipe e controle
- Colaboradores com funções (**vende**, **instala**, **admin**) e login por nome de usuário
- Cancelar ou editar lançamentos é exclusivo do administrador, e **toda alteração fica no histórico** com autor, data e o que mudou
- Cancelar uma venda **devolve as peças ao estoque** e retira o valor do caixa automaticamente
- Colaborador desativado perde o acesso na hora
- Cada pessoa troca a própria senha pelo sistema

## Segurança

Toda a proteção dos dados é feita **no servidor**, pelas [regras do Firestore](ProjetoElvolcks/firestore.rules), e não só pela interface:

- Sem login, nada é lido. Com login, só colaboradores **cadastrados e ativos** acessam.
- Ninguém lança em nome de outra pessoa, e ninguém se promove a administrador.
- Funcionário não edita valores nem cancela lançamentos. Isso é exclusivo do admin.
- A instalação inicial só pode acontecer **uma única vez**.

As regras têm **testes automatizados** contra o emulador do Firebase, cobrindo os cenários permitidos e negados (veja [Testando as regras](#testando-as-regras)).

> A configuração web do Firebase em `src/firebase.ts` é pública por natureza: ela vai junto no site publicado. Quem protege os dados são as regras acima. Credenciais de deploy ficam nos *Secrets* do GitHub.

## Tecnologias

| Camada | Ferramenta |
|---|---|
| Interface | React 19 + TypeScript |
| Build | Vite |
| Estilo | Tailwind CSS 4 |
| Banco de dados | Cloud Firestore (com cache local no aparelho) |
| Autenticação | Firebase Authentication |
| Hospedagem | Firebase Hosting |
| PDF | jsPDF + html-to-image |
| Qualidade | Oxlint |
| CI/CD | GitHub Actions |

## Estrutura

```
gestao-empresarial/
├── .github/workflows/        # Deploy automático no Firebase Hosting
└── ProjetoElvolcks/
    ├── public/               # Logo, ícones, emblema e manifest
    ├── scripts/
    │   ├── instalar.mjs      # Instalação inicial (cria equipe e acessos)
    │   └── testar-regras.mjs # Testes das regras no emulador
    ├── src/
    │   ├── components/       # Formulário de lançamento, detalhe, busca e UI base
    │   ├── pages/            # Início, Lançamentos, Estoque, Caixa, Relatórios…
    │   ├── firebase.ts       # Conexão com Firebase
    │   ├── store.tsx         # Estado global e operações no banco
    │   ├── pdf.ts            # Geração do PDF
    │   ├── types.ts          # Tipos do domínio
    │   └── util.ts           # Cálculos, formatação e dados da loja
    ├── firestore.rules       # Regras de segurança
    └── firebase.json
```

## Rodando localmente

**Pré-requisitos:** Node.js 22+ e npm.

```bash
git clone https://github.com/Gabriel-Fleury/gestao-empresarial.git
cd gestao-empresarial/ProjetoElvolcks
npm install
npm run dev
```

Por padrão o app se conecta ao projeto Firebase da loja. Para usar o seu próprio, crie um projeto no [console do Firebase](https://console.firebase.google.com), ative **Authentication (e-mail/senha)** e **Firestore**, e troque o `firebaseConfig` em `src/firebase.ts` e o projeto em `.firebaserc`.

### Instalação inicial

Num projeto Firebase novo, edite a lista `EQUIPE` em `scripts/instalar.mjs` e rode uma única vez:

```bash
node scripts/instalar.mjs
```

O script cria as contas, gera **senhas provisórias aleatórias** (exibidas só no terminal) e fecha a instalação. Cada pessoa troca a senha no primeiro acesso.

### Testando as regras

```bash
npm run testar-regras
```

Roda os testes no **emulador local**. O script se recusa a rodar contra o banco real.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção |
| `npm run lint` | Análise estática com Oxlint |
| `npm run preview` | Pré-visualiza o build |
| `npm run deploy` | Build + publica hosting e regras do Firestore |
| `npm run testar-regras` | Testa as regras de segurança no emulador |

## Deploy

Todo push na `main` que altera `ProjetoElvolcks/` dispara o workflow [**Publicar site**](.github/workflows/publicar.yml):

1. Instala as dependências
2. Roda o build. **Se houver erro, para aqui e o site no ar continua intacto.**
3. Publica em **https://elvolcks-auto-som.web.app**

Também é possível publicar manualmente pelo botão *Run workflow* na aba **Actions**. Alterações nas regras do Firestore são publicadas com `npm run deploy`.

## Autor

Desenvolvido por **Gabriel Fleury Martins**, formado em Análise e Desenvolvimento de Sistemas (PUC-GO).

[![GitHub](https://img.shields.io/badge/GitHub-Gabriel--Fleury-181717?logo=github)](https://github.com/Gabriel-Fleury)

## Licença

Distribuído sob a licença **MIT**. Veja [LICENSE](LICENSE).

<div align="center">
<sub>Elvolcks Auto Som · Barra do Garças – MT · desde 2013</sub>
</div>
