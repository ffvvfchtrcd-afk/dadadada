import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Package, TrendingDown, TrendingUp, Search, 
  Save, Edit3, Check, X, Settings2, Plus, Minus, ChevronDown, 
  ChevronRight, Filter, Layers, Box
} from 'lucide-react';
import { api } from '@/services/api';
import { Button, Badge, Card, CardHeader, CardContent, EmptyState, ProgressBar } from '@/components/ui';

export default function StockPage() {
  const [variations, setVariations] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [expandedProducts, setExpandedProducts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ quantity: 0, threshold: 5 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [v, p, c] = await Promise.all([
        api.get('variacoes').catch(() => []),
        api.get('products').catch(() => []),
        api.get('categories').catch(() => [])
      ]);
      setVariations(v);
      setProducts(p);
      setCategories(c);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const toggleProduct = (productId) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleStartEdit = (v) => {
    setEditingId(v.id);
    setEditValues({
      stockDataText: v.stockDataText || '',
      threshold: v.minimoStock || 5
    });
  };

  const handleSaveEdit = async (id) => {
    setLoading(true);
    try {
      // Calculate new quantity from lines
      const lines = editValues.stockDataText.split('\n').filter(l => l.trim());
      const newQuantity = lines.length;

      await api.patch(`variacoes/${id}`, {
        stockDataText: editValues.stockDataText,
        quantidadeStock: newQuantity,
        minimoStock: editValues.threshold
      });
      
      setVariations(prev => prev.map(v => 
        v.id === id 
          ? { ...v, stockDataText: editValues.stockDataText, quantidadeStock: newQuantity, minimoStock: editValues.threshold } 
          : v
      ));
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar estoque:", error);
    } finally {
      setLoading(false);
    }
  };

  // Grouping logic
  const groupedProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.categoriaId === parseInt(selectedCategory);
    const matchSearch = !search || p.nome?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  }).map(p => {
    const productVariations = variations.filter(v => v.produtoId === p.id);
    
    // Filter variations based on stock status if needed
    const filteredVariations = productVariations.filter(v => {
      const stock = v.quantidadeStock || 0;
      const threshold = v.minimoStock || 5;
      if (filterStock === 'low') return stock <= threshold && stock > 0;
      if (filterStock === 'out') return stock === 0;
      if (filterStock === 'ok') return stock > threshold;
      return true;
    });

    return {
      ...p,
      variations: filteredVariations,
      allVariations: productVariations
    };
  }).filter(p => p.variations.length > 0);

  const stats = {
    total: variations.reduce((a, v) => a + (v.quantidadeStock || 0), 0),
    low: variations.filter(v => (v.quantidadeStock || 0) <= (v.minimoStock || 5) && (v.quantidadeStock || 0) > 0).length,
    out: variations.filter(v => (v.quantidadeStock || 0) === 0).length
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-accent-blue/10 flex items-center justify-center text-accent-blue border border-accent-blue/20">
              <Box size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Estoque & Variações</h1>
          </div>
          <p className="text-gray-500 text-sm font-medium">Gerencie níveis de estoque e alertas por produto</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-6 mr-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Itens</p>
              <p className="text-xl font-black text-white">{stats.total}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Crítico</p>
              <p className="text-xl font-black text-red-500">{stats.out}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl border-white/5 bg-dark-800 h-10 text-[10px] font-black uppercase tracking-widest">
            Sincronizar
          </Button>
        </div>
      </header>

      {/* Filters Bar */}
      <Card className="border-white/5 bg-dark-800/40 p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por produto..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-200 focus:outline-none focus:border-accent-blue/30 transition-all placeholder:text-gray-600 font-medium" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-dark-950/50 border border-white/5 rounded-xl p-1">
              <div className="px-3 text-gray-500"><Filter size={14} /></div>
              <select 
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-300 py-2 pr-4 outline-none cursor-pointer"
              >
                <option value="all" className="bg-dark-900">Todas Categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-dark-900">{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-dark-950/50 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'ok', label: 'Normal', color: 'green' },
                { id: 'low', label: 'Baixo', color: 'yellow' },
                { id: 'out', label: 'Crítico', color: 'red' }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setFilterStock(t.id)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${
                    filterStock === t.id ? 'bg-accent-blue text-dark-950 shadow-lg shadow-accent-blue/20' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Product List */}
      <div className="space-y-4">
        {groupedProducts.length > 0 ? groupedProducts.map((product) => (
          <Card key={product.id} className="border-white/5 bg-dark-800/20 overflow-hidden">
            <button 
              onClick={() => toggleProduct(product.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 bg-dark-900">
                  <img src={product.icone} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">{product.nome}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" size="xs" className="border-white/5 text-[9px] uppercase tracking-tighter">
                      {product.variations.length} Variações
                    </Badge>
                    {product.variations.some(v => (v.quantidadeStock || 0) <= (v.minimoStock || 5)) && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-yellow-500 uppercase tracking-tighter">
                        <AlertTriangle size={10} /> Precisa Reposição
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right mr-4">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Estoque Total</p>
                  <p className="text-sm font-black text-white">
                    {product.variations.reduce((a, v) => a + (v.quantidadeStock || 0), 0)} un.
                  </p>
                </div>
                {expandedProducts[product.id] ? <ChevronDown className="text-gray-600" /> : <ChevronRight className="text-gray-600" />}
              </div>
            </button>

            <AnimatePresence>
              {expandedProducts[product.id] && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-white/5 bg-dark-950/30"
                >
                  <div className="p-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-dark-950/50 border-b border-white/5">
                          <th className="px-8 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest">Variação</th>
                          <th className="px-6 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest">Nível</th>
                          <th className="px-6 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest">Quantidade</th>
                          <th className="px-6 py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {product.variations.map((v) => {
                          const isEditing = editingId === v.id;
                          const stock = v.quantidadeStock || 0;
                          const threshold = v.minimoStock || 5;
                          const level = stock === 0 ? 'red' : stock <= threshold ? 'yellow' : 'green';
                          
                          return (
                            <tr key={v.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  {v.icone && <img src={v.icone} alt="" className="w-6 h-6 rounded-lg object-cover border border-white/5" />}
                                  <span className="text-xs font-bold text-gray-200">{v.nome}</span>
                                </div>
                              </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea 
                                value={editValues.stockDataText}
                                onChange={e => setEditValues(p => ({ ...p, stockDataText: e.target.value }))}
                                placeholder="Ponto de entrega:senha..."
                                className="w-full bg-dark-950 border border-white/10 rounded-xl py-2 px-3 text-[11px] font-medium focus:outline-none focus:border-accent-blue/50 custom-scrollbar resize-none h-20 min-w-[200px]"
                              />
                              <div className="flex items-center justify-between text-[9px] font-black text-gray-500 uppercase px-1">
                                <span>{editValues.stockDataText.split('\n').filter(l => l.trim()).length} itens detectados</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-20">
                                <ProgressBar value={stock} max={Math.max(stock, threshold * 2)} color={level} />
                              </div>
                              <span className={`text-[9px] font-black uppercase text-${level}-500`}>
                                {stock === 0 ? 'Crítico' : stock <= threshold ? 'Baixo' : 'Normal'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2 bg-dark-950 p-1 rounded-xl border border-white/10 w-24">
                                <button onClick={() => setEditValues(p => ({ ...p, threshold: Math.max(0, p.threshold - 1) }))} className="p-1 hover:bg-white/5 rounded-lg text-gray-500"><Minus size={12} /></button>
                                <input type="number" value={editValues.threshold} onChange={e => setEditValues(p => ({ ...p, threshold: parseInt(e.target.value) || 0 }))} className="w-full bg-transparent text-center text-xs font-bold focus:outline-none" />
                                <button onClick={() => setEditValues(p => ({ ...p, threshold: p.threshold + 1 }))} className="p-1 hover:bg-white/5 rounded-lg text-gray-500"><Plus size={12} /></button>
                              </div>
                              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest px-1">Alertar em</span>
                            </div>
                          ) : (
                            <span className="text-xs font-black text-white">{stock} <span className="text-gray-600 ml-1">un.</span></span>
                          )}
                        </td>
                              <td className="px-6 py-4 text-right">
                                {isEditing ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <button onClick={() => handleSaveEdit(v.id)} disabled={loading} className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"><Check size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"><X size={14} /></button>
                                  </div>
                                ) : (
                                  <button onClick={() => handleStartEdit(v)} className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-accent-blue hover:bg-accent-blue/10 transition-all"><Settings2 size={14} /></button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )) : (
          <EmptyState 
            icon={<Layers className="w-16 h-16 opacity-20" />} 
            title="Nenhum produto para exibir" 
            description="Tente mudar os filtros de categoria ou busca."
          />
        )}
      </div>
    </div>
  );
}
