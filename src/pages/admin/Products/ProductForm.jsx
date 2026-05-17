import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Plus, Trash2, Check, ChevronRight,
  ImageIcon, Tag, DollarSign, Package, X,
  AlertCircle, Copy, Sparkles, Box, Layout, Settings, Globe
} from 'lucide-react';
import { api } from '@/services/api';
import {
  Button, Input, Textarea, Select, Badge, Card, CardContent,
  Toggle, Divider, RichTextEditor
} from '@/components/ui';

const tabs = [
  { id: 'info', label: 'Geral', icon: Layout },
  { id: 'variations', label: 'Variações & Estoque', icon: Sparkles },
  { id: 'seo', label: 'Configurações & SEO', icon: Globe },
];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [activeTab, setActiveTab] = useState('info');
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const [product, setProduct] = useState({
    nome: '', slug: '', categoriaId: '', icone: '', imagens: [],
    miniDesc: '', descricao: '', status: 'ATIVO', tagsTexto: '',
    destaque: false,
  });

  const [variations, setVariations] = useState([]);

  useEffect(() => {
    api.get('categories').catch(() => []).then(setCategories);
    if (isEditing) fetchProductData();
  }, [id]);

  const fetchProductData = async () => {
    try {
      const [allProducts, allVariations] = await Promise.all([
        api.get('products'), api.get('variacoes'),
      ]);
      const prod = allProducts.find(p => p.id === Number(id));
      if (prod) {
        setProduct({
          ...prod, categoriaId: prod.categoriaId || '',
          tagsTexto: prod.tags ? prod.tags.join(', ') : '',
          imagens: prod.imagens || [], destaque: prod.destaque || false,
        });
      }
      const prodVars = allVariations.filter(v => v.produtoId === Number(id));
      setVariations(prodVars.map(v => ({ 
        ...v, 
        stockDataText: v.stockData ? v.stockData.join('\n') : '',
        metodoEntrega: v.metodoEntrega || 'AUTOMATICA'
      })));
    } catch (err) { console.error(err); }
  };

  const updateProduct = (field, value) => {
    setProduct(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'nome' && !isEditing) {
        next.slug = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      return next;
    });
  };

  const addVariation = () => {
    setVariations(prev => [...prev, {
      id: `var_${Date.now()}`, 
      produtoId: Number(id) || Date.now(),
      nome: '', 
      preco: 0, 
      status: 'ATIVO', 
      metodoEntrega: 'AUTOMATICA', 
      descricao_extra: '', 
      descricao: '',
      icone: '', 
      stockDataText: '', 
      isInfinite: false,
      minStockSimulated: 5,
      maxStockSimulated: 99,
      garantia_dias: 7
    }]);
    setActiveTab('variations');
  };

  const updateVariation = (varId, field, value) => {
    setVariations(prev => prev.map(v => v.id === varId ? { ...v, [field]: value } : v));
  };

  const handleSave = async () => {
    if (!product.nome) return alert('O nome do produto é obrigatório.');
    
    setSaving(true);
    try {
      const prodId = isEditing ? Number(id) : Date.now();
      const { tagsTexto, ...rest } = product;
      const payload = {
        ...rest, 
        categoriaId: Number(product.categoriaId) || 1,
        tags: tagsTexto ? tagsTexto.split(',').map(t => t.trim()).filter(Boolean) : [],
        id: prodId, 
        dataAtualizacao: new Date().toISOString(),
        ...(!isEditing && { dataCriacao: new Date().toISOString() }),
      };
      await api.save('products', payload);

      const allVariations = await api.get('variacoes').catch(() => []);
      const others = allVariations.filter(v => v.produtoId !== prodId);
      const updated = variations.map(v => ({
        ...v, 
        produtoId: prodId,
        stockData: v.stockDataText ? v.stockDataText.split('\n').filter(l => l.trim()) : [],
        quantidadeStock: v.stockDataText ? v.stockDataText.split('\n').filter(l => l.trim()).length : 0,
        dataAtualizacao: new Date().toISOString(),
      }));
      await api.save('variacoes', [...others, ...updated]);
      
      navigate('/admin/products');
    } catch (err) { 
      console.error(err); 
      alert('Erro ao salvar produto.'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-400 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{product.nome || 'Rascunho'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/products')} className="border-white/5 bg-dark-800 text-[10px] font-black uppercase tracking-widest">
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} className="bg-brand-500 text-dark-950 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-500/20">
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-dark-800/40 border border-white/5 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-brand-500 text-dark-950 shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={14} strokeWidth={3} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <Card className="border-white/5 bg-dark-800/20">
                  <CardContent className="p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Input label="Nome do Produto" value={product.nome} onChange={e => updateProduct('nome', e.target.value)} placeholder="Ex: Conta Netflix Premium" />
                      <Select label="Categoria" value={product.categoriaId} onChange={e => updateProduct('categoriaId', e.target.value)}
                        options={[{ value: '', label: 'Selecionar categoria...' }, ...categories.map(c => ({ value: c.id, label: c.nome }))]} />
                    </div>
                    <Textarea label="Mini Descrição (Vitrine)" value={product.miniDesc} onChange={e => updateProduct('miniDesc', e.target.value)} placeholder="Texto curto que aparece nos cards..." rows={2} />
                    <RichTextEditor label="Descrição Completa" value={product.descricao} onChange={val => updateProduct('descricao', val)} />
                  </CardContent>
                </Card>

                <Card className="border-white/5 bg-dark-800/20">
                  <CardContent className="p-8 space-y-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={16} className="text-brand-400" /> Identidade Visual
                    </h3>
                    <Input label="URL da Imagem de Capa" value={product.icone} onChange={e => updateProduct('icone', e.target.value)} placeholder="https://..." />
                    {product.icone && (
                      <div className="aspect-video rounded-2xl overflow-hidden border border-white/5 bg-dark-900">
                        <img src={product.icone} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'variations' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-black text-white">{variations.length} Variações Ativas</h2>
                  <Button onClick={addVariation} size="sm" className="bg-white text-dark-950 font-black text-[10px] uppercase tracking-widest">
                    <Plus size={14} className="mr-2" /> Adicionar Opção
                  </Button>
                </div>

                {variations.map((v, idx) => (
                  <Card key={v.id} className="border-white/5 bg-dark-800/20 overflow-hidden group">
                    <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-brand-500 text-dark-950 flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </div>
                        <input 
                          type="text" 
                          value={v.nome} 
                          onChange={e => updateVariation(v.id, 'nome', e.target.value)} 
                          placeholder="Nome da Variação (ex: 30 Dias 4K)"
                          className="bg-transparent text-lg font-black text-white outline-none placeholder:text-gray-700 w-full md:w-64" 
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setVariations(prev => [...prev, { ...v, id: `var_${Date.now()}`, nome: `${v.nome} (Cópia)` }])} className="p-2 text-gray-500 hover:text-white transition-colors"><Copy size={16} /></button>
                        <button onClick={() => setVariations(prev => prev.filter(item => item.id !== v.id))} className="p-2 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid md:grid-cols-3 gap-6">
                        <Input label="Preço (R$)" type="number" value={v.preco} onChange={e => updateVariation(v.id, 'preco', Number(e.target.value))} icon={<DollarSign size={14} />} />
                        <Select label="Método de Entrega" value={v.metodoEntrega} onChange={e => updateVariation(v.id, 'metodoEntrega', e.target.value)}
                          options={[
                            { value: 'AUTOMATICA', label: 'Entrega Automática (Estoque)' },
                            { value: 'MANUAL', label: 'Entrega Manual (Admin Envia)' },
                            { value: 'AGENTE', label: 'Entrega Agente (Simula Auto)' }
                          ]} />
                        <Input label="Garantia (Dias)" type="number" value={v.garantia_dias} onChange={e => updateVariation(v.id, 'garantia_dias', Number(e.target.value))} />
                      </div>

                      {/* Dynamic Content based on Delivery Method */}
                      <div className="p-6 rounded-2xl bg-dark-950/50 border border-white/5 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${v.metodoEntrega === 'AUTOMATICA' ? 'bg-green-500' : v.metodoEntrega === 'MANUAL' ? 'bg-yellow-500' : 'bg-accent-blue'}`} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Configurações de {v.metodoEntrega}</h4>
                        </div>

                        {v.metodoEntrega === 'AUTOMATICA' && (
                          <div className="space-y-4">
                            <Textarea 
                              label="Estoque Real (1 item por linha)" 
                              value={v.stockDataText} 
                              onChange={e => updateVariation(v.id, 'stockDataText', e.target.value)} 
                              placeholder="exemplo@email.com:senha123"
                              rows={4}
                            />
                            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Total Detectado: {v.stockDataText ? v.stockDataText.split('\n').filter(l => l.trim()).length : 0} itens</p>
                          </div>
                        )}

                        {v.metodoEntrega === 'AGENTE' && (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-6">
                              <Toggle label="Simular Estoque Infinito" enabled={v.isInfinite} onChange={val => updateVariation(v.id, 'isInfinite', val)} />
                              {v.isInfinite && (
                                <div className="flex gap-4">
                                  <div className="w-24"><Input label="Mín" type="number" value={v.minStockSimulated} onChange={e => updateVariation(v.id, 'minStockSimulated', parseInt(e.target.value))} /></div>
                                  <div className="w-24"><Input label="Máx" type="number" value={v.maxStockSimulated} onChange={e => updateVariation(v.id, 'maxStockSimulated', parseInt(e.target.value))} /></div>
                                </div>
                              )}
                            </div>
                            <Textarea label="Template de Entrega Rápida" value={v.deliveryTemplate || ''} onChange={e => updateVariation(v.id, 'deliveryTemplate', e.target.value)} placeholder="Este texto será pré-preenchido para você enviar ao usuário." rows={3} />
                          </div>
                        )}

                        {v.metodoEntrega === 'MANUAL' && (
                          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-yellow-500/80 text-[11px] font-medium leading-relaxed italic">
                            O método manual não requer estoque prévio. Você deverá realizar a entrega manualmente no painel de pedidos após a confirmação do pagamento.
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <Input label="URL da Imagem da Opção (Opcional)" value={v.icone} onChange={e => updateVariation(v.id, 'icone', e.target.value)} />
                        <Input label="Descrição Curta (ex: 4K Ultra HD)" value={v.descricao_extra} onChange={e => updateVariation(v.id, 'descricao_extra', e.target.value)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}

            {activeTab === 'seo' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <Card className="border-white/5 bg-dark-800/20">
                  <CardContent className="p-8 space-y-6">
                    <Select label="Status Global do Produto" value={product.status} onChange={e => updateProduct('status', e.target.value)}
                      options={[{ value: 'ATIVO', label: 'Ativo (Visível na Loja)' }, { value: 'INATIVO', label: 'Inativo (Oculto)' }, { value: 'RASCUNHO', label: 'Rascunho' }]} />
                    <Input label="Tags SEO (Separadas por vírgula)" value={product.tagsTexto} onChange={e => updateProduct('tagsTexto', e.target.value)} placeholder="netflix, streaming, premium" />
                    <Toggle label="Colocar em Destaque na Home" enabled={product.destaque} onChange={val => updateProduct('destaque', val)} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          <Card className="border-white/5 bg-dark-800/40 p-6 sticky top-32">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Resumo da Configuração</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Variações</span>
                <span className="text-white font-black">{variations.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Entrega Auto</span>
                <span className="text-green-500 font-black">{variations.filter(v => v.metodoEntrega === 'AUTOMATICA').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Entrega Agente</span>
                <span className="text-accent-blue font-black">{variations.filter(v => v.metodoEntrega === 'AGENTE').length}</span>
              </div>
              <Divider className="my-2" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Status</span>
                <Badge variant={product.status === 'ATIVO' ? 'success' : 'warning'} size="xs">{product.status}</Badge>
              </div>
            </div>
            <Button onClick={handleSave} loading={saving} className="w-full mt-8 bg-brand-500 text-dark-950 font-black text-[10px] uppercase tracking-widest !py-4 shadow-glow-brand">
              Salvar Produto
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
