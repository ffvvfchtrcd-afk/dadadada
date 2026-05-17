import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Vite Plugin para simular uma API local lendo/escrevendo nos JSONs
function localJsonApi() {
  return {
    name: 'local-json-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        // 1. Endpoint for Mercado Pago PIX Creation
        if (req.url.startsWith('/api/payments/create-pix') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);
              const configPath = path.resolve(__dirname, 'database/payment_config.json');
              const config = JSON.parse(fs.readFileSync(configPath, 'utf-8') || '{}');
              const token = config.mp_access_token;
              
              if (token && token.trim().length > 0) {
                // Real Mercado Pago Payment API Request
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
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({
                    success: true,
                    paymentId: String(mpData.id),
                    qrCode: mpData.point_of_interaction.transaction_data.qr_code,
                    qrCodeBase64: mpData.point_of_interaction.transaction_data.qr_code_base64,
                    mode: 'production'
                  }));
                } else {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ error: mpData.message || 'Erro na API do Mercado Pago' }));
                }
              } else {
                // Simulated Demo Mode Payment
                const mockQrBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABF76RDAAAABlBMVEUAAAD///+l2Z/dAAAAMklEQVR42mNkYPjPgAr+Y2hggAJGhhhoYGBgYIiBhgYGCoYYaGBgoGCIgQYGBgqGGJgPADp/Chn77ecfAAAAAElFTkSuQmCC';
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: true,
                  paymentId: `sim-${Date.now()}`,
                  qrCode: '00020101021226870014br.gov.bcb.pix2565pix.mercado-pago.example/dummykey_1234567890abcdef',
                  qrCodeBase64: mockQrBase64,
                  mode: 'demo'
                }));
              }
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 2. Endpoint for Mercado Pago Payment Status Check
        if (req.url.startsWith('/api/payments/status/') && req.method === 'GET') {
          try {
            const parts = req.url.split('/');
            const paymentId = parts[parts.length - 1].split('?')[0];
            const configPath = path.resolve(__dirname, 'database/payment_config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf-8') || '{}');
            const token = config.mp_access_token;
            
            if (paymentId.startsWith('sim-')) {
              // Simulated Mode Status Polling: auto-approve after 4 seconds of demo screen display
              const timeCreated = Number(paymentId.replace('sim-', ''));
              const elapsed = Date.now() - timeCreated;
              res.setHeader('Content-Type', 'application/json');
              if (elapsed >= 4000) {
                return res.end(JSON.stringify({ success: true, status: 'approved', mode: 'demo' }));
              } else {
                return res.end(JSON.stringify({ success: true, status: 'pending', mode: 'demo' }));
              }
            } else {
              // Real Mercado Pago Status Query
              if (!token) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'Configuração de pagamento ausente' }));
              }
              
              const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const mpData = await mpResponse.json();
              if (mpResponse.ok) {
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: true,
                  status: mpData.status,
                  mode: 'production'
                }));
              } else {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: mpData.message || 'Erro ao consultar Mercado Pago' }));
              }
            }
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: err.message }));
          }
        }
        
        const parts = req.url.split('?')[0].split('/').filter(Boolean);
        if (parts.length < 2) return next();
        
        const collection = parts[1];
        const filePath = path.resolve(__dirname, `database/${collection}/data.json`);
        
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Collection not found' }));
        }

        if (req.method === 'GET') {
          const data = fs.readFileSync(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          return res.end(data);
        }

        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              let newData = [...currentData];
              const parsedBody = body ? JSON.parse(body) : null;
              const urlId = parts[2]; // Get ID from /api/collection/id
              const targetId = urlId || (parsedBody && parsedBody.id);
              
              if (req.method === 'PUT' || req.method === 'PATCH') {
                if (Array.isArray(parsedBody) && req.method === 'PUT') {
                  newData = parsedBody;
                } else if (targetId) {
                  const idx = newData.findIndex(item => String(item.id) === String(targetId));
                  if (idx !== -1) {
                    // For PATCH, we merge. For PUT, we replace (or merge if ID is in body)
                    newData[idx] = req.method === 'PATCH' ? { ...newData[idx], ...parsedBody } : { ...parsedBody, id: targetId };
                  } else if (req.method === 'PUT') {
                    newData.push({ ...parsedBody, id: targetId });
                  }
                }
              } else if (req.method === 'POST') {
                if (Array.isArray(parsedBody)) {
                   newData = [...newData, ...parsedBody];
                } else {
                   newData.push(parsedBody);
                }
              } else if (req.method === 'DELETE' && targetId) {
                newData = newData.filter(item => String(item.id) !== String(targetId));
              }
              
              fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, data: newData }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
        
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), localJsonApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    warmup: {
      clientFiles: ['./src/**/*.jsx', './src/**/*.js', './src/**/*.css']
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react', 'react-simple-wysiwyg']
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            return 'vendor-libs';
          }
        }
      }
    }
  }
});
