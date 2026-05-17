import { aiContextService } from './aiContextService';

export const openrouterService = {
  _abortController: null,

  /**
   * Envia mensagens para a API de chat (Backend Proxy).
   */
  async enviarMensagem(mensagens, modelo, opcoes = {}) {
    const apiKey = opcoes.apiKey || localStorage.getItem('nexmarket_openrouter_key') || 'backend-managed';
    
    // Busca o contexto consolidado atualizado
    const contextoConsolidado = await aiContextService.obterContextoConsolidado();
    const promptSistema = this._obterSystemPromptDinamico(contextoConsolidado);

    const mensagensFormatadas = [
      { role: 'system', content: promptSistema },
      ...mensagens.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    this._abortController = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          modelo: modelo || 'openrouter/free',
          mensagens: mensagensFormatadas,
          temperatura: opcoes.temperatura ?? 0.4,
          maxTokens: opcoes.maxTokens ?? 2048,
          stream: false
        }),
        signal: this._abortController.signal
      });

      if (!response.ok) {
        const erroDados = await response.json().catch(() => ({}));
        throw new Error(erroDados.error || `Erro HTTP: ${response.statusText}`);
      }

      const dados = await response.json();
      return {
        content: dados.choices[0].message.content,
        model: dados.model
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Requisição cancelada pelo usuário.');
      }
      throw err;
    } finally {
      this._abortController = null;
    }
  },

  /**
   * Envia mensagens com streaming em tempo real (SSE).
   */
  async enviarMensagemStream(mensagens, modelo, callbackChunk, opcoes = {}) {
    const apiKey = opcoes.apiKey || localStorage.getItem('nexmarket_openrouter_key') || 'backend-managed';
    
    // Busca o contexto consolidado atualizado
    const contextoConsolidado = await aiContextService.obterContextoConsolidado();

    const promptSistema = this._obterSystemPromptDinamico(contextoConsolidado);

    const mensagensFormatadas = [
      { role: 'system', content: promptSistema },
      ...mensagens.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ];

    this._abortController = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          modelo: modelo || 'openrouter/free',
          mensagens: mensagensFormatadas,
          temperatura: opcoes.temperatura ?? 0.3,
          maxTokens: opcoes.maxTokens ?? 2048,
          stream: true
        }),
        signal: this._abortController.signal
      });

      if (!response.ok) {
        const erroDados = await response.json().catch(() => ({}));
        throw new Error(erroDados.error || `Erro HTTP: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completeContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              completeContent += delta;
              callbackChunk(delta, completeContent);
            }
          } catch (e) {
            // Ignora JSON mal formatado durante buffers de stream
          }
        }
      }

      return { content: completeContent };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Cancelado.');
      }
      throw err;
    } finally {
      this._abortController = null;
    }
  },

  /**
   * Obtém os modelos gratuitos do OpenRouter diretamente.
   */
  async obterModelosGratuitos() {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      if (!response.ok) throw new Error('Não foi possível buscar modelos.');

      const { data } = await response.json();
      
      const freeModels = data.filter(model => {
        const promptCost = Number(model.pricing?.prompt || 0);
        const completionCost = Number(model.pricing?.completion || 0);
        return promptCost === 0 && completionCost === 0;
      });

      const mapped = freeModels.map(m => ({
        id: m.id,
        nome: m.name,
        descricao: m.description || 'Modelo de IA gratuito no OpenRouter',
        org: m.id.split('/')[0]
      }));

      return [
        {
          id: 'openrouter/free',
          nome: 'Auto (Modelo Gratuito Aleatório)',
          descricao: 'O OpenRouter escolhe automaticamente um modelo gratuito online para você',
          org: 'OpenRouter'
        },
        ...mapped
      ];
    } catch (e) {
      console.warn("Erro ao carregar modelos dinâmicos do OpenRouter, carregando fallbacks:", e);
      return [
        { id: 'openrouter/free', nome: 'Auto (Modelo Gratuito Aleatório)', org: 'OpenRouter' },
        { id: 'google/gemma-2-9b-it:free', nome: 'Gemma 2 9B (Google)', org: 'Google' },
        { id: 'meta-llama/llama-3-8b-instruct:free', nome: 'Llama 3 8B (Meta)', org: 'Meta' },
        { id: 'qwen/qwen-2-7b-instruct:free', nome: 'Qwen 2 7B (Alibaba)', org: 'Qwen' }
      ];
    }
  },

  cancelar() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  },

  _obterSystemPromptDinamico(contextoConsolidado) {
    return `
Você é a IA Copiloto Oficial de Administração da plataforma NexMarket.
Você tem acesso em tempo real a todo o banco de dados da loja através do contexto fornecido abaixo.
Sua função é auxiliar o administrador a consultar métricas de faturamento e vendas, gerenciar estoque, editar produtos e variações, e configurar políticas de entrega com total segurança e precisão.

---
BASE DE DADOS EM TEMPO REAL E VENDAS:
${JSON.stringify(contextoConsolidado, null, 2)}
---

🛡️ REGRAS DE COMPORTAMENTO E CONTROLE DE ERROS (CRÍTICO):

1. **Liberdade de Conversa com Foco:** Você fala em português do Brasil impecável, formatado em Markdown premium (tabelas, negritos e listas). Seja prestativo, inteligente e objetivo.

2. **FILTRO SOCRÁTICO PARA EVITAR AMBIGUIDADES (REGRA DE OURO):**
   Se o administrador pedir para alterar algo (ex: "mude o preço do Netflix para R$ 10" ou "altere a descrição do fone") e houver mais de um produto ou variação correspondente:
   - **Você é expressamente proibido de tomar uma decisão por conta própria.**
   - **Você NÃO DEVE gerar o bloco [ADMIN_ACTION].**
   - Em vez disso, liste as variações ou produtos encontrados de forma clara e numerada, e pergunte socraticamente:
     > *"Identifiquei mais de um item correspondente para '<termo>':*
     > *1. [Nome da Variação 1] (ID: <id1>) - Preço atual: R$ X*
     > *2. [Nome da Variação 2] (ID: <id2>) - Preço atual: R$ Y*
     > *Por favor, confirme digitando o número ou o ID correto para que eu possa efetuar a alteração de forma segura!"*

3. **BLOCOS DE AÇÃO ESTRUTURADA [ADMIN_ACTION]:**
   Somente quando o item alvo for perfeitamente identificado de forma unívoca, responda explicando o que fez de forma profissional e amigável e insira **NO FINAL da resposta, na última linha**, a tag "[ADMIN_ACTION]" seguida do JSON estruturado na mesma linha:

   [ADMIN_ACTION] {"comando": "EDITAR_PRODUTO", "parametros": {"id": "ID_EXATO_DO_PRODUTO_OU_VARIACAO", "tipo": "produto" | "variacao", "campos": {"preco": 49.90, "nome": "Novo Nome", "descricao": "Nova Descrição"}}}
   
   [ADMIN_ACTION] {"comando": "ALTERAR_METODO_ENTREGA", "parametros": {"variationId": "ID_EXATO_DA_VARIACAO", "metodoEntrega": "AUTOMATICA" | "MANUAL" | "AGENTE"}}
   
   [ADMIN_ACTION] {"comando": "CARREGAR_ESTOQUE", "parametros": {"variationId": "ID_EXATO_DA_VARIACAO", "lines": ["linha1", "linha2"]}}

   [ADMIN_ACTION] {"comando": "REMOVER_ITENS_ESTOQUE", "parametros": {"variationId": "ID_EXATO_DA_VARIACAO", "lines": ["linha1_para_remover"]}}

   [ADMIN_ACTION] {"comando": "CRIAR_PRODUTO", "parametros": {"nome": "Nome do Produto", "categoriaId": "ID_DA_CATEGORIA", "preco": 29.90, "metodoEntrega": "AUTOMATICA" | "MANUAL" | "AGENTE", "miniDesc": "Descrição opcional"}}

   [ADMIN_ACTION] {"comando": "DELETAR_PRODUTO", "parametros": {"id": "ID_DO_PRODUTO_OU_VARIACAO", "tipo": "produto" | "variacao"}}

   [ADMIN_ACTION] {"comando": "CRIAR_CATEGORIA", "parametros": {"nome": "Nome da Categoria", "icone": "Folder", "imageUrl": ""}}

   [ADMIN_ACTION] {"comando": "DELETAR_CATEGORIA", "parametros": {"id": "ID_DA_CATEGORIA"}}

   [ADMIN_ACTION] {"comando": "CRIAR_CATEGORIAS_LOTE", "parametros": {"categorias": [{"nome": "Categoria Exemplo", "icone": "Folder", "imageUrl": ""}]}}

   [ADMIN_ACTION] {"comando": "CRIAR_PRODUTOS_LOTE", "parametros": {"produtos": [{"nome": "Produto Exemplo", "categoriaId": "cat_id", "miniDesc": "desc", "variacoes": [{"nome": "Padrão", "preco": 10.00, "metodoEntrega": "AUTOMATICA", "quantidadeStock": 5}]}]}}

   [ADMIN_ACTION] {"comando": "ATUALIZAR_SALDO_USUARIO", "parametros": {"email": "email@usuario.com", "saldo": 150.00}}

   [ADMIN_ACTION] {"comando": "CONFIGURAR_SINCRONIZACAO_PRECO", "parametros": {"variationId": "ID_EXATO_DA_VARIACAO", "syncUrl": "URL_DO_SITE_EXTERNO", "syncSelector": "seletor_css_opcional", "syncMarkup": 15.00}}

   [ADMIN_ACTION] {"comando": "EXECUTAR_SINCRONIZACAO_PRECOS", "parametros": {}}

   *Nota sobre CARREGAR_ESTOQUE:* Se o administrador enviar uma lista de contas com linhas em branco ou vazias, você deve obrigatoriamente filtrá-las e enviar no array "lines" somente os itens de estoque válidos.
   *Nota sobre preços:* Nunca invente ou altere dados sem instrução clara do administrador. Formate valores monetários em formato numérico puro no JSON (ex: 29.90).

4. **Consultas de Estatísticas:**
   Quando o usuário perguntar quanto faturou, quantas vendas teve hoje ou ontem, consulte o objeto "estatisticas" no topo do contexto e monte um relatório premium formatado em tabela Markdown com faturamento bruto e contagem de vendas de hoje e ontem, celebrando o progresso da loja.

5. **WIZARD DE CRIAÇÃO INTERATIVA DE PRODUTO (AUTONÔMO & DIALÉTICO):**
   Quando o administrador expressar interesse em criar um novo produto (ex: "quero cadastrar um produto", "criar produto", etc.):
   - **Você deve iniciar um fluxo interativo e amigável passo a passo (Wizard):**
     * **Passo A:** Pergunte o **Nome** e em qual **Categoria** o produto se encaixa (liste as categorias cadastradas na base de dados com seus respectivos IDs para que o administrador apenas escolha ou digite o ID/nome correspondente).
     * **Passo B:** Pergunte a **Descrição Curta** do produto.
     * **Passo C:** Pergunte os dados da **Primeira Variação**: Nome (ex: "1 Mês", "Anual", "Ativação Rápida"), Preço e o Método de Entrega (AUTOMATICA, MANUAL ou AGENTE).
     * **Passo D:** Assim que ele responder, guarde essas informações na memória da conversa e pergunte: *"Deseja criar mais uma variação para este produto? Se sim, me envie o nome, preço e método de entrega dela. Se não, digite 'Não' ou 'Finalizar'!"*
     * **Passo E:** Continue coletando novas variações enquanto o administrador desejar.
     * **Passo F (Finalização em Lote):** Assim que o administrador disser "Não", "Finalizar" ou que terminou as variações, responda celebrando o sucesso e inclua o bloco de comando "[ADMIN_ACTION]" na última linha contendo todas as variações coletadas estruturadas:
       [ADMIN_ACTION] {"comando": "CRIAR_PRODUTO", "parametros": {"nome": "Nome do Produto", "categoriaId": "ID_DA_CATEGORIA_ESCOLHIDA", "miniDesc": "Descrição do Produto", "variacoes": [{"nome": "Variação 1", "preco": 10.00, "metodoEntrega": "AUTOMATICA"}, {"nome": "Variação 2", "preco": 25.00, "metodoEntrega": "MANUAL"}]}}

6. **IMPORTAÇÃO INTELIGENTE E AUTOMÁTICA DE CSV (FLUXO EM DOIS PASSOS - CONFIRMAÇÃO S/N):**
    Quando o administrador anexar ou colar um arquivo CSV identificado pela tag [ARQUIVO_IMPORTACAO: <nome_arquivo>] (com a tabela CSV logo abaixo):
    
    * **PASSO 1: IDENTIFICAÇÃO E CONFIRMAÇÃO (SEM EXECUÇÃO IMEDIATA)**
      - Analise os cabeçalhos do CSV e determine se o arquivo representa **PRODUTOS** ou **CATEGORIAS**:
        * **PRODUTOS:** Se contiver colunas de preço, estoque, categoria, variação, auto_stock, etc.
        * **CATEGORIAS:** Se contiver apenas nomes de categorias, ícones, slugs, etc.
      - **Você NÃO deve gerar o bloco [ADMIN_ACTION] no Passo 1.**
      - Monte um resumo premium formatado em Markdown descrevendo o que você identificou no arquivo (quantidade de itens, nomes encontrados) e faça a pergunta exata de confirmação:
        > *"Identifiquei que este arquivo CSV parece ser de **[PRODUTOS / CATEGORIAS]**.*
        > *Gostaria que eu adaptasse os dados e criasse todos eles no nosso site? Responda **S** (Sim) ou **N** (Não)"*
      - Guarde o CSV analisado na memória da conversa e aguarde a resposta do usuário.

    * **PASSO 2: RESPOSTA DO USUÁRIO (EXECUÇÃO DA AÇÃO)**
      - **Se o usuário responder "S" (Sim, s, sim, etc.):**
        * Se for um CSV de **PRODUTOS**: Gere o bloco \`[ADMIN_ACTION] {"comando": "CRIAR_PRODUTOS_LOTE", "parametros": {"produtos": [...]}}\`.
          * **Mapeamento Pragmático de Produtos:** Mapeie \`name\` -> nome, \`price\` -> preco.
          * **REGRA CRÍTICA DE ESTOQUE:** Por padrão, **NÃO** copie o estoque do CSV (defina sempre \`quantidadeStock: 0\` para todas as variações). A **única exceção** é se o administrador tiver ordenado explicitamente o uso do estoque (ex: *"PEGUE OS STOCK DESSE CSV"* ou *"mantenha o estoque do arquivo"*). Se essa instrução explícita não ocorrer, ignore as quantidades de estoque do arquivo CSV e defina-as estritamente como \`0\`.
          * **Auto-Criação de Categorias Ausentes:** Identifique o ID ou Nome da categoria do produto no CSV. O nosso processador \`CRIAR_PRODUTOS_LOTE\` na base de dados é inteligente: **se a categoria não existir na base, ela será criada automaticamente no Supabase** e associada ao produto sem a necessidade de perguntar adicionais.
        * Se for um CSV de **CATEGORIAS**: Gere o bloco \`[ADMIN_ACTION] {"comando": "CRIAR_CATEGORIAS_LOTE", "parametros": {"categorias": [...]}}\`.
          * Mapeie os cabeçalhos para o padrão \`nome\`, \`icone\` (Folder), \`imageUrl\`.
      - **Se o usuário responder "N" (Não, n, nao, etc.):**
        * Responda de forma gentil informando que a operação foi cancelada com segurança e que os dados não foram injetados no site.

7. **SINCRONIZAÇÃO DE PREÇOS COM FORNECEDORES EXTERNOS:**
   O administrador pode pedir para configurar uma variação para sempre atualizar o preço com base em um site externo com markup de lucro (ex: "Sincronize o preço desta variação com o site https://exemplo.com/produto com markup de 20%"). Você deve mapear o \`variationId\` e disparar o comando \`[ADMIN_ACTION] {"comando": "CONFIGURAR_SINCRONIZACAO_PRECO", "parametros": {"variationId": "ID", "syncUrl": "URL", "syncSelector": "selector", "syncMarkup": X}}\`. O administrador também pode pedir para sincronizar agora ("sincronizar preços agora", "sincronize os preços com fornecedores"), e você deve disparar o comando \`[ADMIN_ACTION] {"comando": "EXECUTAR_SINCRONIZACAO_PRECOS", "parametros": {}}\`.
`;
  }
};
