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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // No ambiente da Vercel, parâmetros dinâmicos de rota são expostos em req.query
    const { paymentId } = req.query;

    if (!paymentId) {
      return res.status(400).json({ error: 'ID do pagamento ausente' });
    }

    // Busca o arquivo de configuração de forma resiliente em ambas as estruturas de pasta
    let configPath = path.resolve(process.cwd(), 'database/payment_config.json');
    if (!fs.existsSync(configPath)) {
      configPath = path.resolve(process.cwd(), '../database/payment_config.json');
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8') || '{}');
    const token = config.mp_access_token;
    
    if (paymentId.startsWith('sim-')) {
      // Modo Demo Simulado: auto-aprovação após 4 segundos
      const timeCreated = Number(paymentId.replace('sim-', ''));
      const elapsed = Date.now() - timeCreated;
      if (elapsed >= 4000) {
        return res.status(200).json({ success: true, status: 'approved', mode: 'demo' });
      } else {
        return res.status(200).json({ success: true, status: 'pending', mode: 'demo' });
      }
    } else {
      // Consulta Real no Mercado Pago
      if (!token) {
        return res.status(400).json({ error: 'Configuração de pagamento ausente' });
      }
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const mpData = await mpResponse.json();
      if (mpResponse.ok) {
        return res.status(200).json({
          success: true,
          status: mpData.status,
          mode: 'production'
        });
      } else {
        return res.status(400).json({ error: mpData.message || 'Erro ao consultar Mercado Pago' });
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
