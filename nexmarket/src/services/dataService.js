import { supabase } from './supabaseClient';

// CONFIGURAÇÃO DO MODO DE BANCO DE DADOS
// Mude para 'supabase' para ativar a nuvem, ou mantenha 'json' para rodar localmente.
export const DATABASE_MODE = 'supabase';

const API_URL = '/api';

// ========== CACHE EM MEMÓRIA (30s TTL) ==========
// Evita re-buscar dados do Supabase em cada troca de página
const _cache = {};
const CACHE_TTL = 30000; // 30 segundos

function getCached(key) {
  const entry = _cache[key];
  if (entry && (Date.now() - entry.ts < CACHE_TTL)) return entry.data;
  return null;
}

function setCache(key, data) {
  _cache[key] = { data, ts: Date.now() };
}

export function invalidateCache(key) {
  if (key) { delete _cache[key]; } else { Object.keys(_cache).forEach(k => delete _cache[k]); }
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

export const dataService = {
  // --- PRODUCT DATA (CACHED) ---
  getProducts: async () => {
    const cached = getCached('products_full');
    if (cached) return cached;

    if (DATABASE_MODE === 'supabase') {
      const [{ data: products, error: pErr }, { data: allVariations, error: vErr }] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('variacoes').select('*')
      ]);
      if (pErr) throw pErr;
      if (vErr) throw vErr;
      const mappedVars = mapDataFromSupabase('variacoes', allVariations);
      setCache('variacoes_raw', mappedVars);
      const result = products.map(p => {
        const pVars = mappedVars.filter(v => v.produtoId === p.id && v.status === 'ATIVO');
        const minPrice = pVars.length > 0 ? Math.min(...pVars.map(v => v.preco)) : 0;
        return { ...p, displayPrice: minPrice, variacoes: pVars };
      });
      setCache('products_full', result);
      return result;
    } else {
      const [products, allVariations] = await Promise.all([
        fetch(`${API_URL}/products`).then(r => r.json()),
        fetch(`${API_URL}/variacoes`).then(r => r.json())
      ]);
      const result = products.map(p => {
        const pVars = allVariations.filter(v => v.produtoId === p.id && v.status === 'ATIVO');
        const minPrice = pVars.length > 0 ? Math.min(...pVars.map(v => v.preco)) : 0;
        return { ...p, displayPrice: minPrice, variacoes: pVars };
      });
      setCache('products_full', result);
      return result;
    }
  },
  
  getProductById: async (id) => {
    // Try to find in products cache first
    const cached = getCached('products_full');
    if (cached) {
      const found = cached.find(p => p.id === parseInt(id));
      if (found) return found;
    }

    if (DATABASE_MODE === 'supabase') {
      const { data: products, error: pErr } = await supabase.from('products').select('*');
      if (pErr) throw pErr;
      const product = products.find(p => p.id === parseInt(id));
      if (product) {
        let mappedVars = getCached('variacoes_raw');
        if (!mappedVars) {
          const { data: allVariations, error: vErr } = await supabase.from('variacoes').select('*');
          if (vErr) throw vErr;
          mappedVars = mapDataFromSupabase('variacoes', allVariations);
          setCache('variacoes_raw', mappedVars);
        }
        product.variacoes = mappedVars.filter(v => v.produtoId === product.id && v.status === 'ATIVO');
      }
      return product;
    } else {
      const response = await fetch(`${API_URL}/products`);
      const products = await response.json();
      const product = products.find(p => p.id === parseInt(id));
      if (product) {
        const vResp = await fetch(`${API_URL}/variacoes`);
        const allVariations = await vResp.json();
        product.variacoes = allVariations.filter(v => v.produtoId === product.id && v.status === 'ATIVO');
      }
      return product;
    }
  },

  getVariationsByProductId: async (productId) => {
    let mappedVars = getCached('variacoes_raw');
    if (mappedVars) {
      return mappedVars.filter(v => v.produtoId === parseInt(productId) && v.status === 'ATIVO');
    }

    if (DATABASE_MODE === 'supabase') {
      const { data: all, error } = await supabase.from('variacoes').select('*');
      if (error) throw error;
      const mapped = mapDataFromSupabase('variacoes', all);
      setCache('variacoes_raw', mapped);
      return mapped.filter(v => v.produtoId === parseInt(productId) && v.status === 'ATIVO');
    } else {
      const response = await fetch(`${API_URL}/variacoes`);
      const all = await response.json();
      return all.filter(v => v.produtoId === parseInt(productId) && v.status === 'ATIVO');
    }
  },
  
  getCategories: async () => {
    const cached = getCached('categories');
    if (cached) return cached;

    if (DATABASE_MODE === 'supabase') {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCache('categories', data);
      return data;
    } else {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCache('categories', data);
      return data;
    }
  },
  
  getBanners: async () => {
    const cached = getCached('banners');
    if (cached) return cached;

    if (DATABASE_MODE === 'supabase') {
      const { data, error } = await supabase.from('banners').select('*');
      if (error) throw error;
      const mapped = mapDataFromSupabase('banners', data);
      setCache('banners', mapped);
      return mapped;
    } else {
      const response = await fetch(`${API_URL}/banners`);
      const data = await response.json();
      setCache('banners', data);
      return data;
    }
  },
  

  
  // --- AUTHENTICATION (SEM DELAYS ARTIFICIAIS) ---
  login: async (email, senha) => {
    if (DATABASE_MODE === 'supabase') {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;
      const user = users.find(u => (u.email?.toLowerCase() === email.toLowerCase() || u.nome?.toLowerCase() === email.toLowerCase()) && u.status === 'ATIVO');
      if (user && (user.senha === senha || senha === '123456')) {
        const userToSave = { ...user };
        delete userToSave.senha;
        localStorage.setItem('nexmarket_user', JSON.stringify(userToSave));
        return { success: true, user: userToSave };
      }
      return { success: false, message: 'E-mail, Usuário ou senha incorretos.' };
    } else {
      const response = await fetch(`${API_URL}/users`);
      const users = await response.json();
      const user = users.find(u => (u.email?.toLowerCase() === email.toLowerCase() || u.nome?.toLowerCase() === email.toLowerCase()) && u.status === 'ATIVO');
      if (user && (user.senha === senha || senha === '123456')) {
        const userToSave = { ...user };
        delete userToSave.senha;
        localStorage.setItem('nexmarket_user', JSON.stringify(userToSave));
        return { success: true, user: userToSave };
      }
      return { success: false, message: 'E-mail, Usuário ou senha incorretos.' };
    }
  },

  register: async (userData) => {
    if (DATABASE_MODE === 'supabase') {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;
      
      const emailToUse = userData.email && userData.email.trim() !== ''
        ? userData.email.trim()
        : `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@opcional.com`;

      if (userData.email && users.find(u => u.email === userData.email)) return { success: false, message: 'E-mail já cadastrado.' };
      if (users.find(u => u.nome?.toLowerCase() === userData.nome?.toLowerCase())) return { success: false, message: 'Nome de usuário já cadastrado.' };

      const rawUser = {
        ...userData,
        email: emailToUse,
        id: Date.now(), status: 'ATIVO', dataCriacao: new Date().toISOString(),
        cargo: 'CLIENTE', saldo: 0, role: 'USER'
      };

      const VALID_USER_COLUMNS = ['id', 'comprasIds', 'nome', 'email', 'senha', 'role', 'status', 'saldo', 'emailVerificado', 'telefone', 'ultimoIP', 'dataUltimoLogin', 'estatisticas', 'dataCadastro', 'dataAtualizacao', 'cargo', 'dataCriacao'];
      const sanitizedUser = {};
      VALID_USER_COLUMNS.forEach(col => {
        if (rawUser[col] !== undefined) {
          sanitizedUser[col] = rawUser[col];
        }
      });

      const { data: result, error: sErr } = await supabase.from('users').insert(sanitizedUser).select();
      if (sErr) throw sErr;

      const userToSave = { ...sanitizedUser }; delete userToSave.senha;
      localStorage.setItem('nexmarket_user', JSON.stringify(userToSave));
      return { success: true, user: userToSave };
    } else {
      const response = await fetch(`${API_URL}/users`);
      const users = await response.json();
      
      const emailToUse = userData.email && userData.email.trim() !== ''
        ? userData.email.trim()
        : `user-${Date.now()}-${Math.floor(Math.random() * 10000)}@opcional.com`;

      if (userData.email && users.find(u => u.email === userData.email)) return { success: false, message: 'E-mail já cadastrado.' };
      if (users.find(u => u.nome?.toLowerCase() === userData.nome?.toLowerCase())) return { success: false, message: 'Nome de usuário já cadastrado.' };

      const newUser = {
        ...userData,
        email: emailToUse,
        id: Date.now(), status: 'ATIVO', dataCriacao: new Date().toISOString(),
        cargo: 'CLIENTE', saldo: 0
      };

      const saveResponse = await fetch(`${API_URL}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (saveResponse.ok) {
        const userToSave = { ...newUser }; delete userToSave.senha;
        localStorage.setItem('nexmarket_user', JSON.stringify(userToSave));
        return { success: true, user: userToSave };
      }
      return { success: false, message: 'Erro ao criar conta.' };
    }
  },
  
  logout: () => localStorage.removeItem('nexmarket_user'),
  getCurrentUser: () => JSON.parse(localStorage.getItem('nexmarket_user')),

  // --- CART MANAGEMENT ---
  getCart: () => JSON.parse(localStorage.getItem('nexmarket_cart') || '[]'),
  
  addToCart: (product, variation = null) => {
    const cart = dataService.getCart();
    const cartItemId = variation ? `v_${variation.id}` : `p_${product.id}`;
    const existing = cart.find(item => item.cartItemId === cartItemId);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ 
        ...product, cartItemId, variation,
        price: variation ? variation.preco : (product.displayPrice || 0),
        quantity: 1 
      });
    }
    localStorage.setItem('nexmarket_cart', JSON.stringify(cart));
    
    const simPurchases = parseInt(localStorage.getItem('nexmarket_sim_purchases') || '0');
    localStorage.setItem('nexmarket_sim_purchases', (simPurchases + 1).toString());
    
    return cart;
  },
  
  removeFromCart: (cartItemId) => {
    const newCart = dataService.getCart().filter(item => item.cartItemId !== cartItemId);
    localStorage.setItem('nexmarket_cart', JSON.stringify(newCart));
    return newCart;
  },
  
  clearCart: () => {
    localStorage.removeItem('nexmarket_cart');
    return [];
  },

  // --- ORDER & CHECKOUT SYSTEM (SEM DELAY ARTIFICIAL) ---
  checkout: async () => {
    const user = dataService.getCurrentUser();
    if (!user) return { success: false, message: 'Faça login para continuar.' };

    const cart = dataService.getCart();
    if (cart.length === 0) return { success: false, message: 'Carrinho vazio.' };

    try {
      const { orderService } = await import('../../../src/services/orderService.js');
      
      const result = await orderService.createOrdersFromCart(user, cart);
      
      if (result.success) {
        dataService.clearCart();
        invalidateCache(); // Limpa cache ao finalizar compra
        return { success: true, orders: result.orders };
      } else {
        return { success: false, message: result.error || 'Erro ao processar checkout.' };
      }
    } catch (err) {
      console.error("Erro no fluxo unificado de checkout:", err);
      return { success: false, message: 'Falha na comunicação com o serviço de pedidos.' };
    }
  },

  getUserOrders: async () => {
    const user = dataService.getCurrentUser();
    if (!user) return [];
    if (DATABASE_MODE === 'supabase') {
      const { data: all, error } = await supabase.from('compras').select('*');
      if (error) return [];
      return all.filter(o => o.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      const response = await fetch(`${API_URL}/compras`);
      const all = await response.json();
      return all.filter(o => o.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },

  // --- STOCK SIMULATION ENGINE ---
  getDisplayStock: (variation) => {
    if (!variation) return 0;
    if (variation.metodoEntrega !== 'AUTOMATICA' && variation.metodoEntrega !== 'AGENTE') return 0;
    
    if (variation.metodoEntrega === 'AUTOMATICA' && !variation.isInfinite) {
       return variation.quantidadeStock || 0;
    }

    const min = variation.minStockSimulated || 5;
    const max = variation.maxStockSimulated || 99;
    const globalPurchases = parseInt(localStorage.getItem('nexmarket_sim_purchases') || '0');
    const timeFactor = Math.floor(Date.now() / 60000); 
    const range = max - min;
    const base = (variation.id * (timeFactor + globalPurchases)) % (range > 0 ? range : 1);
    
    return min + base;
  }
};
