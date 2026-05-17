/* ============================================
   NEXCHAT - Embeds / Notificações
   Sistema de toasts padronizados
   ============================================ */

/**
 * Cria o container de toasts se não existir
 */
function obterContainerToast() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Exibe um toast de sucesso
 */
function toastSucesso(mensagem) {
    exibirToast(mensagem, 'toast-sucesso');
}

/**
 * Exibe um toast de erro
 */
function toastErro(mensagem) {
    exibirToast(mensagem, 'toast-erro');
}

/**
 * Exibe um toast informativo
 */
function toastInfo(mensagem) {
    exibirToast(mensagem, 'toast-info');
}

/**
 * Exibe um toast genérico
 */
function exibirToast(mensagem, classe) {
    const container = obterContainerToast();
    const toast = document.createElement('div');
    toast.className = `toast ${classe}`;
    toast.textContent = mensagem;
    container.appendChild(toast);
    
    // Remove o toast após a animação
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}
