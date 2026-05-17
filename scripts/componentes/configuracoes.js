/* ============================================
   NEXCHAT - Componente Configurações
   Modal de configurações do sistema
   ============================================ */

const configuracoes = {
    _elementos: null,

    /**
     * Inicializa as configurações
     */
    inicializar() {
        this._elementos = {
            modal: document.getElementById('modal-configuracoes'),
            botaoAbrir: document.getElementById('botao-configuracoes'),
            botaoFechar: document.getElementById('fechar-modal-configuracoes'),
            campoApiKey: document.getElementById('campo-api-key'),
            botaoVerApi: document.getElementById('botao-ver-api'),
            botaoSalvarApi: document.getElementById('botao-salvar-api'),
            campoPromptSistema: document.getElementById('campo-prompt-sistema'),
            sliderTemperatura: document.getElementById('slider-temperatura'),
            valorTemperatura: document.getElementById('valor-temperatura'),
            sliderMaxTokens: document.getElementById('slider-max-tokens'),
            valorMaxTokens: document.getElementById('valor-max-tokens'),
            toggleStreaming: document.getElementById('toggle-streaming'),
            botaoLimpar: document.getElementById('botao-limpar-dados'),
        };

        this._carregarValores();
        this._configurarEventos();
    },

    /**
     * Carrega valores salvos nos campos
     */
    _carregarValores() {
        const chaveGlobal = openrouterServico.obterChaveGlobalAtiva();
        
        if (chaveGlobal) {
            this._elementos.campoApiKey.value = '';
            this._elementos.campoApiKey.placeholder = '🔑 Chave Ativa no Servidor (Livre)';
            this._elementos.campoApiKey.disabled = true;
            this._elementos.botaoSalvarApi.disabled = true;
            this._elementos.botaoSalvarApi.textContent = 'Chave Global Ativa';
            this._elementos.botaoSalvarApi.style.opacity = '0.5';
            this._elementos.botaoSalvarApi.style.cursor = 'not-allowed';
        } else {
            const apiKey = armazenamentoServico.obterApiKey();
            this._elementos.campoApiKey.disabled = false;
            this._elementos.botaoSalvarApi.disabled = false;
            this._elementos.botaoSalvarApi.textContent = 'Salvar Chave';
            this._elementos.botaoSalvarApi.style.opacity = '1';
            this._elementos.botaoSalvarApi.style.cursor = 'pointer';
            this._elementos.campoApiKey.placeholder = 'sk-or-v1-...';
            if (apiKey) {
                this._elementos.campoApiKey.value = apiKey;
            }
        }

        this._elementos.campoPromptSistema.value = armazenamentoServico.obterPromptSistema();
        
        const temperatura = armazenamentoServico.obterTemperatura();
        this._elementos.sliderTemperatura.value = temperatura;
        this._elementos.valorTemperatura.textContent = temperatura;

        const maxTokens = armazenamentoServico.obterMaxTokens();
        this._elementos.sliderMaxTokens.value = maxTokens;
        this._elementos.valorMaxTokens.textContent = maxTokens;

        this._elementos.toggleStreaming.checked = armazenamentoServico.obterStreaming();
    },

    /**
     * Configura event listeners
     */
    _configurarEventos() {
        // Abrir/Fechar modal
        this._elementos.botaoAbrir.addEventListener('click', () => this.abrir());
        this._elementos.botaoFechar.addEventListener('click', () => this.fechar());
        this._elementos.modal.addEventListener('click', (e) => {
            if (e.target === this._elementos.modal) this.fechar();
        });

        // Toggle visibilidade da API key
        this._elementos.botaoVerApi.addEventListener('click', () => {
            const campo = this._elementos.campoApiKey;
            campo.type = campo.type === 'password' ? 'text' : 'password';
        });

        // Salvar API key
        this._elementos.botaoSalvarApi.addEventListener('click', () => this._salvarApiKey());

        // Prompt do sistema (salva ao sair do campo)
        this._elementos.campoPromptSistema.addEventListener('change', () => {
            armazenamentoServico.salvarPromptSistema(this._elementos.campoPromptSistema.value);
            toastSucesso('Prompt do sistema salvo');
        });

        // Temperatura
        this._elementos.sliderTemperatura.addEventListener('input', (e) => {
            const valor = parseFloat(e.target.value);
            this._elementos.valorTemperatura.textContent = valor;
            armazenamentoServico.salvarTemperatura(valor);
        });

        // Max tokens
        this._elementos.sliderMaxTokens.addEventListener('input', (e) => {
            const valor = parseInt(e.target.value);
            this._elementos.valorMaxTokens.textContent = valor;
            armazenamentoServico.salvarMaxTokens(valor);
        });

        // Streaming
        this._elementos.toggleStreaming.addEventListener('change', (e) => {
            armazenamentoServico.salvarStreaming(e.target.checked);
            toastInfo(`Streaming ${e.target.checked ? 'ativado' : 'desativado'}`);
        });

        // Limpar dados
        this._elementos.botaoLimpar.addEventListener('click', () => this._limparDados());

        // ESC para fechar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._elementos.modal.style.display !== 'none') {
                this.fechar();
            }
        });
    },

    /**
     * Abre o modal de configurações
     */
    abrir() {
        this._carregarValores();
        this._elementos.modal.style.display = 'flex';
    },

    /**
     * Fecha o modal de configurações
     */
    fechar() {
        this._elementos.modal.style.display = 'none';
    },

    /**
     * Salva a API key
     */
    _salvarApiKey() {
        const chave = this._elementos.campoApiKey.value.trim();
        
        if (!chave) {
            toastErro('Insira uma API key válida');
            return;
        }

        if (!chave.startsWith('sk-or-')) {
            toastErro('A chave deve começar com "sk-or-"');
            return;
        }

        armazenamentoServico.salvarApiKey(chave);
        toastSucesso('API key salva com sucesso!');
    },

    /**
     * Limpa todos os dados
     */
    _limparDados() {
        if (!confirm('Tem certeza? Isso irá apagar todas as conversas e configurações.')) {
            return;
        }

        armazenamentoServico.limparTudo();
        toastInfo('Todos os dados foram limpos');
        
        // Recarrega a página
        setTimeout(() => window.location.reload(), 500);
    },
};
