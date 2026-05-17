import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign, ShoppingBag, Users, Package, TrendingUp, ArrowUpRight,
  ArrowDownRight, AlertTriangle, Clock, Zap, Plus, Eye, BarChart3,
  Tag, Image, Settings, ChevronRight,
} from 'lucide-react';
import { api } from '@/services/api';
import { StatCard, Card, CardHeader, CardContent, Badge, Skeleton, Button } from '@/components/ui';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardHome() {
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [compras, users, products, variacoes, categories] = await Promise.all([
          api.get('compras').catch(() => []),
          api.get('users').catch(() => []),
          api.get('products').catch(() => []),
          api.get('variacoes').catch(() => []),
          api.get('categories').catch(() => []),
        ]);

        const revenue = compras.filter(c => c.status === 'APROVADO').reduce((a, c) => a + (c.valorTotal || 0), 0);
        const totalStock = variacoes.reduce((a, v) => a + (v.quantidadeStock || 0), 0);
        const lowStock = variacoes.filter(v => (v.quantidadeStock || 0) <= 3 && v.status === 'ATIVO');
        const recentOrders = [...compras].sort((a, b) => new Date(b.dataCompra) - new Date(a.dataCompra)).slice(0, 5);

        const productSales = {};
        compras.filter(c => c.status === 'APROVADO').forEach(c => {
          c.itens?.forEach(item => {
            productSales[item.nome] = (productSales[item.nome] || 0) + item.quantidade;
          });
        });
        const topProducts = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 5);

        setData({ loading: false, revenue, compras, users, products, variacoes, categories, totalStock, lowStock, recentOrders, topProducts });
      } catch (err) {
        console.error(err);
        setData({ loading: false, revenue: 0, compras: [], users: [], products: [], variacoes: [], categories: [], totalStock: 0, lowStock: [], recentOrders: [], topProducts: [] });
      }
    };
    fetch();
  }, []);

  if (data.loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Card key={i} className="p-5"><Skeleton lines={3} /></Card>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6"><Skeleton lines={5} /></Card>
          <Card className="p-6"><Skeleton lines={5} /></Card>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { label: 'Novo Produto', path: '/admin/products/new', icon: Plus, color: 'brand' },
    { label: 'Ver Pedidos', path: '/admin/sales', icon: Eye, color: 'green' },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3, color: 'purple' },
    { label: 'Cupons', path: '/admin/coupons', icon: Tag, color: 'yellow' },
    { label: 'Banners', path: '/admin/banners', icon: Image, color: 'orange' },
    { label: 'Configurações', path: '/admin/settings', icon: Settings, color: 'default' },
  ];

  const statusColors = {
    APROVADO: 'success', PENDENTE: 'warning', AGUARDANDO: 'warning',
    CANCELADO: 'danger', REEMBOLSADO: 'purple',
  };

  return (
    <motion.div className="space-y-8" variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Visão geral da sua loja digital.</p>
        </div>
        <Link to="/admin/products/new">
          <Button icon={<Plus className="w-4 h-4" />}>Novo Produto</Button>
        </Link>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita Total" value={`R$ ${data.revenue.toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} trend="up" trendValue="+12.5%" color="green" />
        <StatCard title="Pedidos" value={data.compras.length} icon={<ShoppingBag className="w-5 h-5" />} trend="up" trendValue="+8.2%" color="brand" />
        <StatCard title="Clientes" value={data.users.length} icon={<Users className="w-5 h-5" />} trend="up" trendValue="+3.1%" color="purple" />
        <StatCard title="Produtos" value={data.products.length} icon={<Package className="w-5 h-5" />} color="orange" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">Pedidos Recentes</h2>
              <Link to="/admin/sales" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">Ver todos <ChevronRight className="w-4 h-4" /></Link>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentOrders.length > 0 ? (
                <div className="divide-y divide-dark-600/20">
                  {data.recentOrders.map(order => (
                    <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-dark-700/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-dark-600/50 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-mono text-gray-200">{order.id}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{new Date(order.dataCompra).toLocaleDateString('pt-BR')} às {new Date(order.dataCompra).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={statusColors[order.status] || 'default'} size="xs">{order.status}</Badge>
                        <p className="text-sm font-semibold text-white">R$ {(order.valorTotal || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">Nenhum pedido ainda.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">Atalhos Rápidos</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickLinks.map((link, i) => (
                <Link key={i} to={link.path} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 border border-dark-600/20 hover:border-dark-500/30 transition-all text-sm text-gray-300 hover:text-white">
                  <link.icon className="w-4 h-4 text-gray-500" /> {link.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {data.lowStock.length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> Estoque Baixo
                </h2>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-dark-600/20">
                  {data.lowStock.map(v => (
                    <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                      <p className="text-sm text-gray-300 truncate flex-1">{v.nome}</p>
                      <Badge variant="danger" size="xs">{v.quantidadeStock} un.</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">Produtos Mais Vendidos</h2>
            </CardHeader>
            <CardContent className="p-0">
              {data.topProducts.length > 0 ? (
                <div className="divide-y divide-dark-600/20">
                  {data.topProducts.map(([name, qty], i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-dark-600/50 flex items-center justify-center text-xs font-bold text-gray-400">{i + 1}</span>
                        <p className="text-sm text-gray-200">{name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{qty} vendas</span>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500 text-sm">Nenhuma venda registrada.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-white">Resumo do Estoque</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-600/20">
                  <p className="text-xs text-gray-500 mb-1">Total em Estoque</p>
                  <p className="text-2xl font-bold text-white">{data.totalStock}</p>
                </div>
                <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-600/20">
                  <p className="text-xs text-gray-500 mb-1">Variações Ativas</p>
                  <p className="text-2xl font-bold text-white">{data.variacoes.filter(v => v.status === 'ATIVO').length}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-600/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Entrega Automática</p>
                  <Zap className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-sm text-gray-300">{data.variacoes.filter(v => v.estoque_tipo === 'AUTOMATICO').length} variações configuradas</p>
              </div>
              <Link to="/admin/stock">
                <Button variant="outline" size="sm" className="w-full">Gerenciar Estoque</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
