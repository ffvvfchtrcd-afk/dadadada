// Proxy Serverless para o OpenRouter (Vercel Backend)
// Escopo de arquivo: CommonJS (Root directory has type: commonjs)

module.exports = async function handler(req, res) {
  // Configuração de cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { modelo, mensagens, temperatura, maxTokens, stream } = req.body;

    if (!mensagens || !Array.isArray(mensagens)) {
      res.status(400).json({ error: 'Corpo da mensagem inválido' });
      return;
    }

    // Tenta obter o token da variável de ambiente primeiro
    let apiKey = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    // Se o cliente enviar seu próprio token no Header Authorization, prioriza-o
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const clientKey = authHeader.replace('Bearer ', '').trim();
      if (clientKey && clientKey !== 'backend-managed' && clientKey.length > 10) {
        apiKey = clientKey;
      }
    }

    if (!apiKey || apiKey.trim().length === 0) {
      res.status(401).json({ error: 'Chave de API do OpenRouter não configurada no servidor.' });
      return;
    }

    const openrouterModel = modelo || 'openrouter/free';
    const requestBody = {
      model: openrouterModel,
      messages: mensagens,
      temperature: temperatura ?? 0.4,
      max_tokens: maxTokens ?? 2048,
      stream: !!stream
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nexmarket.com.br',
      'X-Title': 'NexMarket Admin Copilot'
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `Erro no OpenRouter: ${errorText}` });
      return;
    }

    if (stream) {
      // Configura streaming SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body;
      if (reader.readable) {
        reader.on('data', (chunk) => {
          res.write(chunk);
        });
        reader.on('end', () => {
          res.end();
        });
        reader.on('error', (err) => {
          console.error("Erro no streaming do proxy:", err);
          res.end();
        });
      } else {
        // Fallback se o stream não estiver legível diretamente
        const text = await response.text();
        res.write(text);
        res.end();
      }
    } else {
      const data = await response.json();
      res.status(200).json(data);
    }
  } catch (err) {
    console.error("Erro na rota serverless /api/chat:", err);
    res.status(500).json({ error: err.message });
  }
}
