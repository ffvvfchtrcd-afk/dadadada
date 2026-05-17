import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Eye, X, Package, CreditCard, Clock, ChevronRight, 
  Filter, ArrowDownUp, Calendar, Send, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '@/services/api';
import { deliveryService } from '@/services/deliveryService';
import { Button, Badge, Card, CardHeader, CardContent, Modal, EmptyState, Tabs, Textarea } from '@/components/ui';

const statusColors = { 
  ENTREGUE: 'success', 
  PROCESSANDO: 'accent-blue', 
  AGUARDANDO_PAGAMENTO: 'warning', 
  CANCELADO: 'danger' 
};

export default function SalesList() {
  const [sales, setSales] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryInput, setDeliveryInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // Auto-refresh a cada 5 segundos para tempo real
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [c, u] = await Promise.all([
        api.get('compras').catch(() => []),
        api.get('users').catch(() => []),
      ]);
      setSales(c);
      setUsers(u);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  const filtered = sales.filter(s => {
    const matchSearch = !search || s.id.toLowerCase().includes(search.toLowerCase()) || s.userName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const tabs = [
    { id: 'all', label: 'Todos', count: sales.length },
    { id: 'PROCESSANDO', label: 'Pendentes/Agente', count: sales.filter(s => s.status === 'PROCESSANDO').length },
    { id: 'ENTREGUE', label: 'Entregues', count: sales.filter(s => s.status === 'ENTREGUE').length },
    { id: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando', count: sales.filter(s => s.status === 'AGUARDANDO_PAGAMENTO').length },
  ];

  const handleManualDelivery = async () => {
    if (!deliveryInput.trim()) return alert('Insira o conteúdo da entrega.');
    setLoading(true);
    try {
      let result;
      if (selectedSale.metodoEntrega === 'AGENTE') {
        result = await deliveryService.processAgent(selectedSale.id, deliveryInput);
      } else {
        result = await deliveryService.processManual(selectedSale.id, deliveryInput);
      }

      if (result.success) {
        await fetchData();
        setSelectedSale(null);
        setDeliveryInput('');
      } else {
        alert('Erro ao processar entrega: ' + result.error);
      }
    } catch (err) {
      alert('Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Gestão de Pedidos</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Fila de entregas e processamento de vendas</p>
        </div>
        <div className="flex items-center gap-3 bg-dark-800/40 p-2 rounded-2xl border border-white/5">
          <div className="px-4 py-2 border-r border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase">Total Vendas</p>
            <p className="text-lg font-black text-white">R$ {sales.filter(s => s.status === 'ENTREGUE').reduce((a, b) => a + (b.total || 0), 0).toFixed(2)}</p>
          </div>
          <div className="px-4 py-2">
            <p className="text-[10px] font-black text-gray-500 uppercase">Aguardando</p>
            <p className="text-lg font-black text-accent-blue">{sales.filter(s => s.status === 'PROCESSANDO').length}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <Tabs tabs={tabs} activeTab={statusFilter} onChange={setStatusFilter} />
            <div className="relative flex-1 max-w-sm ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="ID ou Cliente..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-dark-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50" 
              />
            </div>
          </div>

          <Card className="border-white/5 bg-dark-800/20 overflow-hidden">
            <CardContent className="p-0">
              {filtered.length > 0 ? (
                <div className="divide-y divide-white/[0.03]">
                  {filtered.map((sale) => (
                    <div 
                      key={sale.id} 
                      onClick={() => { setSelectedSale(sale); setDeliveryInput(sale.deliveryTemplate || ''); }}
                      className="group p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl bg-dark-900 border border-white/5 flex items-center justify-center transition-all group-hover:border-brand-500/30 ${sale.status === 'PROCESSANDO' ? 'animate-pulse' : ''}`}>
                          <Package className={`w-6 h-6 ${sale.status === 'PROCESSANDO' ? 'text-accent-blue' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black text-white">{sale.id}</span>
                            <Badge variant={sale.metodoEntrega === 'AUTOMATICA' ? 'success' : sale.metodoEntrega === 'AGENTE' ? 'info' : 'warning'} size="xs">
                              {sale.metodoEntrega}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{sale.userName} • {sale.productName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-10">
                        <div className="text-right">
                          <p className="text-base font-black text-white">R$ {(sale.total || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <Badge variant={statusColors[sale.status] || 'default'} size="sm">
                          {sale.status === 'AGUARDANDO_PAGAMENTO' ? 'PAGAMENTO' : sale.status}
                        </Badge>
                        <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<Package size={48} />} title="Nenhum pedido encontrado" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {selectedSale && (
          <Modal isOpen={!!selectedSale} onClose={() => setSelectedSale(null)} title={`Detalhes do Pedido ${selectedSale.id}`} size="xl">
            <div className="p-8 space-y-8">
              {/* Timeline Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente</p>
                  <p className="text-lg font-black text-white">{selectedSale.userName}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Produto / Variação</p>
                  <p className="text-sm font-black text-brand-400">{selectedSale.productName} ({selectedSale.variationName})</p>
                </div>
              </div>

              {/* Delivery Actions */}
              {(selectedSale.status === 'PROCESSANDO' || selectedSale.metodoEntrega !== 'AUTOMATICA') && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Send size={14} className="text-accent-blue" /> Processar Entrega
                  </h4>
                  <div className="p-6 rounded-2xl bg-accent-blue/5 border border-accent-blue/10 space-y-4">
                    <Textarea 
                      label="Conteúdo da Entrega" 
                      value={deliveryInput} 
                      onChange={e => setDeliveryInput(e.target.value)} 
                      placeholder="Insira os dados da conta, chaves ou mensagem para o cliente..."
                      rows={5}
                    />
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] text-gray-500 italic">O usuário verá este conteúdo instantaneamente no perfil dele.</p>
                       <Button onClick={handleManualDelivery} loading={loading} className="bg-accent-blue text-dark-950 font-black text-[10px] uppercase tracking-widest">
                         Finalizar Entrega
                       </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivered Content View */}
              {selectedSale.status === 'ENTREGUE' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500" /> Conteúdo Entregue
                  </h4>
                  <pre className="p-6 rounded-2xl bg-dark-900 border border-white/5 font-mono text-sm text-brand-400 overflow-x-auto">
                    {selectedSale.deliveryContent}
                  </pre>
                </div>
              )}

              {/* General Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Método</p>
                  <p className="text-xs font-black text-white">{selectedSale.metodoEntrega}</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Total</p>
                  <p className="text-xs font-black text-white">R$ {selectedSale.total?.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Data Compra</p>
                  <p className="text-xs font-black text-white">{new Date(selectedSale.date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 rounded-2xl bg-dark-800/40 border border-white/5">
                  <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Status Final</p>
                  <p className="text-xs font-black text-green-500">{selectedSale.status}</p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 border-t border-white/5 flex justify-end gap-3 bg-dark-900/50">
              <Button variant="outline" onClick={() => setSelectedSale(null)} className="text-[10px] font-black uppercase tracking-widest border-white/5">Fechar</Button>
              {selectedSale.status === 'AGUARDANDO_PAGAMENTO' && (
                <Button className="bg-brand-500 text-dark-950 font-black text-[10px] uppercase tracking-widest">Forçar Aprovação</Button>
              )}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
