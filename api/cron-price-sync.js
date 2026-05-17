// Endpoint Serverless de Sincronização de Preços com Fornecedores
// Escopo de arquivo: CommonJS (Vercel Backend)

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL or Key not set in environment.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Modo de teste para configurador (evita CORS ao testar links no painel React)
    const { test, syncUrl, syncSelector, syncMarkup } = req.body || {};
    if (test) {
      if (!syncUrl) {
        res.status(400).json({ success: false, error: "URL de sincronização para teste não fornecida." });
        return;
      }

      const fetchRes = await fetch(syncUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!fetchRes.ok) {
        throw new Error(`Erro HTTP ${fetchRes.status} ao acessar a URL.`);
      }

      const html = await fetchRes.text();
      let extractedPrice = null;

      if (syncSelector && syncSelector !== 'auto') {
        const cleanSelector = syncSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const classRegex = new RegExp(`class=["'][^"']*${cleanSelector}[^"']*["'][^>]*>([^<]+)`, 'i');
        const idRegex = new RegExp(`id=["']${cleanSelector}["'][^>]*>([^<]+)`, 'i');
        const tagRegex = new RegExp(`<${cleanSelector}[^>]*>([^<]+)`, 'i');
        const match = html.match(classRegex) || html.match(idRegex) || html.match(tagRegex);
        if (match && match[1]) {
          extractedPrice = match[1].trim();
        }
      }

      if (!extractedPrice) {
        const priceRegex = /(?:R\$\s*|BRL\s*|\$\s*)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/gi;
        const matches = [...html.matchAll(priceRegex)];
        if (matches.length > 0) {
          extractedPrice = matches[0][1];
        }
      }

      if (!extractedPrice) {
        res.status(200).json({ success: false, reason: 'PRICE_NOT_FOUND', error: "Não foi possível localizar o preço na estrutura HTML de forma automática." });
        return;
      }

      let rawPrice = String(extractedPrice)
        .replace(/[^\d.,]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');

      let parsedPrice = parseFloat(rawPrice);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        res.status(200).json({ success: false, reason: 'PRICE_PARSE_FAILED', error: `Preço parseado inválido: ${extractedPrice}` });
        return;
      }

      const markup = Number(syncMarkup) || 0;
      const finalPrice = parsedPrice * (1 + markup / 100);

      res.status(200).json({
        success: true,
        originalPrice: parsedPrice,
        finalPrice: Number(finalPrice.toFixed(2)),
        markup
      });
      return;
    }

    // 1. Busca todas as variações que possuem URL de sincronização configurada
    const { data: variacoes, error: dbError } = await supabase
      .from('variacoes')
      .select('id, nome, preco, sync_url, sync_selector, sync_markup')
      .not('sync_url', 'is', null);

    if (dbError) throw dbError;

    if (!variacoes || variacoes.length === 0) {
      res.status(200).json({ success: true, message: "Nenhum produto configurado para sincronização de preços.", logs: [] });
      return;
    }

    const logs = [];

    // 2. Processa cada variação em lote sequencial
    for (const v of variacoes) {
      try {
        const { sync_url, sync_selector, sync_markup, nome, preco: precoAtual } = v;

        // Fetch do HTML externo
        const fetchRes = await fetch(sync_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
          },
          signal: AbortSignal.timeout(10000) // 10s timeout
        });

        if (!fetchRes.ok) {
          throw new Error(`HTTP Error ${fetchRes.status}`);
        }

        const html = await fetchRes.text();
        let extractedPrice = null;

        // Tenta encontrar usando seletores do HTML se especificado
        if (sync_selector && sync_selector !== 'auto') {
          // RegExp simplificado para capturar o conteúdo dentro do elemento HTML com a classe/id
          // Ex: <span class="price">R$ 29,90</span>
          // Escapa caracteres especiais do seletor para Regex
          const cleanSelector = sync_selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const elementRegex = new RegExp(`class=["'][^"']*${cleanSelector}[^"']*["'][^>]*>([^<]+)`, 'i');
          const match = html.match(elementRegex);
          if (match && match[1]) {
            extractedPrice = match[1].trim();
          }
        }

        // Se falhar ou estiver definido como 'auto', usa Regex genérica de Preços
        if (!extractedPrice) {
          // Procura por cifras como R$ XX,XX ou $ XX.XX na página
          const priceRegex = /(?:R\$\s*|BRL\s*|\$\s*)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/gi;
          const matches = [...html.matchAll(priceRegex)];
          if (matches.length > 0) {
            // Pega a primeira ocorrência realista de preço na página
            extractedPrice = matches[0][1];
          }
        }

        if (!extractedPrice) {
          throw new Error("Não foi possível localizar o preço na estrutura HTML.");
        }

        // Converte o preço extraído para float decimal puro
        let rawPrice = String(extractedPrice)
          .replace(/[^\d.,]/g, '') // remove letras, moedas
          .replace(/\./g, '')       // remove separador de milhar
          .replace(',', '.');       // converte decimal para ponto

        let parsedPrice = parseFloat(rawPrice);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          throw new Error(`Preço parseado inválido: ${extractedPrice}`);
        }

        // Aplica Margem de Lucro (Markup) se houver
        const markup = Number(sync_markup) || 0;
        const finalPrice = parsedPrice * (1 + markup / 100);

        // Atualiza se houver diferença real
        const precoArredondado = Number(finalPrice.toFixed(2));
        if (precoArredondado !== Number(precoAtual)) {
          const { error: updateError } = await supabase
            .from('variacoes')
            .update({
              preco: precoArredondado,
              sync_last_at: new Date().toISOString(),
              dataAtualizacao: new Date().toISOString()
            })
            .eq('id', v.id);

          if (updateError) throw updateError;

          logs.push({
            id: v.id,
            nome,
            status: 'SUCESSO',
            anterior: precoAtual,
            novo: precoArredondado,
            mensagem: `Preço atualizado de R$ ${precoAtual} para R$ ${precoArredondado} (Markup: ${markup}%)`
          });
        } else {
          logs.push({
            id: v.id,
            nome,
            status: 'MANTIDO',
            anterior: precoAtual,
            novo: precoArredondado,
            mensagem: "O preço externo não sofreu alterações."
          });
        }

      } catch (err) {
        logs.push({
          id: v.id,
          nome: v.nome,
          status: 'ERRO',
          mensagem: err.message
        });
      }
    }

    res.status(200).json({ success: true, message: "Sincronização executada com sucesso!", logs });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
