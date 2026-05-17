/* ============================================
   NEXCHAT - Componente Barra Lateral
   Gerencia conversas na barra lateral
   ============================================ */

const barraLateral = {
    _elementos: null,

    /**
     * Inicializa a barra lateral
     */
    inicializar() {
        this._elementos = {
            barraLateral: document.getElementById('barra-lateral'),
            overlay: document.getElementById('overlay-barra-lateral'),
            botaoMenu: document.getElementById('botao-menu-mobile'),
            botaoNova: document.getElementById('botao-nova-conversa'),
            listaConversas: document.getElementById('lista-conversas'),
            campoBusca: document.getElementById('campo-busca-conversas'),
        };

        this._configurarEventos();
        this.renderizar();
    },

    /**
     * Configura os event listeners
     */
    _configurarEventos() {
        // Toggle mobile
        this._elementos.botaoMenu.addEventListener('click', () => this.toggle());
        this._elementos.overlay.addEventListener('click', () => this.fechar());

        // Nova conversa
        this._elementos.botaoNova.addEventListener('click', () => {
            chat.novaConversa();
            this.fechar();
        });

        // Busca
        this._elementos.campoBusca.addEventListener('input', debounce((e) => {
            this.renderizar(e.target.value);
        }, 200));
    },

    /**
     * Abre/fecha a barra lateral (mobile)
     */
    toggle() {
        const estaAberta = this._elementos.barraLateral.classList.contains('aberta');
        if (estaAberta) {
            this.fechar();
        } else {
            this.abrir();
        }
    },

    /**
     * Abre a barra lateral
     */
    abrir() {
        this._elementos.barraLateral.classList.add('aberta');
        this._elementos.overlay.classList.add('visivel');
    },

    /**
     * Fecha a barra lateral
     */
    fechar() {
        this._elementos.barraLateral.classList.remove('aberta');
        this._elementos.overlay.classList.remove('visivel');
    },

    /**
     * Renderiza a lista de conversas
     */
    renderizar(filtro = '') {
        const conversas = armazenamentoServico.obterConversas();
        const conversaAtiva = armazenamentoServico.obterConversaAtiva();

        // Filtra conversas
        const filtradas = filtro 
            ? conversas.filter(c => c.titulo.toLowerCase().includes(filtro.toLowerCase()))
            : conversas;

        // Ordena por data (mais recente primeiro)
        filtradas.sort((a, b) => b.atualizadoEm - a.atualizadoEm);

        if (filtradas.length === 0) {
            this._elementos.listaConversas.innerHTML = `
                <div class="lista-vazia">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p>${filtro ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</p>
                </div>
            `;
            return;
        }

        this._elementos.listaConversas.innerHTML = filtradas.map(conversa => `
            <div class="conversa-item ${conversa.id === conversaAtiva ? 'ativa' : ''}" 
                 data-id="${conversa.id}"
                 onclick="barraLateral.selecionarConversa('${conversa.id}')">
                <div class="conversa-item-icone">💬</div>
                <div class="conversa-item-info">
                    <div class="conversa-item-titulo">${escaparHtml(conversa.titulo)}</div>
                    <div class="conversa-item-preview">${formatarHora(conversa.atualizadoEm)}</div>
                </div>
                <div class="conversa-item-acoes">
                    <button class="botao-excluir-conversa" 
                            onclick="event.stopPropagation(); barraLateral.excluirConversa('${conversa.id}')"
                            title="Excluir conversa">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Seleciona uma conversa existente
     */
    selecionarConversa(id) {
        chat.carregarConversa(id);
        this.renderizar();
        this.fechar();
    },

    /**
     * Exclui uma conversa
     */
    excluirConversa(id) {
        const conversas = armazenamentoServico.obterConversas();
        const novasConversas = conversas.filter(c => c.id !== id);
        armazenamentoServico.salvarConversas(novasConversas);

        // Se excluiu a ativa, cria nova
        if (armazenamentoServico.obterConversaAtiva() === id) {
            armazenamentoServico.salvarConversaAtiva('');
            chat.novaConversa();
        }

        this.renderizar();
        toastInfo('Conversa excluída');
    },
};
