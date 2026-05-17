/* ============================================
   NEXCHAT - Serviço OpenRouter
   Comunicação com a API do OpenRouter
   ============================================ */

const openrouterServico = {
    /**
     * Estado da chave de API global no backend
     */
    _chaveGlobalAtiva: false,

    /**
     * Controlador de abort para cancelar requisições
     */
    _abortController: null,

    /**
     * Inicializa a verificação da chave de API global
     */
    async inicializar() {
        try {
            const resposta = await fetch('/api/status');
            if (resposta.ok) {
                const dados = await resposta.json();
                this._chaveGlobalAtiva = !!dados.chaveGlobalAtiva;
                console.log(`📡 Híbrido Backend Status: Chave Global Ativa = ${this._chaveGlobalAtiva}`);
            }
        } catch (erro) {
            console.warn('⚠️ Rodando em servidor estático simples ou offline. Chave global desabilitada:', erro);
            this._chaveGlobalAtiva = false;
        }
    },

    /**
     * Getter para saber se a chave global está ativa
     */
    obterChaveGlobalAtiva() {
        return this._chaveGlobalAtiva;
    },

    /**
     * Envia mensagem para a API do OpenRouter (sem streaming)
     */
    async enviarMensagem(mensagens, modelo, opcoes = {}) {
        const usandoChaveGlobal = this._chaveGlobalAtiva;
        const apiKey = usandoChaveGlobal ? 'backend-managed' : armazenamentoServico.obterApiKey();
        
        if (!apiKey) {
            throw new Error('Configure sua API key do OpenRouter nas configurações.');
        }

        const temperatura = opcoes.temperatura ?? armazenamentoServico.obterTemperatura();
        const maxTokens = opcoes.maxTokens ?? armazenamentoServico.obterMaxTokens();
        const promptSistema = this._obterSystemPromptDinamico();

        // Monta array de mensagens com system prompt
        const mensagensFormatadas = [
            { role: 'system', content: promptSistema },
            ...mensagens.map(m => ({
                role: m.papel,
                content: m.conteudo,
            })),
        ];

        this._abortController = new AbortController();

        try {
            const url = usandoChaveGlobal ? '/api/chat' : 'https://openrouter.ai/api/v1/chat/completions';
            const headers = {
                'Content-Type': 'application/json'
            };
            if (!usandoChaveGlobal) {
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['HTTP-Referer'] = window.location.origin;
                headers['X-Title'] = 'NexChat';
            }

            const resposta = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    modelo: modelo,
                    mensagens: mensagensFormatadas,
                    temperatura,
                    maxTokens,
                    ...(usandoChaveGlobal ? {} : {
                        model: modelo,
                        messages: mensagensFormatadas,
                        temperature: temperatura,
                        max_tokens: maxTokens,
                        stream: false
                    })
                }),
                signal: this._abortController.signal,
            });

            if (!resposta.ok) {
                const erroDados = await resposta.json().catch(() => ({}));
                throw new Error(erroDados.erro || `Erro na API: ${resposta.statusText}`);
            }

            const dados = await resposta.json();
            return {
                conteudo: dados.choices[0].message.content,
                modelo: dados.model,
                uso: dados.usage,
            };
        } catch (erro) {
            if (erro.name === 'AbortError') {
                throw new Error('Requisição cancelada.');
            }
            throw erro;
        } finally {
            this._abortController = null;
        }
    },

    /**
     * Envia mensagem com streaming (SSE)
     */
    async enviarMensagemStream(mensagens, modelo, callbackChunk, opcoes = {}) {
        const usandoChaveGlobal = this._chaveGlobalAtiva;
        const apiKey = usandoChaveGlobal ? 'backend-managed' : armazenamentoServico.obterApiKey();
        
        if (!apiKey) {
            throw new Error('Configure sua API key do OpenRouter nas configurações.');
        }

        const temperatura = opcoes.temperatura ?? armazenamentoServico.obterTemperatura();
        const maxTokens = opcoes.maxTokens ?? armazenamentoServico.obterMaxTokens();
        const promptSistema = this._obterSystemPromptDinamico();

        const mensagensFormatadas = [
            { role: 'system', content: promptSistema },
            ...mensagens.map(m => ({
                role: m.papel,
                content: m.conteudo,
            })),
        ];

        this._abortController = new AbortController();

        try {
            const url = usandoChaveGlobal ? '/api/chat' : 'https://openrouter.ai/api/v1/chat/completions';
            const headers = {
                'Content-Type': 'application/json'
            };
            if (!usandoChaveGlobal) {
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['HTTP-Referer'] = window.location.origin;
                headers['X-OpenRouter-Title'] = 'NexChat';
            }

            const resposta = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    modelo: modelo,
                    mensagens: mensagensFormatadas,
                    temperatura,
                    maxTokens,
                    ...(usandoChaveGlobal ? {} : {
                        model: modelo,
                        messages: mensagensFormatadas,
                        temperature: temperatura,
                        max_tokens: maxTokens,
                        stream: true
                    })
                }),
                signal: this._abortController.signal,
            });

            if (!resposta.ok) {
                const erro = await resposta.json().catch(() => ({}));
                throw new Error(erro.erro || erro.error?.message || `Erro ${resposta.status}: ${resposta.statusText}`);
            }

            const leitor = resposta.body.getReader();
            const decodificador = new TextDecoder();
            let conteudoCompleto = '';
            let buffer = '';

            while (true) {
                const { done, value } = await leitor.read();
                if (done) break;

                buffer += decodificador.decode(value, { stream: true });
                const linhas = buffer.split('\n');
                buffer = linhas.pop() || '';

                for (const linha of linhas) {
                    const linhaTrimada = linha.trim();
                    if (!linhaTrimada || !linhaTrimada.startsWith('data: ')) continue;
                    
                    const dados = linhaTrimada.slice(6);
                    if (dados === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(dados);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                            conteudoCompleto += delta;
                            callbackChunk(delta, conteudoCompleto);
                        }
                    } catch (erroJson) {
                        // Ignora linhas mal formadas
                    }
                }
            }

            return { conteudo: conteudoCompleto };
        } catch (erro) {
            if (erro.name === 'AbortError') {
                throw new Error('Requisição cancelada.');
            }
            throw erro;
        }
    },

    /**
     * Busca os modelos diretamente da API do OpenRouter e filtra os gratuitos
     */
    async obterModelosGratuitos() {
        try {
            const resposta = await fetch('https://openrouter.ai/api/v1/models');
            if (!resposta.ok) throw new Error('Não foi possível carregar os modelos.');
            
            const { data } = await resposta.json();
            
            // Filtra os modelos onde o preço é gratuito (input e output === 0)
            const modelosGratuitos = data.filter(model => {
                const promptCost = parseFloat(model.pricing?.prompt || '0');
                const completionCost = parseFloat(model.pricing?.completion || '0');
                return promptCost === 0 && completionCost === 0;
            });

            // Mapeia para o formato do nosso app
            const mapeados = modelosGratuitos.map(m => ({
                id: m.id,
                nome: m.name,
                descricao: m.description || 'Modelo de IA gratuito no OpenRouter',
                categoria: this._obterCategoriaPorId(m.id),
                icone: this._obterIconePorCategoria(m.id)
            }));

            // Adiciona o roteador automático gratuito no início
            return [
                {
                    id: 'openrouter/free',
                    nome: 'Auto (Modelo Gratuito Aleatório)',
                    descricao: 'O OpenRouter escolhe automaticamente um modelo gratuito online para você',
                    categoria: 'OpenRouter',
                    icone: '✨'
                },
                ...mapeados
            ];
        } catch (erro) {
            console.error('Erro ao buscar modelos do OpenRouter:', erro);
            // Retorna fallback local
            return MODELOS_DISPONIVEIS;
        }
    },

    _obterCategoriaPorId(modelId) {
        const partes = modelId.split('/');
        if (partes.length < 2) return 'Outros';
        
        const org = partes[0].toLowerCase();
        if (org.includes('deepseek')) return 'DeepSeek';
        if (org.includes('meta') || org.includes('llama')) return 'Meta Llama';
        if (org.includes('qwen') || org.includes('alibaba')) return 'Qwen';
        if (org.includes('google')) return 'Google';
        if (org.includes('nvidia') || org.includes('nemotron')) return 'NVIDIA';
        if (org.includes('microsoft') || org.includes('phi')) return 'Microsoft';
        if (org.includes('mistral')) return 'Mistral';
        
        // Capitaliza primeira letra
        return partes[0].charAt(0).toUpperCase() + partes[0].slice(1);
    },

    _obterIconePorCategoria(modelId) {
        const idLower = modelId.toLowerCase();
        if (idLower.includes('deepseek')) return '🧠';
        if (idLower.includes('llama')) return '🦙';
        if (idLower.includes('qwen')) return '🌐';
        if (idLower.includes('gemma') || idLower.includes('google')) return '💎';
        if (idLower.includes('mistral')) return '🌊';
        if (idLower.includes('phi') || idLower.includes('microsoft')) return '🔬';
        if (idLower.includes('nvidia') || idLower.includes('nemotron')) return '🎮';
        return '🤖';
    },

    _obterSystemPromptDinamico() {
        const promptBase = armazenamentoServico.obterPromptSistema();
        const configLoja = bancoDeDadosServico.obterConfiguracoesLoja();
        const produtos = bancoDeDadosServico.obterProdutos();
        
        // Formata o catálogo de produtos em Markdown
        let catalogoMarkdown = '';
        produtos.forEach(p => {
            const precoExibido = p.precoPromocional ? `R$ ${p.precoPromocional.toFixed(2)} (Preço Original: R$ ${p.preco.toFixed(2)})` : `R$ ${p.preco.toFixed(2)}`;
            catalogoMarkdown += `\n- **Produto**: ${p.nome}\n  - **Preço**: ${precoExibido}\n  - **Prazo de Entrega**: ${p.prazoEntrega}\n  - **Descrição**: ${p.descricao}\n`;
            if (p.gatilhosVenda) {
                catalogoMarkdown += `  - **Destaque/Gatilho**: ${p.gatilhosVenda}\n`;
            }
        });

        // Táticas de acordo com a personalidade
        let diretrizesVendas = '';
        const modo = configLoja.personalidadeAtiva;
        if (modo === 'persuasivo_extremo') {
            diretrizesVendas = `
- **Personalidade**: Lobo das Vendas (Persuasivo Extremo).
- **Diretrizes**:
  1. Sempre enfatize a alta procura e o estoque limitado ("últimas unidades", "vai acabar rápido").
  2. Use o gatilho da escassez e da exclusividade.
  3. Destaque os benefícios emocionais imediatos que o produto oferece.
  4. Quando o cliente estiver indeciso, crie urgência ("Se fechar agora, garanto o envio no próximo lote").
`;
        } else if (modo === 'consultivo') {
            diretrizesVendas = `
- **Personalidade**: Consultor Amigável (Vendedor Empático).
- **Diretrizes**:
  1. Faça perguntas abertas para entender a dor e a necessidade real do cliente antes de propor um produto.
  2. Mostre empatia genuína, chame o cliente pelo nome e use tom caloroso e prestativo.
  3. Conecte as características técnicas do produto diretamente à solução do problema relatado pelo cliente.
  4. Seja muito paciente e focado em construir relacionamento de longo prazo.
`;
        } else if (modo === 'direto') {
            diretrizesVendas = `
- **Personalidade**: Negociador Objetivo.
- **Diretrizes**:
  1. Seja extremamente focado em dados, especificações técnicas e custo-benefício.
  2. Evite rodeios ou conversas informais longas; vá direto ao ponto e responda objetivamente.
  3. Destaque os prazos rápidos de entrega e o valor justo.
  4. Diga fatos claros e ajude o cliente a tomar uma decisão baseada em lógica.
`;
        } else if (modo === 'descontos') {
            diretrizesVendas = `
- **Personalidade**: Caçador de Descontos.
- **Diretrizes**:
  1. Se o cliente hesitar pelo preço, ofereça o cupom especial ativo da loja: **${configLoja.cupomDesconto}**!
  2. Sempre enfatize a relação custo-benefício incrível e o desconto exclusivo.
  3. Crie bônus imaginários ou ofertas irresistíveis ("Esse é o melhor preço do ano", "Desconto de lançamento").
`;
        }

        return `
${promptBase}

---
CONTEXTO DE VENDAS DO BANCO DE DADOS:
Você é o assistente virtual da loja **"${configLoja.nomeLoja}"**. Embora você represente a loja e tenha o catálogo em mãos, **VOCÊ É 100% LIVRE para conversar sobre ABSOLUTAMENTE QUALQUER assunto** que o usuário trouxer (seja programação, piadas, curiosidades científicas, história, conselhos ou desabafos). Nunca diga que não pode falar sobre outros assuntos ou que seu foco é apenas vender!

**Garantia Global da Loja**: ${configLoja.garantiaPadrao}
**Cupom Geral Ativo**: ${configLoja.cupomDesconto ? `"${configLoja.cupomDesconto}"` : 'Nenhum cupom ativo no momento'}

**DIRETRIZES DE COMPORTAMENTO**:
${diretrizesVendas}
- **Liberdade Total de Temas**: Se o usuário te perguntar sobre algo que não tem nada a ver com a loja, responda de forma completa, brilhante e super útil! Se houver uma oportunidade natural, sutil e descontraída, faça uma brincadeira ou uma ponte leve ligando o assunto a algum produto nosso (ex: se ele pedir uma piada, você conta, e diz que rir faz tão bem quanto a qualidade de som do NexPod Max!). Mas se não couber, apenas seja o melhor assistente geral que ele já viu!
- **Regra de Ouro para Saudações**: Se o cliente apenas disser "oi", "olá", "bom dia" ou saudações simples, **NUNCA** responda com uma frase genérica e fria como "Olá, como posso ajudar?". Em vez disso:
  1. Cumprimente com entusiasmo contagiante usando a voz da sua **Personalidade Ativa**.
  2. Apresente-se orgulhosamente como assistente da **"${configLoja.nomeLoja}"**.
  3. Cite brevemente que hoje a loja está com condições incríveis de frete/desconto e cite um dos produtos mais desejados do catálogo (ex: "o incrível NexWatch Pro" ou "o revolucionário NexPod Max") para despertar curiosidade imediata!
  4. Termine com uma pergunta instigante ou oferecendo opções claras para iniciar a negociação.
- Mantenha a conversa livre, extremamente humana, divertida e cativante. Use emojis estrategicamente, ria se apropriado, e trate o cliente com proximidade e exclusividade.
- Use sempre português do Brasil impecável, formatado em Markdown premium (negritos, listas e tabelas se necessário) para tornar as respostas visualmente fascinantes.
- Se o cliente perguntar sobre especificações, preços ou prazos dos produtos, consulte estritamente o catálogo abaixo. Nunca invente preços ou prazos que não estejam definidos aqui.

**CATÁLOGO DE PRODUTOS DA LOJA (Consulte sempre que necessário)**:
${catalogoMarkdown}
---
`;
    },

    /**
     * Cancela a requisição em andamento
     */
    cancelar() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    },
};
