/* ============================================
   NEXCHAT - Script Principal
   Inicialização de todos os componentes
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializa serviços assíncronos primeiro
        await openrouterServico.inicializar();

        // Inicializa todos os componentes em ordem
        barraLateral.inicializar();
        seletorModelo.inicializar();
        configuracoes.inicializar();
        painelLoja.inicializar();
        chat.inicializar();

        console.log('✅ NexChat inicializado com sucesso');

        // Se não tem API key local E não há chave global no servidor, mostra aviso
        const apiKey = armazenamentoServico.obterApiKey();
        const chaveGlobal = openrouterServico.obterChaveGlobalAtiva();
        if (!apiKey && !chaveGlobal) {
            setTimeout(() => {
                toastInfo('Configure sua API key do OpenRouter para começar');
            }, 1000);
        }
    } catch (erro) {
        console.error('❌ Erro ao inicializar NexChat:', erro);
        toastErro('Erro ao inicializar o aplicativo');
    }
});
