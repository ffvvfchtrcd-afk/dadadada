/* ============================================
   NEXCHAT - Funções Auxiliares
   Utilitários reutilizáveis do sistema
   ============================================ */

/**
 * Gera um ID único baseado em timestamp + random
 */
function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Formata a data/hora para exibição
 */
function formatarHora(timestamp) {
    const data = new Date(timestamp);
    const agora = new Date();
    const diferenca = agora - data;
    
    // Se menos de 1 minuto
    if (diferenca < 60000) return 'Agora';
    
    // Se menos de 1 hora
    if (diferenca < 3600000) {
        const minutos = Math.floor(diferenca / 60000);
        return `${minutos}min atrás`;
    }
    
    // Se hoje
    if (data.toDateString() === agora.toDateString()) {
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Se ontem
    const ontem = new Date(agora);
    ontem.setDate(ontem.getDate() - 1);
    if (data.toDateString() === ontem.toDateString()) {
        return 'Ontem';
    }
    
    // Caso contrário
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Escapa HTML para evitar XSS
 */
function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

/**
 * Copia texto para a área de transferência
 */
async function copiarParaClipboard(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (erro) {
        console.error('Erro ao copiar:', erro);
        return false;
    }
}

/**
 * Rola um elemento para o final suavemente
 */
function rolarParaFinal(elemento) {
    if (!elemento) return;
    requestAnimationFrame(() => {
        elemento.scrollTo({
            top: elemento.scrollHeight,
            behavior: 'smooth',
        });
    });
}

/**
 * Debounce - atrasa a execução de uma função
 */
function debounce(funcao, atraso = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => funcao.apply(this, args), atraso);
    };
}

/**
 * Trunca um texto com reticências
 */
function truncarTexto(texto, tamanhoMax = 40) {
    if (!texto) return '';
    if (texto.length <= tamanhoMax) return texto;
    return texto.substring(0, tamanhoMax) + '...';
}

/**
 * Gera título automático a partir da primeira mensagem
 */
function gerarTituloConversa(mensagem) {
    const limpo = mensagem.replace(/\n/g, ' ').trim();
    return truncarTexto(limpo, 50);
}
