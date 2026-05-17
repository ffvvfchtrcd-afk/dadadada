import { NextResponse } from 'next/server';

// IP público do seu computador autorizado a acessar o Painel
const ALLOWED_IPS = ['186.226.212.46', '127.0.0.1', '::1'];

// Chave secreta de bypass caso seu IP de internet mude (operadoras de internet reiniciando o modem)
// Para reativar seu acesso, basta abrir no navegador: https://seu-link-admin.vercel.app/?passkey=gerente-exclusivo-seguro-8899
const BYPASS_PASSKEY = 'gerente-exclusivo-seguro-8899';

// Nome do cookie criptografado de autorização
const COOKIE_NAME = 'admin_ip_bypass_token';

export function middleware(request) {
  const url = new URL(request.url);
  
  // Captura o IP que está acessando a Vercel
  const ip = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  
  // Limpa o formato do IP (remove mapeamentos IPv6/IPv4 se houver)
  const cleanIp = ip.replace(/^::ffff:/, '');

  // 1. Verifica se a URL contém o parâmetro secreto de bypass de IP
  const passkey = url.searchParams.get('passkey');
  if (passkey === BYPASS_PASSKEY) {
    const response = NextResponse.redirect(new URL(url.pathname, request.url));
    
    // Define um cookie seguro válido por 365 dias (1 ano)
    response.cookies.set(COOKIE_NAME, 'authorized', {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      secure: true,
      sameSite: 'strict',
    });
    return response;
  }

  // 2. Verifica se o navegador possui o cookie seguro de bypass ativo
  const hasBypassCookie = request.cookies.get(COOKIE_NAME);
  if (hasBypassCookie) {
    return NextResponse.next();
  }

  // 3. Verifica se o IP atual está na lista de IPs permitidos
  const isIpAllowed = ALLOWED_IPS.includes(cleanIp);
  if (isIpAllowed) {
    return NextResponse.next();
  }

  // 4. Bloqueia a conexão para qualquer outro IP
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
