import { supabase } from './supabaseClient';

// CONFIGURAÇÃO DO MODO DE BANCO DE DADOS
// Mude para 'supabase' para ativar a nuvem, ou mantenha 'json' para rodar localmente.
export const DATABASE_MODE = 'supabase'; 

const API_URL = '/api';

// Definição exata de colunas válidas no SQL para evitar quebra com chaves extras do formulário React
const VALID_COLUMNS = {
  categories: ['id', 'nome', 'slug', 'hierarquia', 'icone', 'imageUrl', 'status', 'dataCriacao', 'dataAtualizacao'],
  products: ['id', 'nome', 'slug', 'categoriaId', 'icone', 'imagens', 'miniDesc', 'descricao', 'tags', 'status', 'dataCriacao', 'dataAtualizacao', 'destaque'],
  variacoes: ['id', 'produtoId', 'nome', 'slug', 'preco', 'estoque_tipo', 'tipo_conta', 'duracao', 'garantia_dias', 'descricao_extra', 'stockData', 'quantidadeStock', 'vendas_acumuladas', 'status', 'dataCriacao', 'dataAtualizacao', 'sync_url', 'sync_selector', 'sync_markup', 'sync_last_at'],
  users: ['id', 'comprasIds', 'nome', 'email', 'senha', 'role', 'status', 'saldo', 'emailVerificado', 'telefone', 'ultimoIP', 'dataUltimoLogin', 'estatisticas', 'dataCadastro', 'dataAtualizacao', 'cargo', 'dataCriacao'],
  compras: ['id', 'userId', 'userName', 'productId', 'productName', 'variationId', 'variationName', 'quantity', 'total', 'status', 'metodoEntrega', 'deliveryContent', 'date', 'timeline', 'dateDelivered'],
  banners: ['id', 'imagemUrl', 'link', 'status', 'dataCriacao', 'dataAtualizacao']
};

function sanitizeDataForSupabase(collection, data) {
  const validCols = VALID_COLUMNS[collection];
  if (!validCols) return data;

  const sanitizeItem = (item) => {
    // Mapeamentos e correções de compatibilidade
    if (collection === 'variacoes') {
      if (item.metodoEntrega && !item.estoque_tipo) {
        item.estoque_tipo = item.metodoEntrega;
      }
    }
    if (collection === 'compras') {
      if (item.deliveryContent === undefined || item.deliveryContent === null) {
        item.deliveryContent = [];
      } else if (typeof item.deliveryContent === 'string') {
        item.deliveryContent = [item.deliveryContent];
      }
    }
    if (collection === 'banners' && item.imageUrl && !item.imagemUrl) {
      item.imagemUrl = item.imageUrl;
    }

    const filtered = {};
    validCols.forEach(col => {
      if (item[col] !== undefined) {
        filtered[col] = item[col];
      }
    });
    return filtered;
  };

  if (Array.isArray(data)) {
    return data.map(sanitizeItem);
  }
  return sanitizeItem(data);
}

function mapDataFromSupabase(collection, data) {
  if (!data) return data;

  const mapItem = (item) => {
    if (collection === 'variacoes') {
      if (item.estoque_tipo && !item.metodoEntrega) {
        let metodo = item.estoque_tipo;
        if (metodo === 'AUTOMATICO') metodo = 'AUTOMATICA';
        item.metodoEntrega = metodo;
      }
    }
    if (collection === 'banners' && item.imagemUrl && !item.imageUrl) {
      item.imageUrl = item.imagemUrl;
    }
    return item;
  };

  if (Array.isArray(data)) {
    return data.map(mapItem);
  }
  return mapItem(data);
}

export const api = {
  async get(collection) {
    if (DATABASE_MODE === 'supabase') {
      const { data, error } = await supabase.from(collection).select('*');
      if (error) throw new Error(error.message);
      return mapDataFromSupabase(collection, data);
    } else {
      const response = await fetch(`${API_URL}/${collection}`);
      if (!response.ok) throw new Error('Falha ao buscar dados');
      return response.json();
    }
  },
  
  async save(collection, data) {
    if (DATABASE_MODE === 'supabase') {
      const sanitized = sanitizeDataForSupabase(collection, data);
      const { data: result, error } = await supabase.from(collection).upsert(sanitized).select();
      if (error) throw new Error(error.message);
      return result;
    } else {
      const response = await fetch(`${API_URL}/${collection}`, {
        method: (data.id || Array.isArray(data)) ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao salvar dados');
      return response.json();
    }
  },

  async delete(collection, id) {
    if (DATABASE_MODE === 'supabase') {
      const { error } = await supabase.from(collection).delete().eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    } else {
      const response = await fetch(`${API_URL}/${collection}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Falha ao deletar dados');
      return response.json();
    }
  },

  async patch(collectionWithId, data) {
    if (DATABASE_MODE === 'supabase') {
      const parts = collectionWithId.split('/');
      const collection = parts[0];
      const id = parts[1];
      const sanitized = sanitizeDataForSupabase(collection, data);
      const { data: result, error } = await supabase.from(collection).update(sanitized).eq('id', id).select();
      if (error) throw new Error(error.message);
      return result;
    } else {
      const response = await fetch(`${API_URL}/${collectionWithId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Falha ao atualizar dados');
      return response.json();
    }
  }
};
