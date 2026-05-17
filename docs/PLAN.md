# PLANO DE IMPLEMENTAÇÃO: Resolução de Conflitos ESM (Erro 500) na Vercel

Este plano visa converter as funções serverless da Loja (`nexmarket/api`) de CommonJS para ES Modules nativos, de forma a respeitar a configuração `"type": "module"` do subprojeto e eliminar o travamento de runtime do Node.js na Vercel.

---

## 🛠️ Alterações Propostas

### 1. Camada de API da Loja (nexmarket/api)
Converteremos os arquivos de API da loja para utilizarem a sintaxe moderna de imports e exports (ESM):

#### [MODIFY] [create-pix.js](file:///f:/New%20folder%20(4)/dadadada/nexmarket/api/payments/create-pix.js)
- Substituir `const fs = require('fs')` por `import fs from 'fs'`.
- Substituir `const path = require('path')` por `import path from 'path'`.
- Substituir `module.exports = async (req, res) => { ... }` por `export default async function handler(req, res) { ... }`.

#### [MODIFY] [status/[paymentId].js](file:///f:/New%20folder%20(4)/dadadada/nexmarket/api/payments/status/%5BpaymentId%5D.js)
- Substituir imports `require` por `import`.
- Substituir exportação de CommonJS por `export default async function handler(req, res) { ... }`.

---

## 🛡️ Camada de API do Admin (raiz)
- **Permanecerá inalterada como CommonJS**, pois o arquivo de configuração `package.json` na raiz principal está setado como `"type": "commonjs"`, mantendo total conformidade e estabilidade para o domínio do Admin.

---

## 🧪 Plano de Verificação

### Teste Manual
1. Puxar as alterações para o GitHub.
2. Acompanhar a compilação do novo deploy da Loja no painel da Vercel (garantindo compilação livre de erros).
3. Efetuar o teste de checkout com Pix no carrinho do cliente.
4. Validar o retorno do status `200 OK` com o QR Code.
