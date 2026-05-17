/* ============================================
   NEXCHAT - Serviço de Markdown
   Converte markdown para HTML seguro
   ============================================ */

const markdownServico = {
    /**
     * Converte texto markdown para HTML
     */
    converter(texto) {
        if (!texto) return '';
        
        let html = escaparHtml(texto);

        // Blocos de código com linguagem (```lang ... ```)
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const linguagem = lang || 'text';
            const idBotao = 'codigo_' + gerarId();
            return `<pre><div class="bloco-codigo-cabecalho"><span class="bloco-codigo-linguagem">${linguagem}</span><button class="botao-copiar-codigo" onclick="markdownServico.copiarCodigo(this)" data-codigo-id="${idBotao}">📋 Copiar</button></div><code id="${idBotao}">${code}</code></pre>`;
        });

        // Código inline
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Headings
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Bold e Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Blockquotes
        html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr>');

        // Listas não ordenadas
        html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Listas ordenadas
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Tabelas simples
        html = this._converterTabelas(html);

        // Parágrafos: quebras de linha duplas
        html = html.replace(/\n\n/g, '</p><p>');
        // Quebras de linha simples
        html = html.replace(/\n/g, '<br>');

        // Envolve em parágrafo se necessário
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }

        // Limpa parágrafos vazios
        html = html.replace(/<p>\s*<\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)/g, '$1');
        html = html.replace(/(<hr>)<\/p>/g, '$1');
        html = html.replace(/<p>(<table>)/g, '$1');
        html = html.replace(/(<\/table>)<\/p>/g, '$1');

        return html;
    },

    /**
     * Converte tabelas markdown para HTML
     */
    _converterTabelas(html) {
        const linhas = html.split('<br>').length > 1 ? html.split('<br>') : html.split('\n');
        let resultado = [];
        let dentroTabela = false;
        let tabelaLinhas = [];

        for (const linha of linhas) {
            const trimada = linha.trim();
            if (trimada.startsWith('|') && trimada.endsWith('|')) {
                tabelaLinhas.push(trimada);
                dentroTabela = true;
            } else {
                if (dentroTabela && tabelaLinhas.length >= 2) {
                    resultado.push(this._montarTabela(tabelaLinhas));
                    tabelaLinhas = [];
                    dentroTabela = false;
                } else if (tabelaLinhas.length > 0) {
                    resultado.push(...tabelaLinhas);
                    tabelaLinhas = [];
                    dentroTabela = false;
                }
                resultado.push(linha);
            }
        }

        if (dentroTabela && tabelaLinhas.length >= 2) {
            resultado.push(this._montarTabela(tabelaLinhas));
        }

        return resultado.join('\n');
    },

    /**
     * Monta HTML de uma tabela a partir de linhas
     */
    _montarTabela(linhas) {
        if (linhas.length < 2) return linhas.join('\n');

        const parseRow = (linha) => 
            linha.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());

        const cabecalho = parseRow(linhas[0]);
        // Pula linha 1 (separador)
        const dados = linhas.slice(2).map(parseRow);

        let tabela = '<table><thead><tr>';
        cabecalho.forEach(c => { tabela += `<th>${c}</th>`; });
        tabela += '</tr></thead><tbody>';
        dados.forEach(linha => {
            tabela += '<tr>';
            linha.forEach(c => { tabela += `<td>${c}</td>`; });
            tabela += '</tr>';
        });
        tabela += '</tbody></table>';

        return tabela;
    },

    /**
     * Copia o código de um bloco de código
     */
    async copiarCodigo(botao) {
        const codigoId = botao.getAttribute('data-codigo-id');
        const elementoCodigo = document.getElementById(codigoId);
        if (!elementoCodigo) return;

        const sucesso = await copiarParaClipboard(elementoCodigo.textContent);
        if (sucesso) {
            const textoOriginal = botao.textContent;
            botao.textContent = '✅ Copiado!';
            setTimeout(() => {
                botao.textContent = textoOriginal;
            }, 2000);
        }
    },
};
