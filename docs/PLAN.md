# Plano de Resolução: Erro 404 no F5 (Roteamento SPA Vercel)

Este documento descreve o plano estratégico coordenado pelo Orchestrator para resolver o erro 404 que ocorre ao atualizar a página (F5) no painel de administração (`/admin/copilot`) e na loja storefront (`/cart`, `/product/:id`).

## 1. Análise da Causa Raiz
No modelo de Single Page Application (SPA) utilizando Vite e React Router, a navegação ocorre inteiramente no lado do cliente (navegador). Quando o usuário acessa `https://dominio.com/admin/copilot` e atualiza a página (F5):
1. O navegador envia uma requisição HTTP direta para o servidor da Vercel pedindo o caminho `/admin/copilot`.
2. A Vercel procura fisicamente por uma pasta `admin/` com um arquivo `copilot.html` ou similar.
3. Como esse arquivo não existe fisicamente (tudo é gerenciado dinamicamente pelo JavaScript do React dentro de `index.html`), o servidor retorna o erro **404: NOT_FOUND**.

## 2. Diagnóstico da Situação Atual
A nossa correção anterior criou os arquivos `vercel.json` dentro das pastas públicas:
* `/public/vercel.json` (Painel Administrativo)
* `/nexmarket/public/vercel.json` (Loja Storefront)

Esses arquivos serão copiados automaticamente para a pasta final `/dist/` pelo Vite durante o build na Vercel.
**Por que o erro ainda ocorreu na imagem do usuário:**
* O status do Git local está 100% atualizado, mas o usuário **ainda não executou os comandos `git push`** para enviar os arquivos criados para o GitHub.
* Portanto, o deploy ativo na Vercel ainda é uma versão antiga que não contém a nossa blindagem do `vercel.json`.

## 3. Plano de Ação & Implementação

### Fase 1: Sincronização e Deploy
1. **Instruir o Usuário:** Solicitar que ele realize o Git push local contendo os arquivos `vercel.json` recém-criados.
2. **Acompanhar o Build:** Aguardar a Vercel compilar e publicar a nova versão que contém os arquivos de reescrita dentro da pasta de build servida.

### Fase 2: Configuração Alternativa (Redundância Direta)
Se, por qualquer motivo de configuração no painel da Vercel do usuário, a reescrita via pasta `/public` não for lida:
1. **Redirecionamento Global:** Configurar o `/vercel.json` na raiz absoluta para abranger também o redirecionamento global caso a Vercel esteja configurada para ler apenas a raiz absoluta e não a subpasta `/dist/`.
   * Estrutura do `/vercel.json` da raiz:
     ```json
     {
       "cleanUrls": true,
       "rewrites": [
         { "source": "/api/(.*)", "destination": "/api/$1" },
         { "source": "/admin/(.*)", "destination": "/index.html" },
         { "source": "/(.*)", "destination": "/index.html" }
       ]
     }
     ```

## 4. Plano de Verificação (Manual)
1. Fazer o deploy completo na Vercel.
2. Acessar a URL: `https://dadadada-cpda.vercel.app/admin/copilot`
3. Pressionar **F5 / Atualizar**.
4. A página deve recarregar e abrir o Copiloto instantaneamente, sem exibir a tela de 404 da Vercel.
