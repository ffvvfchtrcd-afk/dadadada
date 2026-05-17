/* ============================================
   NEXCHAT - Componente Seletor de Modelo
   Modal para escolher o modelo de IA
   ============================================ */

const seletorModelo = {
    _elementos: null,
    _modelosCarregados: [],
    _carregando: false,

    /**
     * Inicializa o seletor de modelo
     */
    inicializar() {
        this._elementos = {
            modal: document.getElementById('modal-modelo'),
            botaoAbrir: document.getElementById('botao-selecionar-modelo'),
            botaoFechar: document.getElementById('fechar-modal-modelo'),
            campoBusca: document.getElementById('campo-busca-modelos'),
            listaModelos: document.getElementById('lista-modelos'),
            nomeModeloAtual: document.getElementById('nome-modelo-atual'),
            indicadorStatus: document.querySelector('.modelo-status-indicador'),
        };

        this._modelosCarregados = [...MODELOS_DISPONIVEIS];
        this._configurarEventos();
        this._atualizarModeloExibido();
        this._renderizarModelos();

        // Carrega modelos dinâmicos do OpenRouter em background
        this.carregarModelosDinamicamente();
    },

    /**
     * Configura event listeners
     */
    _configurarEventos() {
        this._elementos.botaoAbrir.addEventListener('click', () => this.abrir());
        this._elementos.botaoFechar.addEventListener('click', () => this.fechar());
        
        // Fechar ao clicar no overlay
        this._elementos.modal.addEventListener('click', (e) => {
            if (e.target === this._elementos.modal) this.fechar();
        });

        // Busca
        this._elementos.campoBusca.addEventListener('input', debounce((e) => {
            this._renderizarModelos(e.target.value);
        }, 200));

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._elementos.modal.style.display !== 'none') {
                this.fechar();
            }
        });
    },

    /**
     * Busca os modelos ativos na API do OpenRouter
     */
    async carregarModelosDinamicamente() {
        if (this._carregando) return;
        this._carregando = true;

        try {
            const modelos = await openrouterServico.obterModelosGratuitos();
            if (modelos && modelos.length > 0) {
                this._modelosCarregados = modelos;
                this._atualizarModeloExibido();
                this._renderizarModelos();
            }
        } catch (erro) {
            console.error('Erro ao carregar modelos:', erro);
        } finally {
            this._carregando = false;
        }
    },

    /**
     * Abre o modal
     */
    abrir() {
        this._elementos.modal.style.display = 'flex';
        this._elementos.campoBusca.value = '';
        this._elementos.campoBusca.focus();
        this._renderizarModelos();
        
        // Atualiza a lista sempre que abrir para pegar as últimas novidades online
        this.carregarModelosDinamicamente();
    },

    /**
     * Fecha o modal
     */
    fechar() {
        this._elementos.modal.style.display = 'none';
    },

    /**
     * Renderiza a lista de modelos
     */
    _renderizarModelos(filtro = '') {
        const modeloAtual = armazenamentoServico.obterModelo();
        
        // Filtra modelos
        let modelos = this._modelosCarregados.length > 0 ? this._modelosCarregados : MODELOS_DISPONIVEIS;
        if (filtro) {
            const filtroLower = filtro.toLowerCase();
            modelos = modelos.filter(m => 
                m.nome.toLowerCase().includes(filtroLower) || 
                m.descricao.toLowerCase().includes(filtroLower) ||
                m.categoria.toLowerCase().includes(filtroLower) ||
                m.id.toLowerCase().includes(filtroLower)
            );
        }

        // Agrupa por categoria
        const categorias = {};
        modelos.forEach(m => {
            if (!categorias[m.categoria]) categorias[m.categoria] = [];
            categorias[m.categoria].push(m);
        });

        if (modelos.length === 0) {
            this._elementos.listaModelos.innerHTML = `
                <div class="lista-vazia" style="padding: 40px;">
                    <p>Nenhum modelo gratuito online ou encontrado</p>
                </div>
            `;
            return;
        }

        let html = '';
        Object.entries(categorias).forEach(([categoria, lista]) => {
            html += `<div class="modelo-categoria">${categoria}</div>`;
            lista.forEach(modelo => {
                const selecionado = modelo.id === modeloAtual;
                html += `
                    <div class="modelo-item ${selecionado ? 'selecionado' : ''}" 
                         onclick="seletorModelo.selecionar('${modelo.id}')">
                        <div class="modelo-item-icone">${modelo.icone}</div>
                        <div class="modelo-item-info">
                            <div class="modelo-item-nome">${modelo.nome}</div>
                            <div class="modelo-item-desc">${modelo.descricao}</div>
                        </div>
                        <span class="modelo-item-badge">FREE</span>
                        <div class="modelo-item-check">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </div>
                `;
            });
        });

        this._elementos.listaModelos.innerHTML = html;
    },

    /**
     * Seleciona um modelo
     */
    selecionar(modeloId) {
        armazenamentoServico.salvarModelo(modeloId);
        this._atualizarModeloExibido();
        this._renderizarModelos();
        this.fechar();

        const lista = this._modelosCarregados.length > 0 ? this._modelosCarregados : MODELOS_DISPONIVEIS;
        const modelo = lista.find(m => m.id === modeloId);
        toastSucesso(`Modelo alterado: ${modelo?.nome || modeloId}`);
    },

    /**
     * Atualiza o nome do modelo exibido no cabeçalho
     */
    _atualizarModeloExibido() {
        const modeloId = armazenamentoServico.obterModelo();
        const lista = this._modelosCarregados.length > 0 ? this._modelosCarregados : MODELOS_DISPONIVEIS;
        const modelo = lista.find(m => m.id === modeloId);
        
        if (modelo) {
            this._elementos.nomeModeloAtual.textContent = `${modelo.icone} ${modelo.nome}`;
            this._elementos.indicadorStatus.classList.add('ativo');
        } else if (modeloId === 'openrouter/free') {
            this._elementos.nomeModeloAtual.textContent = '✨ Auto (Modelo Gratuito Aleatório)';
            this._elementos.indicadorStatus.classList.add('ativo');
        } else {
            // Busca parcial se for um ID retornado dinamicamente
            const partes = modeloId.split('/');
            const nomeSimples = partes.length > 1 ? partes[1].replace(':free', '') : modeloId;
            this._elementos.nomeModeloAtual.textContent = `🤖 ${nomeSimples}`;
            this._elementos.indicadorStatus.classList.add('ativo');
        }
    },
};
