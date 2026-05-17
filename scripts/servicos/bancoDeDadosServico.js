/* ============================================
   NEXCHAT - Serviço de Banco de Dados da Loja
   Gerencia produtos, preços, prazos e modo de venda
   ============================================ */

const CHAVES_LOJA = {
    PRODUTOS: 'nexchat_loja_produtos',
    CONFIGURACAO: 'nexchat_loja_configuracao'
};

const PERSONALIDADES_VENDAS = {
    PERSUASIVO_EXTREMO: {
        id: 'persuasivo_extremo',
        nome: 'Lobo das Vendas',
        descricao: 'Usa escassez, urgência e gatilhos mentais fortes para fechar a compra.'
    },
    CONSULTIVO: {
        id: 'consultivo',
        nome: 'Consultor Amigável',
        descricao: 'Foca em entender as dores do cliente, criar rapport e ajudar genuinamente.'
    },
    DIRETO: {
        id: 'direto',
        nome: 'Negociador Objetivo',
        descricao: 'Focado em custo-benefício, entrega rápida e dados técnicos diretos.'
    },
    DESCONTOS: {
        id: 'descontos',
        nome: 'Caçador de Descontos',
        descricao: 'Pronto para oferecer cupons especiais e bônus se o cliente hesitar.'
    }
};

const PRODUTOS_INICIAIS = [
    {
        id: 'prod_1',
        nome: 'NexPod Max (Fone Bluetooth)',
        preco: 299.90,
        precoPromocional: 249.90,
        prazoEntrega: 'Sedex: 2 a 4 dias úteis | Grátis: até 8 dias úteis',
        descricao: 'Fone de ouvido premium com cancelamento de ruído ativo, bateria de 40 horas e áudio espacial de alta fidelidade.',
        gatilhosVenda: 'Campeão de vendas da loja. Ideal para quem estuda, trabalha ou treina. Cancelamento de ruído isola 98% dos sons externos.'
    },
    {
        id: 'prod_2',
        nome: 'NexWatch Pro (Smartwatch)',
        preco: 599.00,
        precoPromocional: 499.00,
        prazoEntrega: 'Sedex: 1 a 3 dias úteis | Grátis: até 6 dias úteis',
        descricao: 'Relógio inteligente de alta performance com tela AMOLED, monitoramento de saúde 24/7 (cardíaco, oxigênio, sono) e GPS integrado.',
        gatilhosVenda: 'Estoque limitadíssimo devido à alta procura. Perfeito para manter a saúde e receber notificações sem tirar o celular do bolso. Resistente à água até 50m.'
    },
    {
        id: 'prod_3',
        nome: 'NexCharge Turbo (Carregador 65W)',
        preco: 149.90,
        precoPromocional: 119.90,
        prazoEntrega: 'Sedex: 3 a 5 dias úteis | Grátis: até 10 dias úteis',
        descricao: 'Carregador rápido GaN de 65W com 3 portas (2 USB-C + 1 USB-A). Compatível com notebooks, celulares e tablets.',
        gatilhosVenda: 'Carrega 60% da bateria do celular em apenas 20 minutos. Tecnologia GaN não esquenta e protege seus aparelhos contra surtos de energia.'
    }
];

const CONFIG_LOJA_PADRAO = {
    nomeLoja: 'NexTech Store',
    cupomDesconto: 'NEX10',
    garantiaPadrao: '12 meses de garantia de fábrica em todos os produtos',
    personalidadeAtiva: 'persuasivo_extremo'
};

const bancoDeDadosServico = {
    /**
     * Obtém todos os produtos cadastrados
     */
    obterProdutos() {
        try {
            const dados = localStorage.getItem(CHAVES_LOJA.PRODUTOS);
            if (!dados) {
                // Inicializa com produtos padrões se vazio
                this.salvarProdutos(PRODUTOS_INICIAIS);
                return PRODUTOS_INICIAIS;
            }
            return JSON.parse(dados);
        } catch (erro) {
            console.error('Erro ao obter produtos:', erro);
            return PRODUTOS_INICIAIS;
        }
    },

    /**
     * Salva a lista de produtos
     */
    salvarProdutos(produtos) {
        try {
            localStorage.setItem(CHAVES_LOJA.PRODUTOS, JSON.stringify(produtos));
            return true;
        } catch (erro) {
            console.error('Erro ao salvar produtos:', erro);
            return false;
        }
    },

    /**
     * Adiciona ou atualiza um produto
     */
    salvarProduto(produto) {
        try {
            const produtos = this.obterProdutos();
            const index = produtos.findIndex(p => p.id === produto.id);

            if (index >= 0) {
                produtos[index] = produto;
            } else {
                produtos.push(produto);
            }

            return this.salvarProdutos(produtos);
        } catch (erro) {
            console.error('Erro ao salvar produto:', erro);
            return false;
        }
    },

    /**
     * Remove um produto do banco de dados
     */
    deletarProduto(id) {
        try {
            const produtos = this.obterProdutos();
            const produtosFiltrados = produtos.filter(p => p.id !== id);
            return this.salvarProdutos(produtosFiltrados);
        } catch (erro) {
            console.error('Erro ao deletar produto:', erro);
            return false;
        }
    },

    /**
     * Obtém configurações gerais da loja
     */
    obterConfiguracoesLoja() {
        try {
            const dados = localStorage.getItem(CHAVES_LOJA.CONFIGURACAO);
            if (!dados) {
                this.salvarConfiguracoesLoja(CONFIG_LOJA_PADRAO);
                return CONFIG_LOJA_PADRAO;
            }
            return JSON.parse(dados);
        } catch (erro) {
            console.error('Erro ao obter configurações da loja:', erro);
            return CONFIG_LOJA_PADRAO;
        }
    },

    /**
     * Salva configurações gerais da loja
     */
    salvarConfiguracoesLoja(config) {
        try {
            localStorage.setItem(CHAVES_LOJA.CONFIGURACAO, JSON.stringify(config));
            return true;
        } catch (erro) {
            console.error('Erro ao salvar configurações da loja:', erro);
            return false;
        }
    },

    /**
     * Obtém a lista completa de personalidades disponíveis
     */
    obterPersonalidades() {
        return PERSONALIDADES_VENDAS;
    }
};
