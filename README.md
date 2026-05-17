# NexMarket Pro - Admin Dashboard

Este é o Painel Administrativo Premium para o e-commerce de produtos digitais. Construído com **React, Vite, Tailwind CSS e Framer Motion**.

## Como rodar o projeto

1. Certifique-se de que o **Node.js** está instalado em seu computador.
2. Abra o terminal na pasta raiz (`dadadada`) e instale as dependências caso ainda não tenha feito:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   *(Caso você não tenha os scripts configurados no `package.json`, pode rodar diretamente com `npx vite`)*

4. Acesse no navegador: **http://localhost:5173/admin**

## Arquitetura de Dados (Local JSON)

Para que o React possa ler e escrever nos arquivos JSON sem a necessidade de um servidor backend pesado, foi desenvolvido um **Vite Plugin** customizado (veja `vite.config.js`).

- Toda chamada para `/api/produtos` ou `/api/compras` é interceptada pelo Vite.
- O Vite lê os arquivos físicos da sua pasta `database/`.
- Quando você edita e salva um produto, o Vite escreve a alteração diretamente no arquivo `.json`.
- **Atenção:** As pastas em `database/` (products, variacoes, etc.) devem existir e possuir um arquivo `data.json` dentro, contendo um array válido `[]`.

## Funcionalidades Principais

- **Visualização SaaS Premium**: Dark mode focado com Glassmorphism.
- **Gerenciamento de Produtos**: Tabela com search e formulário de Criação/Edição.
- **Gestão de Estoque (Variações)**: Capacidade de colar chaves/contas (1 por linha) em uma `textarea` que é convertida nativamente para a lista de estoque no JSON (`stockData`).
- **Monitor de Vendas**: Tabela de histórico ligando as **compras** com as **entregas** correspondentes de forma inteligente.
- **Vitrine**: Preview exato de como os cards de produtos ficarão para o usuário final, com animações em Framer Motion.

## Estrutura de Pastas

```
/
├── database/            # Arquivos JSON locais (Local DB)
├── src/
│   ├── components/      # Componentes do Admin (Sidebar, TopBar, Cards)
│   ├── pages/           # Telas do Dashboard (Dashboard, Products, Sales...)
│   ├── services/        # Configuração da API Mock para ler JSON
│   ├── App.jsx          # Rotas principais
│   ├── index.css        # Variáveis Tailwind e Glass classes
│   └── main.jsx         # Entry point React
├── vite.config.js       # Configuração e API Plugin local
└── tailwind.config.js   # Tokens de design Premium
```

## 🤖 IA Copiloto (OpenRouter)

O painel agora conta com uma **IA Copiloto integrada via OpenRouter**! Ela oferece:
- **Visualização Dividida (Split Chat)**: Converse em canais de texto ou analise simultaneamente duas conversas.
- **Sincronização Automática com Fornecedores**: Configuração e execução de robôs que analisam e copiam preços de sites de fornecedores externos com base em markup percentual.
- **Importação Pragmática em Lote**: Importe produtos ou categorias inteiras enviando ou colando arquivos `.csv` de estoque.
- **Automação de Banco de Dados**: A IA é capaz de rodar mutações diretas e seguras no Supabase por meio de comandos estruturados, como edição e deleção de produtos.

## 🚀 Deploy e Sincronização na Vercel

O projeto está configurado para publicação em nuvem através da Vercel:
- **Painel Administrativo**: Pasta raiz com suporte a API Serverless para Crons e rotas estáticas do painel.
- **Storefront (Vitrine Principal)**: Localizado na pasta `/nexmarket` contendo o e-commerce de produtos digitais moderno e responsivo.

