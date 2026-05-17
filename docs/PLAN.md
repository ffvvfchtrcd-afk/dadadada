# PLANO DE IMPLEMENTAÇÃO: IA Copiloto do Administrador com OpenRouter Free

Este plano descreve o design, arquitetura e implementação da **IA Copiloto** integrada ao Painel Administrativo do **NexMarket**. O foco exclusivo é fornecer ao administrador uma ferramenta de controle por voz/texto capaz de consultar métricas, gerenciar estoque, editar produtos/variações e alterar regras de entrega de forma inteligente e socrática, prevenindo ações ambíguas.

---

## 🏗️ Arquitetura do Sistema

```mermaid
graph TD
    UI[src/pages/admin/Copilot/index.jsx] -->|1. Envia Chat| ORS[src/services/openrouterService.js]
    ACS[src/services/aiContextService.js] -->|2. Consolida Dados| ORS
    DB[(Supabase Database)] -->|Busca Métricas, Produtos & Estoque| ACS
    ORS -->|3. promptSystem + Contexto| API[API OpenRouter Free]
    API -->|4. Resposta com [ADMIN_ACTION]| UI
    UI -->|5. Intercepta Ação| AAS[src/services/aiActionService.js]
    AAS -->|6. Atualiza Dados| DB
```

---

## 🛠️ Detalhamento dos Componentes a Serem Criados

### 1. 📡 [NEW] [openrouterService.js](file:///f:/New%20folder%20(4)/dadadada/src/services/openrouterService.js)
* **Objetivo:** Canal de comunicação com o OpenRouter.
* **Recursos principais:**
  * Chamadas SSE (`enviarMensagemStream`) para efeito de máquina de escrever (streaming).
  * Consumo dinâmico da API `https://openrouter.ai/api/v1/models` filtrando apenas modelos cujo custo de entrada e saída seja zero (`pricing.prompt === 0 && pricing.completion === 0`).
  * Injeção dinâmica do **System Prompt** composto por:
    1. Regras de comportamento e personalidade.
    2. Contexto de dados estruturado gerado pelo `aiContextService`.
    3. Manual de comandos estruturados para disparo de `[ADMIN_ACTION]`.

### 📊 2. [NEW] [aiContextService.js](file:///f:/New%20folder%20(4)/dadadada/src/services/aiContextService.js)
* **Objetivo:** Alimentar o prompt da IA com dados reais do banco.
* **Consultas no Supabase:**
  * Métricas de Vendas de hoje e ontem (total vendido, faturamento líquido, contagem de pedidos).
  * Lista consolidada de categorias.
  * Catálogo de produtos, mapeando seus IDs, nomes, preços originais, promocionais, métodos de entrega e todas as suas variações associadas (com IDs de variação e estoques).
* **Formatador:** Converte os dados em um bloco compacto de texto legível para a LLM, otimizando os tokens do modelo gratuito.

### ⚡ 3. [NEW] [aiActionService.js](file:///f:/New%20folder%20(4)/dadadada/src/services/aiActionService.js)
* **Objetivo:** Executar de fato as mutações no Supabase quando a IA emite a tag `[ADMIN_ACTION]`.
* **Ações suportadas:**
  * `EDITAR_PRODUTO`: Executa `update` no Supabase nas colunas de preço, preço promocional, descrição ou título do produto ou variação.
  * `ALTERAR_METODO_ENTREGA`: Altera o campo `tipo_entrega` e prazos de entrega do produto.
  * `CARREGAR_ESTOQUE`: Insere novas linhas de contas digitais na tabela de estoque associada à variação do produto.

### 🧠 4. 🛡️ Filtro de Proteção Socrática contra Ambiguidades
* **A Regra Inquebrável (System Prompt):** 
  Se o administrador comandar uma ação como *"mude o preço do fone para R$ 80"*, mas houver mais de um produto contendo "fone" ou múltiplas variações, a IA **deve interromper** e não gerar o comando `[ADMIN_ACTION]`. Em vez disso, ela deve listar as opções numeradas de forma clara e perguntar:
  > *"Identifiquei mais de um produto/variação contendo 'fone' no catálogo:*
  > *1. Fone Gamer Premium (Preto)*
  > *2. Fone Gamer Premium (Branco)*
  > *Por favor, digite o número ou ID correto para que eu possa prosseguir com a alteração de forma segura!"*

### 🎨 5. [NEW] [Copilot Page Component](file:///f:/New%20folder%20(4)/dadadada/src/pages/admin/Copilot/index.jsx)
* **Visual Premium Dark & Neon:**
  * Glassmorphism escuro com bordas gradientes animadas.
  * Dropdown dinâmico para seleção do modelo (ex: `google/gemma-2-9b-it:free`, `meta-llama/llama-3-8b-instruct:free`, `openrouter/free`).
  * Balões de chat impecáveis em Markdown com suporte a tabelas e listagens.
  * **Painel Lateral de Ações Recentes:** Mostra um log de comandos executados com sucesso pela IA.
  * **Overlay de Confirmação:** Quando a IA dispara um comando, o sistema intercepta e exibe uma notificação animada na tela, atualizando a base local e o estado do dashboard de forma reativa.

---

## 🔗 Roteamento e Menu Lateral

### 6. [MODIFY] [Sidebar.jsx](file:///f:/New%20folder%20(4)/dadadada/src/components/admin/Sidebar.jsx)
* Registrar o Copilot no menu sidebar principal:
  ```javascript
  { name: 'AI Copilot', path: '/admin/copilot', icon: Sparkles }
  ```
  *(Importando a biblioteca `Sparkles` do Lucide React).*

### 7. [MODIFY] [App.jsx](file:///f:/New%20folder%20(4)/dadadada/src/App.jsx)
* Adicionar a rota protegida sob o layout administrativo:
  ```jsx
  <Route path="copilot" element={<Copilot />} />
  ```

---

## 🧪 Plano de Verificação

### Teste de Ambiguidades (Socrático)
* **Entrada:** *"altere o preço da Netflix para R$ 10"* (Havendo variação de 1 dia e 30 dias).
* **Esperado:** A IA deve recusar a alteração e listar socraticamente as variações cadastrais solicitando definição.

### Teste de Ações Reais
* **Entrada:** *"altere a descrição do produto Fone de Ouvido de ID <id> para 'Melhor qualidade sonora'"*.
* **Esperado:** O aplicativo deve interceptar o JSON `[ADMIN_ACTION]`, rodar a mutation no Supabase, notificar sucesso na tela de chat e refletir a nova descrição instantaneamente.
