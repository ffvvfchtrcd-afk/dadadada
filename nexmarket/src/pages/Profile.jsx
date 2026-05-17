import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Package, Settings, LogOut, Shield, ChevronRight, Clock, Star, Copy, Check, ExternalLink } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const u = dataService.getCurrentUser();
      if (!u) {
        navigate('/login');
        return;
      }
      setUser(u);
      
      try {
        const orderData = await dataService.getUserOrders();
        setOrders(orderData);
      } catch (err) {
        console.error("Erro ao carregar pedidos:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    const interval = setInterval(fetchUserData, 3000); // Polling a cada 3 segundos
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    dataService.logout();
    window.dispatchEvent(new Event('app-state-change'));
    navigate('/');
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return (
    <div className="container py-48 flex justify-center">
      <div className="w-16 h-16 border-4 border-white/5 border-t-accent-blue rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="container-premium pt-[88px] sm:pt-32 pb-32">
      <div className="grid lg:grid-cols-4 gap-12 items-start">
        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6 lg:sticky lg:top-32"
        >
          <div className="card-premium p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue to-accent-purple" />
            <div className="w-24 h-24 rounded-3xl bg-dark-900 border border-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <User size={48} className="text-accent-blue" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black text-white mb-1">{user.nome}</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{user.cargo || 'Cliente Premium'}</p>
            
            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Saldo</span>
                <span className="text-green-500">R$ {user.saldo?.toFixed(2) || '0.00'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/5 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <LogOut size={14} /> Sair da Conta
              </button>
            </div>
          </div>

          <div className="card-premium overflow-hidden border-white/5">
            <div className="p-4 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white/5">
              Menu da Conta
            </div>
            <div className="p-2">
              {[
                { label: 'Meus Pedidos', icon: Package, active: true },
                { label: 'Segurança', icon: Shield },
                { label: 'Configurações', icon: Settings },
              ].map((item, i) => (
                <button key={i} className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${item.active ? 'bg-accent-blue/10 text-accent-blue' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className={item.active ? 'text-accent-blue' : 'text-slate-400 group-hover:text-white'} />
                    <span className="font-bold text-xs uppercase tracking-wider">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-20" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 space-y-8"
        >
          {/* Header Banner */}
          <div className="card-premium p-10 relative overflow-hidden bg-dark-800/20 border-accent-blue/10">
            <div className="relative z-10">
              <h1 className="text-4xl font-black mb-4 tracking-tight">Olá, {user.nome.split(' ')[0]}!</h1>
              <p className="text-slate-400 max-w-lg mb-8 leading-relaxed font-bold uppercase text-[10px] tracking-widest">
                Central de Clientes NexMarket • Acesse seus produtos digitais e gerencie sua conta premium.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos Totais</span>
                  <span className="text-2xl font-black text-white">{orders.length}</span>
                </div>
                <div className="w-px h-10 bg-white/5 mx-4" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Disponível</span>
                  <span className="text-2xl font-black text-green-500">R$ {user.saldo?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 blur-[100px] rounded-full" />
          </div>

          {/* Orders Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Clock size={24} className="text-accent-blue" /> Histórico de Compras
              </h2>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="card-premium border-white/5 bg-dark-900/40 overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-dark-900 border border-white/5 flex items-center justify-center text-accent-blue font-black text-xs">
                          {order.id.slice(0, 3)}
                        </div>
                        <div>
                          <div className="text-base font-black text-white mb-0.5">{order.productName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                            <span>{order.variationName}</span>
                            <span>•</span>
                            <span>{new Date(order.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-12">
                        <div className="text-right">
                          <div className="text-sm font-black text-white">R$ {order.total.toFixed(2)}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Pago</div>
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                          {order.status}
                        </div>
                        <button 
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                          className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all ${expandedOrder === order.id ? 'rotate-90' : ''}`}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedOrder === order.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 bg-dark-950/40"
                        >
                          <div className="p-8">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Conteúdo da Entrega</h3>
                              <div className="text-[10px] font-black text-accent-blue uppercase tracking-widest">ID do Pedido: {order.id}</div>
                            </div>
                            
                            <div className="relative group">
                              <pre className="bg-dark-900 border border-white/5 rounded-2xl p-6 text-sm font-mono text-accent-blue overflow-x-auto custom-scrollbar leading-relaxed">
                                {order.deliveryContent}
                              </pre>
                              <button 
                                onClick={() => copyToClipboard(order.deliveryContent, order.id)}
                                className="absolute top-4 right-4 p-2 rounded-lg bg-dark-800 text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl"
                              >
                                {copiedId === order.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                              </button>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                              <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                                <Shield size={14} /> Garantia Vitalícia
                              </button>
                              <button className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                                <ExternalLink size={14} /> Instruções de Uso
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-premium p-20 text-center border-white/5 bg-dark-900/20">
                <div className="w-20 h-20 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-6 border border-white/5 opacity-40">
                  <Package size={40} className="text-slate-600" />
                </div>
                <h3 className="text-xl font-black mb-2">Nenhum pedido encontrado</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Suas compras aparecerão aqui após a confirmação.</p>
                <button onClick={() => navigate('/')} className="mt-8 btn-premium btn-premium-primary !py-3 px-8 text-xs">
                  Começar a Comprar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
