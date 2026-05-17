import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Package, Filter, Eye, MoreVertical, Copy } from 'lucide-react';
import { api } from '@/services/api';
import { Button, Badge, Card, CardHeader, CardContent, EmptyState, Pagination, Input, Select } from '@/components/ui';
import { useDebounce } from '@/hooks';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function ProductsList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variations, setVariations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    Promise.all([
      api.get('products').catch(() => []),
      api.get('categories').catch(() => []),
      api.get('variacoes').catch(() => []),
    ]).then(([p, c, v]) => { setProducts(p); setCategories(c); setVariations(v); });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    try {
      await api.delete('products', id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleDuplicate = async (product) => {
    const newId = Date.now();
    const dup = { ...product, id: newId, nome: `${product.nome} (Cópia)`, slug: `${product.slug}-copy`, dataCriacao: new Date().toISOString(), dataAtualizacao: new Date().toISOString() };
    await api.save('products', dup);
    setProducts([...products, dup]);
  };

  const filtered = products.filter(p => {
    if (debouncedSearch && !p.nome?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
    if (filterCategory && p.categoriaId !== Number(filterCategory)) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  const getStockCount = (productId) => {
    return variations.filter(v => v.produtoId === productId).reduce((a, v) => a + (v.quantidadeStock || 0), 0);
  };

  const getCategoryName = (id) => categories.find(c => c.id === id)?.nome || '—';

  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Produtos</h1>
          <p className="text-gray-400 mt-1">{products.length} produtos cadastrados</p>
        </div>
        <Link to="/admin/products/new">
          <Button icon={<Plus className="w-4 h-4" />}>Novo Produto</Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Buscar produtos..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600/50 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50 placeholder:text-gray-600" />
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              options={[{ value: '', label: 'Todas categorias' }, ...categories.map(c => ({ value: c.id, label: c.nome }))]} />
            <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              options={[{ value: '', label: 'Todos status' }, { value: 'ATIVO', label: 'Ativo' }, { value: 'INATIVO', label: 'Inativo' }]} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length > 0 ? (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-dark-800/30 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Produto</th>
                    <th className="px-6 py-3 font-medium hidden md:table-cell">Categoria</th>
                    <th className="px-6 py-3 font-medium hidden lg:table-cell">Estoque</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium hidden sm:table-cell">Criado em</th>
                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600/20">
                  {filtered.map((product, i) => (
                    <motion.tr key={product.id} variants={item} className="hover:bg-dark-700/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-dark-800 border border-dark-600/30 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {product.icone ? <img src={product.icone} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate max-w-[200px]">{product.nome}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{product.miniDesc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-400">{getCategoryName(product.categoriaId)}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {(() => {
                          const stock = getStockCount(product.id);
                          return <Badge variant={stock <= 3 ? 'danger' : stock <= 10 ? 'warning' : 'success'} size="xs">{stock} un.</Badge>;
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={product.status === 'ATIVO' ? 'success' : 'danger'} size="xs" dot>{product.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                        {new Date(product.dataCriacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link to={`/admin/products/${product.id}`} className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-brand-400 transition-colors" title="Editar"><Edit className="w-4 h-4" /></Link>
                          <Link to={`/admin/preview/${product.id}`} className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-gray-300 transition-colors" title="Visualizar"><Eye className="w-4 h-4" /></Link>
                          <button onClick={() => handleDuplicate(product)} className="p-2 rounded-lg hover:bg-dark-700/50 text-gray-500 hover:text-gray-300 transition-colors" title="Duplicar"><Copy className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={<Package className="w-12 h-12" />} title="Nenhum produto encontrado" description="Tente ajustar os filtros ou crie um novo produto."
              action={<Link to="/admin/products/new"><Button icon={<Plus className="w-4 h-4" />}>Novo Produto</Button></Link>} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
