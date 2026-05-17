/* ============================================
   NEXCHAT - Serviço de Armazenamento
   Persistência no localStorage
   ============================================ */

const armazenamentoServico = {
    /**
     * Salva a API key
     */
    salvarApiKey(chave) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.API_KEY, chave);
            return true;
        } catch (erro) {
            console.error('Erro ao salvar API key:', erro);
            return false;
        }
    },

    /**
     * Obtém a API key
     */
    obterApiKey() {
        try {
            return localStorage.getItem(CHAVES_ARMAZENAMENTO.API_KEY) || '';
        } catch (erro) {
            console.error('Erro ao obter API key:', erro);
            return '';
        }
    },

    /**
     * Salva todas as conversas
     */
    salvarConversas(conversas) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.CONVERSAS, JSON.stringify(conversas));
            return true;
        } catch (erro) {
            console.error('Erro ao salvar conversas:', erro);
            return false;
        }
    },

    /**
     * Obtém todas as conversas
     */
    obterConversas() {
        try {
            const dados = localStorage.getItem(CHAVES_ARMAZENAMENTO.CONVERSAS);
            return dados ? JSON.parse(dados) : [];
        } catch (erro) {
            console.error('Erro ao obter conversas:', erro);
            return [];
        }
    },

    /**
     * Salva o ID da conversa ativa
     */
    salvarConversaAtiva(id) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.CONVERSA_ATIVA, id || '');
        } catch (erro) {
            console.error('Erro ao salvar conversa ativa:', erro);
        }
    },

    /**
     * Obtém o ID da conversa ativa
     */
    obterConversaAtiva() {
        try {
            return localStorage.getItem(CHAVES_ARMAZENAMENTO.CONVERSA_ATIVA) || '';
        } catch (erro) {
            return '';
        }
    },

    /**
     * Salva o modelo selecionado
     */
    salvarModelo(modeloId) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.MODELO_SELECIONADO, modeloId);
        } catch (erro) {
            console.error('Erro ao salvar modelo:', erro);
        }
    },

    /**
     * Obtém o modelo selecionado
     */
    obterModelo() {
        try {
            return localStorage.getItem(CHAVES_ARMAZENAMENTO.MODELO_SELECIONADO) || 'openrouter/free';
        } catch (erro) {
            return 'openrouter/free';
        }
    },

    /**
     * Salva o prompt do sistema
     */
    salvarPromptSistema(prompt) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.PROMPT_SISTEMA, prompt);
        } catch (erro) {
            console.error('Erro ao salvar prompt:', erro);
        }
    },

    /**
     * Obtém o prompt do sistema
     */
    obterPromptSistema() {
        try {
            return localStorage.getItem(CHAVES_ARMAZENAMENTO.PROMPT_SISTEMA) || CONFIGURACAO_PADRAO.promptSistema;
        } catch (erro) {
            return CONFIGURACAO_PADRAO.promptSistema;
        }
    },

    /**
     * Salva a temperatura
     */
    salvarTemperatura(valor) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.TEMPERATURA, valor.toString());
        } catch (erro) {
            console.error('Erro ao salvar temperatura:', erro);
        }
    },

    /**
     * Obtém a temperatura
     */
    obterTemperatura() {
        try {
            const valor = localStorage.getItem(CHAVES_ARMAZENAMENTO.TEMPERATURA);
            return valor !== null ? parseFloat(valor) : CONFIGURACAO_PADRAO.temperatura;
        } catch (erro) {
            return CONFIGURACAO_PADRAO.temperatura;
        }
    },

    /**
     * Salva max tokens
     */
    salvarMaxTokens(valor) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.MAX_TOKENS, valor.toString());
        } catch (erro) {
            console.error('Erro ao salvar max tokens:', erro);
        }
    },

    /**
     * Obtém max tokens
     */
    obterMaxTokens() {
        try {
            const valor = localStorage.getItem(CHAVES_ARMAZENAMENTO.MAX_TOKENS);
            return valor !== null ? parseInt(valor) : CONFIGURACAO_PADRAO.maxTokens;
        } catch (erro) {
            return CONFIGURACAO_PADRAO.maxTokens;
        }
    },

    /**
     * Salva configuração de streaming
     */
    salvarStreaming(ativo) {
        try {
            localStorage.setItem(CHAVES_ARMAZENAMENTO.STREAMING, ativo ? 'true' : 'false');
        } catch (erro) {
            console.error('Erro ao salvar streaming:', erro);
        }
    },

    /**
     * Obtém configuração de streaming
     */
    obterStreaming() {
        try {
            const valor = localStorage.getItem(CHAVES_ARMAZENAMENTO.STREAMING);
            return valor !== null ? valor === 'true' : CONFIGURACAO_PADRAO.streaming;
        } catch (erro) {
            return CONFIGURACAO_PADRAO.streaming;
        }
    },

    /**
     * Limpa todos os dados
     */
    limparTudo() {
        try {
            Object.values(CHAVES_ARMAZENAMENTO).forEach(chave => {
                localStorage.removeItem(chave);
            });
            return true;
        } catch (erro) {
            console.error('Erro ao limpar dados:', erro);
            return false;
        }
    },
};
