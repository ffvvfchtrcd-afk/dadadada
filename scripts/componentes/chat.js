/* ============================================
   NEXCHAT - Componente Chat
   Gerencia mensagens e interação principal
   ============================================ */

const chat = {
    _elementos: null,
    _conversaAtual: null,
    _enviando: false,

    /**
     * Inicializa o chat
     */
    inicializar() {
        this._elementos = {
            areaMensagens: document.getElementById('area-mensagens'),
            containerMensagens: document.getElementById('container-mensagens'),
            telaBemVindo: document.getElementById('tela-boas-vindas'),
            campoMensagem: document.getElementById('campo-mensagem'),
            botaoEnviar: document.getElementById('botao-enviar'),
            contadorCaracteres: document.getElementById('contador-caracteres'),
        };

        this._configurarEventos();
        this._restaurarConversaAtiva();
    },

    /**
     * Configura event listeners
     */
    _configurarEventos() {
        // Enviar mensagem
        this._elementos.botaoEnviar.addEventListener('click', () => this._enviarMensagem());
        
        // Enter para enviar (Shift+Enter para nova linha)
        this._elementos.campoMensagem.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this._enviarMensagem();
            }
        });

        // Auto-resize do textarea
        this._elementos.campoMensagem.addEventListener('input', () => {
            this._autoResize();
            this._atualizarBotaoEnviar();
        });

        // Sugestões na tela de boas-vindas
        document.querySelectorAll('.sugestao-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this._elementos.campoMensagem.value = prompt;
                this._autoResize();
                this._atualizarBotaoEnviar();
                this._enviarMensagem();
            });
        });
    },

    /**
     * Auto-resize do textarea
     */
    _autoResize() {
        const campo = this._elementos.campoMensagem;
        campo.style.height = 'auto';
        campo.style.height = Math.min(campo.scrollHeight, 200) + 'px';
        
        // Atualiza contador
        const total = campo.value.length;
        this._elementos.contadorCaracteres.textContent = `${total} / 10000`;
    },

    /**
     * Atualiza estado do botão enviar
     */
    _atualizarBotaoEnviar() {
        const temTexto = this._elementos.campoMensagem.value.trim().length > 0;
        this._elementos.botaoEnviar.disabled = !temTexto || this._enviando;
    },

    /**
     * Restaura a conversa ativa salva
     */
    _restaurarConversaAtiva() {
        const idAtiva = armazenamentoServico.obterConversaAtiva();
        if (idAtiva) {
            this.carregarConversa(idAtiva);
        }
    },

    /**
     * Cria uma nova conversa
     */
    novaConversa() {
        this._conversaAtual = null;
        armazenamentoServico.salvarConversaAtiva('');
        this._mostrarBoasVindas();
        this._elementos.campoMensagem.value = '';
        this._elementos.campoMensagem.focus();
        this._autoResize();
        this._atualizarBotaoEnviar();
        barraLateral.renderizar();
    },

    /**
     * Carrega uma conversa existente
     */
    carregarConversa(id) {
        const conversas = armazenamentoServico.obterConversas();
        const conversa = conversas.find(c => c.id === id);
        
        if (!conversa) {
            toastErro('Conversa não encontrada');
            return;
        }

        this._conversaAtual = conversa;
        armazenamentoServico.salvarConversaAtiva(id);
        this._renderizarMensagens();
        barraLateral.renderizar();
    },

    /**
     * Mostra a tela de boas-vindas
     */
    _mostrarBoasVindas() {
        this._elementos.telaBemVindo.style.display = 'flex';
        this._elementos.containerMensagens.style.display = 'none';
        this._elementos.containerMensagens.innerHTML = '';
    },

    /**
     * Esconde a tela de boas-vindas e mostra o chat
     */
    _mostrarChat() {
        this._elementos.telaBemVindo.style.display = 'none';
        this._elementos.containerMensagens.style.display = 'flex';
    },

    /**
     * Renderiza todas as mensagens da conversa ativa
     */
    _renderizarMensagens() {
        if (!this._conversaAtual || !this._conversaAtual.mensagens.length) {
            this._mostrarBoasVindas();
            return;
        }

        this._mostrarChat();
        this._elementos.containerMensagens.innerHTML = '';

        this._conversaAtual.mensagens.forEach(msg => {
            this._adicionarMensagemAoDOM(msg);
        });

        rolarParaFinal(this._elementos.areaMensagens);
    },

    /**
     * Adiciona uma mensagem no DOM
     */
    _adicionarMensagemAoDOM(mensagem) {
        const div = document.createElement('div');
        const ehUsuario = mensagem.papel === 'user';
        
        div.className = `mensagem ${ehUsuario ? 'mensagem-usuario' : 'mensagem-assistente'}`;
        div.id = `msg_${mensagem.id}`;

        const conteudoHtml = ehUsuario 
            ? `<p>${escaparHtml(mensagem.conteudo).replace(/\n/g, '<br>')}</p>`
            : markdownServico.converter(mensagem.conteudo);

        div.innerHTML = `
            <div class="mensagem-avatar">
                ${ehUsuario ? '👤' : '🤖'}
            </div>
            <div class="mensagem-conteudo">
                <div class="mensagem-cabecalho">
                    <span class="mensagem-nome">${ehUsuario ? 'Você' : 'IA'}</span>
                    <span class="mensagem-hora">${formatarHora(mensagem.timestamp)}</span>
                </div>
                <div class="mensagem-texto">${conteudoHtml}</div>
                <div class="mensagem-acoes">
                    <button class="botao-acao-mensagem" onclick="chat.copiarMensagem('${mensagem.id}')" title="Copiar">
                        📋 Copiar
                    </button>
                </div>
            </div>
        `;

        this._elementos.containerMensagens.appendChild(div);
    },

    /**
     * Envia uma mensagem
     */
    async _enviarMensagem() {
        const texto = this._elementos.campoMensagem.value.trim();
        if (!texto || this._enviando) return;

        // Verifica API key (local ou global do servidor)
        const apiKey = armazenamentoServico.obterApiKey();
        const chaveGlobal = openrouterServico.obterChaveGlobalAtiva();
        if (!apiKey && !chaveGlobal) {
            toastErro('Configure sua API key nas configurações');
            configuracoes.abrir();
            return;
        }

        // Cria nova conversa se necessário
        if (!this._conversaAtual) {
            this._conversaAtual = {
                id: gerarId(),
                titulo: gerarTituloConversa(texto),
                mensagens: [],
                criadoEm: Date.now(),
                atualizadoEm: Date.now(),
            };
        }

        // Adiciona mensagem do usuário
        const msgUsuario = {
            id: gerarId(),
            papel: 'user',
            conteudo: texto,
            timestamp: Date.now(),
        };

        this._conversaAtual.mensagens.push(msgUsuario);
        this._conversaAtual.atualizadoEm = Date.now();

        // Mostra o chat e limpa o campo
        this._mostrarChat();
        this._adicionarMensagemAoDOM(msgUsuario);
        this._elementos.campoMensagem.value = '';
        this._autoResize();
        this._enviando = true;
        this._atualizarBotaoEnviar();
        this._salvarConversa();
        barraLateral.renderizar();

        rolarParaFinal(this._elementos.areaMensagens);

        // Mostra indicador de digitando
        const indicadorId = this._mostrarDigitando();

        const modelo = armazenamentoServico.obterModelo();
        const streaming = armazenamentoServico.obterStreaming();

        try {
            if (streaming) {
                await this._enviarComStreaming(modelo, indicadorId);
            } else {
                await this._enviarSemStreaming(modelo, indicadorId);
            }
        } catch (erro) {
            this._removerDigitando(indicadorId);
            console.error('Erro ao enviar mensagem:', erro);
            toastErro(erro.message || 'Erro ao comunicar com a IA');
            
            // Adiciona mensagem de erro
            const msgErro = {
                id: gerarId(),
                papel: 'assistant',
                conteudo: `⚠️ **Erro:** ${erro.message || 'Erro desconhecido ao comunicar com a API.'}`,
                timestamp: Date.now(),
            };
            this._conversaAtual.mensagens.push(msgErro);
            this._adicionarMensagemAoDOM(msgErro);
        } finally {
            this._enviando = false;
            this._atualizarBotaoEnviar();
            this._salvarConversa();
            rolarParaFinal(this._elementos.areaMensagens);
        }
    },

    /**
     * Envia sem streaming (resposta completa de uma vez)
     */
    async _enviarSemStreaming(modelo, indicadorId) {
        const resultado = await openrouterServico.enviarMensagem(
            this._conversaAtual.mensagens,
            modelo
        );

        this._removerDigitando(indicadorId);

        const msgAssistente = {
            id: gerarId(),
            papel: 'assistant',
            conteudo: resultado.conteudo,
            timestamp: Date.now(),
        };

        this._conversaAtual.mensagens.push(msgAssistente);
        this._adicionarMensagemAoDOM(msgAssistente);
    },

    /**
     * Envia com streaming (palavra por palavra)
     */
    async _enviarComStreaming(modelo, indicadorId) {
        // Cria elemento da mensagem do assistente
        const msgId = gerarId();
        this._removerDigitando(indicadorId);

        const div = document.createElement('div');
        div.className = 'mensagem mensagem-assistente';
        div.id = `msg_${msgId}`;
        div.innerHTML = `
            <div class="mensagem-avatar">🤖</div>
            <div class="mensagem-conteudo">
                <div class="mensagem-cabecalho">
                    <span class="mensagem-nome">IA</span>
                    <span class="mensagem-hora">Agora</span>
                </div>
                <div class="mensagem-texto" id="texto_${msgId}"><span class="cursor-streaming"></span></div>
                <div class="mensagem-acoes">
                    <button class="botao-acao-mensagem" onclick="chat.copiarMensagem('${msgId}')" title="Copiar">
                        📋 Copiar
                    </button>
                </div>
            </div>
        `;
        this._elementos.containerMensagens.appendChild(div);

        const elementoTexto = document.getElementById(`texto_${msgId}`);
        let conteudoFinal = '';

        await openrouterServico.enviarMensagemStream(
            this._conversaAtual.mensagens,
            modelo,
            (delta, conteudoCompleto) => {
                conteudoFinal = conteudoCompleto;
                elementoTexto.innerHTML = markdownServico.converter(conteudoCompleto) + '<span class="cursor-streaming"></span>';
                rolarParaFinal(this._elementos.areaMensagens);
            }
        );

        // Remove cursor e renderiza final
        elementoTexto.innerHTML = markdownServico.converter(conteudoFinal);

        // Salva mensagem
        const msgAssistente = {
            id: msgId,
            papel: 'assistant',
            conteudo: conteudoFinal,
            timestamp: Date.now(),
        };
        this._conversaAtual.mensagens.push(msgAssistente);
    },

    /**
     * Mostra o indicador de "digitando..."
     */
    _mostrarDigitando() {
        const id = 'digitando_' + gerarId();
        const div = document.createElement('div');
        div.className = 'mensagem mensagem-assistente';
        div.id = id;
        div.innerHTML = `
            <div class="mensagem-avatar">🤖</div>
            <div class="mensagem-conteudo">
                <div class="mensagem-cabecalho">
                    <span class="mensagem-nome">IA</span>
                </div>
                <div class="indicador-digitando">
                    <div class="ponto-digitando"></div>
                    <div class="ponto-digitando"></div>
                    <div class="ponto-digitando"></div>
                </div>
            </div>
        `;
        this._elementos.containerMensagens.appendChild(div);
        rolarParaFinal(this._elementos.areaMensagens);
        return id;
    },

    /**
     * Remove o indicador de "digitando..."
     */
    _removerDigitando(id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.remove();
    },

    /**
     * Salva a conversa atual no armazenamento
     */
    _salvarConversa() {
        if (!this._conversaAtual) return;

        const conversas = armazenamentoServico.obterConversas();
        const indice = conversas.findIndex(c => c.id === this._conversaAtual.id);

        if (indice >= 0) {
            conversas[indice] = this._conversaAtual;
        } else {
            conversas.push(this._conversaAtual);
        }

        armazenamentoServico.salvarConversas(conversas);
        armazenamentoServico.salvarConversaAtiva(this._conversaAtual.id);
    },

    /**
     * Copia o conteúdo de uma mensagem
     */
    async copiarMensagem(msgId) {
        if (!this._conversaAtual) return;

        const msg = this._conversaAtual.mensagens.find(m => m.id === msgId);
        if (!msg) return;

        const sucesso = await copiarParaClipboard(msg.conteudo);
        if (sucesso) {
            toastSucesso('Mensagem copiada!');
        } else {
            toastErro('Erro ao copiar mensagem');
        }
    },
};
