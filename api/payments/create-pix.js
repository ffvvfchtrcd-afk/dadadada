const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Configurações de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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
    const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    
    // Obtém o token de forma híbrida: prioriza Variável de Ambiente (Vercel) e faz fallback para o arquivo local
    let token = process.env.VITE_MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    
    if (!token || token.trim().length === 0) {
      try {
        let configPath = path.resolve(process.cwd(), 'database/payment_config.json');
        if (!fs.existsSync(configPath)) {
          configPath = path.resolve(process.cwd(), '../database/payment_config.json');
        }
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8') || '{}');
          token = config.mp_access_token;
        }
      } catch (e) {
        console.warn("Falha ao ler arquivo payment_config.json:", e.message);
      }
    }
    
    if (token && token.trim().length > 0) {
      // Requisição Real para a API do Mercado Pago
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `idemp-${Date.now()}-${Math.floor(Math.random() * 100000)}`
        },
        body: JSON.stringify({
          transaction_amount: Number(parsed.total),
          description: `${parsed.productName} - ${parsed.variationName || ''} (NexMarket)`,
          payment_method_id: 'pix',
          payer: {
            email: parsed.email || 'cliente@nexmarket.com',
            first_name: parsed.userName ? parsed.userName.split(' ')[0] : 'Cliente',
            last_name: parsed.userName ? (parsed.userName.split(' ')[1] || 'NexMarket') : 'NexMarket'
          }
        })
      });
      
      const mpData = await mpResponse.json();
      if (mpResponse.ok) {
        return res.status(200).json({
          success: true,
          paymentId: String(mpData.id),
          qrCode: mpData.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: mpData.point_of_interaction.transaction_data.qr_code_base64,
          mode: 'production'
        });
      } else {
        return res.status(400).json({ error: mpData.message || 'Erro na API do Mercado Pago' });
      }
    } else {
      // Pagamento Simulado em Modo Demo
      const mockQrBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABF76RDAAAABlBMVEUAAAD///+l2Z/dAAAAMklEQVR42mNkYPjPgAr+Y2hggAJGhhhoYGBgYIiBhgYGCoYYaGBgoGCIgQYGBgqGGJgPADp/Chn77ecfAAAAAElFTkSuQmCC';
      return res.status(200).json({
        success: true,
        paymentId: `sim-${Date.now()}`,
        qrCode: '00020101021226870014br.gov.bcb.pix2565pix.mercado-pago.example/dummykey_1234567890abcdef',
        qrCodeBase64: mockQrBase64,
        mode: 'demo'
      });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
