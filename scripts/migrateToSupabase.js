const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Carregar variáveis de ambiente do .env
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error("❌ Arquivo .env não encontrado. Crie ele primeiro com suas chaves do Supabase!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = trimmed.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder') || !supabaseKey || supabaseKey.includes('placeholder')) {
  console.error("❌ Credenciais do Supabase não configuradas no arquivo .env!");
  console.log("Por favor, substitua os valores 'placeholder' no seu arquivo .env pelas chaves reais do seu painel Supabase.");
  process.exit(1);
}

console.log("🔌 Conectando ao Supabase Cloud...");
const supabase = createClient(supabaseUrl, supabaseKey);

// Definição exata de colunas válidas no SQL
const VALID_COLUMNS = {
  categories: ['id', 'nome', 'slug', 'hierarquia', 'icone', 'imageUrl', 'status', 'dataCriacao', 'dataAtualizacao'],
  products: ['id', 'nome', 'slug', 'categoriaId', 'icone', 'imagens', 'miniDesc', 'descricao', 'tags', 'status', 'dataCriacao', 'dataAtualizacao', 'destaque'],
  variacoes: ['id', 'produtoId', 'nome', 'slug', 'preco', 'estoque_tipo', 'tipo_conta', 'duracao', 'garantia_dias', 'descricao_extra', 'stockData', 'quantidadeStock', 'vendas_acumuladas', 'status', 'dataCriacao', 'dataAtualizacao'],
  users: ['id', 'comprasIds', 'nome', 'email', 'senha', 'role', 'status', 'saldo', 'emailVerificado', 'telefone', 'ultimoIP', 'dataUltimoLogin', 'estatisticas', 'dataCadastro', 'dataAtualizacao', 'cargo', 'dataCriacao'],
  compras: ['id', 'userId', 'userName', 'productId', 'productName', 'variationId', 'variationName', 'quantity', 'total', 'status', 'metodoEntrega', 'deliveryContent', 'date', 'timeline', 'dateDelivered'],
  banners: ['id', 'imagemUrl', 'link', 'status', 'dataCriacao', 'dataAtualizacao']
};

async function migrateCollection(collectionName, tableName) {
  try {
    const jsonPath = path.resolve(__dirname, `../database/${collectionName}/data.json`);
    if (!fs.existsSync(jsonPath)) {
      console.log(`⚠️ Coleção ${collectionName} não possui dados locais para migrar.`);
      return;
    }

    let localData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log(`📦 Carregando ${localData.length} registros locais de [${collectionName}]...`);

    // Limpeza, formatação e mapeamento de campos incompatíveis do JSON
    localData = localData.map(item => {
      // 1. Mapeamento de banners (imageUrl -> imagemUrl no SQL)
      if (tableName === 'banners' && item.imageUrl && !item.imagemUrl) {
        item.imagemUrl = item.imageUrl;
      }
      
      // 2. Compras: Garante que deliveryContent seja um array de strings
      if (tableName === 'compras') {
        if (item.deliveryContent === undefined || item.deliveryContent === null) {
          item.deliveryContent = [];
        } else if (typeof item.deliveryContent === 'string') {
          item.deliveryContent = [item.deliveryContent];
        }
      }

      // 3. Filtragem restrita de colunas existentes no SQL para evitar erros de cache do schema
      const filtered = {};
      const validCols = VALID_COLUMNS[tableName];
      validCols.forEach(col => {
        if (item[col] !== undefined) {
          filtered[col] = item[col];
        }
      });
      return filtered;
    });

    // Inserir ou atualizar os registros higienizados no Supabase
    const { error } = await supabase.from(tableName).upsert(localData);
    
    if (error) {
      console.error(`❌ Erro ao migrar tabela [${tableName}]:`, error.message);
    } else {
      console.log(`✅ Tabela [${tableName}] migrada com sucesso!`);
    }
  } catch (err) {
    console.error(`❌ Falha crítica ao migrar ${collectionName}:`, err.message);
  }
}

async function run() {
  console.log("\n🚀 INICIANDO CARGA INICIAL DE DADOS NO SUPABASE CLOUD (HIGIENIZADO) 🚀\n");

  // Ordenado logicamente para respeitar chaves estrangeiras
  await migrateCollection('categories', 'categories');
  await migrateCollection('products', 'products');
  await migrateCollection('variacoes', 'variacoes');
  await migrateCollection('users', 'users');
  await migrateCollection('compras', 'compras');
  await migrateCollection('banners', 'banners');

  console.log("\n🎉 CARGA DE DADOS CONCLUÍDA! 🎉");
  console.log("Todos os dados locais do seu computador foram salvos na nuvem do Supabase.");
}

run();
