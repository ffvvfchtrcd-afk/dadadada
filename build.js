const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Função auxiliar para copiar pastas de forma recursiva (nativo Node.js)
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log('⚡ Iniciando Build Unificado (Loja + Admin)...');

  const rootDist = path.join(__dirname, 'dist');
  const nexmarketDist = path.join(__dirname, 'nexmarket/dist');

  // 1. Limpar a pasta dist se ela já existir para evitar conflitos
  if (fs.existsSync(rootDist)) {
    console.log('🧹 Limpando pasta de build antiga...');
    fs.rmSync(rootDist, { recursive: true, force: true });
  }
  fs.mkdirSync(rootDist, { recursive: true });

  // 2. Build da Loja (nexmarket)
  console.log('📦 Construindo a Loja do Cliente (nexmarket)...');
  execSync('npm run build', { cwd: path.join(__dirname, 'nexmarket'), stdio: 'inherit' });

  // 3. Copiar os arquivos da loja (nexmarket/dist) diretamente para a raiz do dist
  console.log('✨ Movendo Loja do Cliente para a rota principal (/)');
  if (fs.existsSync(nexmarketDist)) {
    copyRecursiveSync(nexmarketDist, rootDist);
  } else {
    throw new Error('Pasta de build da loja (nexmarket/dist) não encontrada!');
  }

  // 4. Build do Painel Admin diretamente na pasta dist/admin/ (evita rename locks!)
  console.log('📦 Construindo o Painel de Administração (raiz) diretamente em dist/admin/...');
  execSync('npx vite build --base=/admin/ --outDir dist/admin', { cwd: __dirname, stdio: 'inherit' });

  console.log('==================================================');
  console.log('🎉 BUILD UNIFICADO CONCLUÍDO COM SUCESSO!');
  console.log('🔗 Loja (Cliente):  http://seusite.com/');
  console.log('🔗 Admin Dashboard: http://seusite.com/admin');
  console.log('==================================================');
} catch (error) {
  console.error('❌ Erro durante o Build Unificado:', error);
  process.exit(1);
}
