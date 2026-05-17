// IP público do seu computador autorizado a acessar o Painel
const ALLOWED_IPS = ['186.226.212.46', '127.0.0.1', '::1'];

// Chave secreta de bypass caso seu IP de internet mude
// Para reativar seu acesso, basta abrir no navegador: https://seu-link-admin.vercel.app/?passkey=gerente-exclusivo-seguro-8899
const BYPASS_PASSKEY = 'gerente-exclusivo-seguro-8899';

// Nome do cookie de autorização
const COOKIE_NAME = 'admin_ip_bypass_token';

export function middleware(request) {
  const url = new URL(request.url);
  
  // Só protege rotas do Painel Administrativo (/admin e sub-rotas)
  if (!url.pathname.startsWith('/admin')) {
    return; // Passa direto para rotas públicas (loja, pagamentos, etc.)
  }
  
  // Captura o IP que está acessando a Vercel através dos cabeçalhos padrão HTTP de borda
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  
  // Limpa o formato do IP (pega o primeiro IP da lista e remove mapeamento IPv6 se houver)
  const cleanIp = ip.split(',')[0].trim().replace(/^::ffff:/, '');

  // 1. Verifica se a URL contém o parâmetro secreto de bypass de IP
  const passkey = url.searchParams.get('passkey');
  if (passkey === BYPASS_PASSKEY) {
    // Redireciona limpando a barra de navegação (?passkey=...) para segurança adicional
    const redirectUrl = new URL(url.pathname, request.url);
    const headers = new Headers();
    headers.set('Location', redirectUrl.toString());
    
    // Insere o cookie nativo com duração de 365 dias
    headers.set('Set-Cookie', `${COOKIE_NAME}=authorized; Max-Age=${60 * 60 * 24 * 365}; Path=/; Secure; SameSite=Strict`);
    
    return new Response(null, {
      status: 307,
      headers: headers,
    });
  }

  // 2. Parse manual e ultra-rápido de Cookies (API nativa de cabeçalhos)
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = {};
  cookieHeader.split(';').forEach(c => {
    const parts = c.trim().split('=');
    if (parts.length >= 2) {
      cookies[parts[0]] = parts[1];
    }
  });

  // 3. Permite acesso se o Cookie de bypass estiver ativo e correto
  const hasBypassCookie = cookies[COOKIE_NAME];
  if (hasBypassCookie === 'authorized') {
    return; // Retorna undefined para passar a conexão adiante normalmente
  }

  // 4. Permite acesso se o IP do usuário constar na whitelist autorizada
  const isIpAllowed = ALLOWED_IPS.includes(cleanIp);
  if (isIpAllowed) {
    return; // Retorna undefined para passar a conexão adiante normalmente
  }

  // 5. Bloqueia a conexão para qualquer outro IP não autorizado (Retorna HTML estilizado de 403)
  return new Response(
    `<!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔒 403 Forbidden - Acesso Restrito</title>
      <style>
        body { 
          background-color: #0f172a; 
          color: #f8fafc; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          height: 100vh; 
          margin: 0; 
        }
        .container { 
          text-align: center; 
          max-width: 450px; 
          padding: 30px; 
          border: 1px solid #334155; 
          border-radius: 12px; 
          background-color: #1e293b; 
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); 
        }
        .icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        h1 { 
          color: #f43f5e; 
          font-size: 22px; 
          margin: 0 0 12px 0; 
        }
        p { 
          color: #94a3b8; 
          font-size: 14px; 
          line-height: 1.6; 
          margin: 0 0 20px 0;
        }
        .ip-box { 
          font-family: 'Consolas', monospace; 
          background-color: #0f172a; 
          padding: 8px 12px; 
          border-radius: 6px; 
          color: #38bdf8; 
          font-size: 13px;
          display: inline-block;
          border: 1px solid #1e293b;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔒</div>
        <h1>403 Forbidden - Acesso Restrito</h1>
        <p>Este painel administrativo e restrito a conexoes autorizadas. Seu endereço de rede nao possui permissao para visualizar o conteudo.</p>
        <div>
          <span class="ip-box">Seu IP: ${cleanIp || 'Não Identificado'}</span>
        </div>
      </div>
    </body>
    </html>`,
    {
      status: 403,
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    }
  );
}

// O Middleware protege absolutamente todas as rotas deste projeto na Vercel
export const config = {
  matcher: '/:path*',
};
