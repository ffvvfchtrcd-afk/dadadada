/* ============================================
   NEXCHAT - Componente Painel da Loja
   Gerenciamento interativo de produtos e vendas
   ============================================ */

const painelLoja = {
    _elementos: null,
    _produtoEditandoId: null,

    /**
     * Inicializa o painel da loja
     */
    inicializar() {
        this._elementos = {
            modal: document.getElementById('modal-loja'),
            botaoAbrir: document.getElementById('botao-abrir-loja'),
            botaoFechar: document.getElementById('fechar-modal-loja'),
            listaProdutos: document.getElementById('loja-lista-produtos'),
            seletorPersonalidade: document.getElementById('seletor-personalidade'),
            
            // Formulário de Configuração Geral
            inputNomeLoja: document.getElementById('loja-nome-input'),
            inputCupom: document.getElementById('loja-cupom-input'),
            inputGarantia: document.getElementById('loja-garantia-input'),
            
            // Formulário de Produto
            formProduto: document.getElementById('form-produto-loja'),
            inputProdNome: document.getElementById('prod-nome'),
            inputProdPreco: document.getElementById('prod-preco'),
            inputProdPromo: document.getElementById('prod-promo'),
            inputProdPrazo: document.getElementById('prod-prazo'),
            inputProdDesc: document.getElementById('prod-desc'),
            inputProdGatilhos: document.getElementById('prod-gatilhos'),
            
            botaoCancelarEdicao: document.getElementById('botao-cancelar-edicao-produto'),
            botaoSalvarProduto: document.getElementById('botao-salvar-produto'),
        };

        this._configurarEventos();
        this._carregarConfiguracoes();
        this._renderizarProdutos();
        this._renderizarPersonalidades();
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

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._elementos.modal.style.display !== 'none') {
                this.fechar();
            }
        });

        // Salvar configurações gerais ao sair dos inputs
        const salvarConfig = () => this._salvarConfiguracoesGerais();
        this._elementos.inputNomeLoja.addEventListener('change', salvarConfig);
        this._elementos.inputCupom.addEventListener('change', salvarConfig);
        this._elementos.inputGarantia.addEventListener('change', salvarConfig);

        // Cancelar edição de produto
        this._elementos.botaoCancelarEdicao.addEventListener('click', () => this._cancelarEdicao());

        // Submeter formulário de produto
        this._elementos.formProduto.addEventListener('submit', (e) => {
            e.preventDefault();
            this._salvarProduto();
        });
    },

    /**
     * Abre o modal
     */
    abrir() {
        this._elementos.modal.style.display = 'flex';
        this._carregarConfiguracoes();
        this._renderizarProdutos();
        this._cancelarEdicao();
    },

    /**
     * Fecha o modal
     */
    fechar() {
        this._elementos.modal.style.display = 'none';
    },

    /**
     * Carrega as configurações gerais da loja nos campos
     */
    _carregarConfiguracoes() {
        const config = bancoDeDadosServico.obterConfiguracoesLoja();
        this._elementos.inputNomeLoja.value = config.nomeLoja;
        this._elementos.inputCupom.value = config.cupomDesconto;
        this._elementos.inputGarantia.value = config.garantiaPadrao;
    },

    /**
     * Salva as configurações gerais da loja
     */
    _salvarConfiguracoesGerais() {
        const config = bancoDeDadosServico.obterConfiguracoesLoja();
        config.nomeLoja = this._elementos.inputNomeLoja.value.trim() || CONFIG_LOJA_PADRAO.nomeLoja;
        config.cupomDesconto = this._elementos.inputCupom.value.trim().toUpperCase();
        config.garantiaPadrao = this._elementos.inputGarantia.value.trim();
        
        bancoDeDadosServico.salvarConfiguracoesLoja(config);
        toastSucesso('Configurações da loja atualizadas!');
    },

    /**
     * Renderiza a lista de produtos cadastrados
     */
    _renderizarProdutos() {
        const produtos = bancoDeDadosServico.obterProdutos();
        
        if (produtos.length === 0) {
            this._elementos.listaProdutos.innerHTML = `
                <div class="lista-vazia" style="padding: 24px; text-align: center;">
                    <p style="color: var(--cor-texto-secundario); font-size: 13px;">Nenhum produto cadastrado na loja</p>
                </div>
            `;
            return;
        }

        this._elementos.listaProdutos.innerHTML = produtos.map(prod => `
            <div class="produto-card">
                <div class="produto-card-info">
                    <span class="produto-card-nome">${escaparHtml(prod.nome)}</span>
                    <div class="produto-card-valores">
                        <span class="produto-card-preco">R$ ${prod.precoPromocional ? prod.precoPromocional.toFixed(2) : prod.preco.toFixed(2)}</span>
                        ${prod.precoPromocional ? `<span style="text-decoration: line-through; opacity: 0.4; font-size: 11px;">R$ ${prod.preco.toFixed(2)}</span>` : ''}
                        <span class="produto-card-prazo">🚚 ${escaparHtml(prod.prazoEntrega.split('|')[0].trim())}</span>
                    </div>
                </div>
                <div class="produto-card-acoes">
                    <button class="botao-acao-produto" onclick="painelLoja.editarProduto('${prod.id}')" title="Editar produto">
                        ✏️
                    </button>
                    <button class="botao-acao-produto deletar" onclick="painelLoja.deletarProduto('${prod.id}')" title="Excluir produto">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Renderiza as opções de personalidades de vendas
     */
    _renderizarPersonalidades() {
        const personalidades = bancoDeDadosServico.obterPersonalidades();
        const config = bancoDeDadosServico.obterConfiguracoesLoja();
        const ativa = config.personalidadeAtiva;

        this._elementos.seletorPersonalidade.innerHTML = Object.values(personalidades).map(p => {
            const selecionada = p.id === ativa;
            return `
                <div class="opcao-personalidade-loja ${selecionada ? 'selecionada' : ''}" 
                     onclick="painelLoja.selecionarPersonalidade('${p.id}')">
                    <span class="personalidade-titulo">
                        ${p.id === 'persuasivo_extremo' ? '🐺' : p.id === 'consultivo' ? '🤝' : p.id === 'direto' ? '🎯' : '🏷️'} 
                        ${p.nome}
                    </span>
                    <span class="personalidade-descricao">${p.descricao}</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Altera a personalidade de vendas da IA
     */
    selecionarPersonalidade(id) {
        const config = bancoDeDadosServico.obterConfiguracoesLoja();
        config.personalidadeAtiva = id;
        bancoDeDadosServico.salvarConfiguracoesLoja(config);
        
        this._renderizarPersonalidades();
        
        const personalidades = bancoDeDadosServico.obterPersonalidades();
        toastSucesso(`Modo de vendas alterado: ${personalidades[id.toUpperCase()].nome}`);
    },

    /**
     * Inicia a edição de um produto
     */
    editarProduto(id) {
        const produtos = bancoDeDadosServico.obterProdutos();
        const produto = produtos.find(p => p.id === id);
        
        if (!produto) return;

        this._produtoEditandoId = id;
        this._elementos.inputProdNome.value = produto.nome;
        this._elementos.inputProdPreco.value = produto.preco;
        this._elementos.inputProdPromo.value = produto.precoPromocional || '';
        this._elementos.inputProdPrazo.value = produto.prazoEntrega;
        this._elementos.inputProdDesc.value = produto.descricao;
        this._elementos.inputProdGatilhos.value = produto.gatilhosVenda || '';

        // UI Feedback
        this._elementos.botaoSalvarProduto.textContent = 'Atualizar Produto';
        this._elementos.botaoCancelarEdicao.style.display = 'block';
        
        toastInfo(`Editando: ${produto.nome}`);
    },

    /**
     * Cancela a edição e limpa formulário
     */
    _cancelarEdicao() {
        this._produtoEditandoId = null;
        this._elementos.formProduto.reset();
        this._elementos.botaoSalvarProduto.textContent = 'Cadastrar Produto';
        this._elementos.botaoCancelarEdicao.style.display = 'none';
    },

    /**
     * Exclui um produto
     */
    deletarProduto(id) {
        if (!confirm('Deseja realmente excluir este produto?')) return;

        const deletado = bancoDeDadosServico.deletarProduto(id);
        if (deletado) {
            toastSucesso('Produto excluído com sucesso!');
            this._renderizarProdutos();
            if (this._produtoEditandoId === id) this._cancelarEdicao();
        } else {
            toastErro('Erro ao excluir produto');
        }
    },

    /**
     * Salva ou edita o produto
     */
    _salvarProduto() {
        const nome = this._elementos.inputProdNome.value.trim();
        const preco = parseFloat(this._elementos.inputProdPreco.value);
        const precoPromoRaw = this._elementos.inputProdPromo.value.trim();
        const precoPromocional = precoPromoRaw ? parseFloat(precoPromoRaw) : null;
        const prazoEntrega = this._elementos.inputProdPrazo.value.trim();
        const descricao = this._elementos.inputProdDesc.value.trim();
        const gatilhosVenda = this._elementos.inputProdGatilhos.value.trim();

        if (!nome || isNaN(preco) || !prazoEntrega || !descricao) {
            toastErro('Preencha os campos obrigatórios!');
            return;
        }

        const produto = {
            id: this._produtoEditandoId || 'prod_' + gerarId(),
            nome,
            preco,
            precoPromocional,
            prazoEntrega,
            descricao,
            gatilhosVenda
        };

        const sucesso = bancoDeDadosServico.salvarProduto(produto);
        if (sucesso) {
            toastSucesso(this._produtoEditandoId ? 'Produto atualizado!' : 'Produto cadastrado com sucesso!');
            this._cancelarEdicao();
            this._renderizarProdutos();
        } else {
            toastErro('Erro ao salvar produto');
        }
    }
};
