-- -------------------------------------------------------------
-- SCRIPT SQL DE CRIAÇÃO DO BANCO DE DADOS (SUPABASE CLOUD)
-- Projeto: NexMarket Storefront & Admin Dashboard
-- -------------------------------------------------------------

-- Habilitar extensão UUID caso seja útil futuramente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    hierarquia INT DEFAULT 1,
    icone VARCHAR(255),
    "imageUrl" TEXT,
    status VARCHAR(50) DEFAULT 'ATIVO',
    "dataCriacao" TIMESTAMPTZ DEFAULT NOW(),
    "dataAtualizacao" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE IF NOT EXISTS products (
    id BIGINT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    "categoriaId" BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    icone TEXT,
    imagens TEXT[], -- Vetor contendo múltiplos links de imagem
    "miniDesc" TEXT,
    descricao TEXT,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'ATIVO',
    "dataCriacao" TIMESTAMPTZ DEFAULT NOW(),
    "dataAtualizacao" TIMESTAMPTZ DEFAULT NOW(),
    destaque BOOLEAN DEFAULT FALSE
);

-- 3. TABELA DE VARIAÇÕES (PRODUTOS_OPCOES)
CREATE TABLE IF NOT EXISTS variacoes (
    id VARCHAR(100) PRIMARY KEY,
    "produtoId" BIGINT REFERENCES products(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    preco NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estoque_tipo VARCHAR(50) DEFAULT 'MANUAL', -- AUTOMATICA, MANUAL, AGENTE
    tipo_conta VARCHAR(50),
    duracao VARCHAR(100),
    garantia_dias INT DEFAULT 0,
    descricao_extra TEXT,
    "stockData" TEXT[], -- Contas registradas para entrega automática
    "quantidadeStock" INT DEFAULT 0,
    vendas_acumuladas INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ATIVO',
    "dataCriacao" TIMESTAMPTZ DEFAULT NOW(),
    "dataAtualizacao" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    "comprasIds" TEXT DEFAULT '',
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    status VARCHAR(50) DEFAULT 'ATIVO',
    saldo NUMERIC(10, 2) DEFAULT 0.00,
    "emailVerificado" BOOLEAN DEFAULT FALSE,
    telefone VARCHAR(50),
    "ultimoIP" VARCHAR(50),
    "dataUltimoLogin" TIMESTAMPTZ,
    estatisticas JSONB DEFAULT '{"totalGasto": 0, "totalPedidos": 0}'::jsonb,
    "dataCadastro" TIMESTAMPTZ DEFAULT NOW(),
    "dataAtualizacao" TIMESTAMPTZ DEFAULT NOW(),
    cargo VARCHAR(50) DEFAULT 'CLIENTE',
    "dataCriacao" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE COMPRAS
CREATE TABLE IF NOT EXISTS compras (
    id VARCHAR(100) PRIMARY KEY,
    "userId" BIGINT REFERENCES users(id) ON DELETE SET NULL,
    "userName" VARCHAR(255),
    "productId" BIGINT,
    "productName" VARCHAR(255),
    "variationId" VARCHAR(100),
    "variationName" VARCHAR(255),
    quantity INT DEFAULT 1,
    total NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'AGUARDANDO_PAGAMENTO',
    "metodoEntrega" VARCHAR(50),
    "deliveryContent" TEXT[], -- Conteúdo entregue de forma automática
    date TIMESTAMPTZ DEFAULT NOW(),
    timeline JSONB DEFAULT '[]'::jsonb,
    "dateDelivered" TIMESTAMPTZ
);

-- 6. TABELA DE BANNERS
CREATE TABLE IF NOT EXISTS banners (
    id BIGINT PRIMARY KEY,
    "imagemUrl" TEXT NOT NULL,
    link TEXT,
    status VARCHAR(50) DEFAULT 'ATIVO',
    "dataCriacao" TIMESTAMPTZ DEFAULT NOW(),
    "dataAtualizacao" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INSERÇÃO DO ADMINISTRADOR MASTER PADRÃO
INSERT INTO users (
    id, "comprasIds", nome, email, senha, role, status, saldo, "emailVerificado", telefone, cargo
) VALUES (
    1, 
    '', 
    'Admin Master', 
    'admin@sistema.com', 
    '$2a$10$e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6', -- Mesma senha do ambiente de desenvolvimento
    'ADMIN', 
    'ATIVO', 
    10000.00, 
    TRUE, 
    '+5521999999999', 
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- 8. DESATIVAR RLS (ROW-LEVEL SECURITY) PARA PERMITIR OPERAÇÕES DO SDK CLIENTE
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE variacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE compras DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;
