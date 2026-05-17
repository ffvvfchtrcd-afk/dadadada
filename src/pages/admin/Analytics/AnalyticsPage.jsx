import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Clock, Users } from 'lucide-react';
import { api } from '@/services/api';
import { StatCard, Card, CardHeader, CardContent, Badge, EmptyState } from '@/components/ui';

export default function AnalyticsPage() {
  const [data, setData] = useState({ loading: true });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [compras, products, variacoes] = await Promise.all([
          api.get('compras').catch(() => []),
          api.get('products').catch(() => []),
          api.get('variacoes').catch(() => []),
        ]);
        const revenue = compras.filter(c => c.status === 'APROVADO').reduce((a, c) => a + (c.valorTotal || 0), 0);
        const avgOrder = compras.length > 0 ? revenue / compras.filter(c => c.status === 'APROVADO').length : 0;
        setData({ loading: false, compras, products, variacoes, revenue, avgOrder });
      } catch { setData({ loading: false, compras: [], products: [], variacoes: [], revenue: 0, avgOrder: 0 }); }
    };
    fetch();
  }, []);

  if (data.loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" /></div>;

  const paymentMethods = {};
  data.compras.forEach(c => { paymentMethods[c.metodoPagamento] = (paymentMethods[c.metodoPagamento] || 0) + 1; });

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1">Métricas e análises da sua loja</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Receita Total" value={`R$ ${data.revenue.toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} color="green" />
        <StatCard title="Ticket Médio" value={`R$ ${data.avgOrder.toFixed(2)}`} icon={<BarChart3 className="w-5 h-5" />} color="brand" />
        <StatCard title="Total de Pedidos" value={data.compras.length} icon={<ShoppingBag className="w-5 h-5" />} color="purple" />
        <StatCard title="Taxa de Conversão" value={data.compras.length > 0 ? `${((data.compras.filter(c => c.status === 'APROVADO').length / data.compras.length) * 100).toFixed(0)}%` : '0%'} icon={<TrendingUp className="w-5 h-5" />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-base font-semibold text-white">Métodos de Pagamento</h2></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(paymentMethods).map(([method, count]) => (
                <div key={method} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{method}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-dark-600/50 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${(count / data.compras.length) * 100}%` }} /></div>
                    <span className="text-sm font-medium text-white w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-base font-semibold text-white">Status dos Pedidos</h2></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'APROVADO', color: 'green' },
                { status: 'PENDENTE', color: 'yellow' },
                { status: 'AGUARDANDO', color: 'yellow' },
                { status: 'CANCELADO', color: 'red' },
                { status: 'REEMBOLSADO', color: 'purple' },
              ].map(({ status, color }) => {
                const count = data.compras.filter(c => c.status === status).length;
                if (count === 0) return null;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <Badge variant={color} size="sm">{status}</Badge>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-dark-600/50 rounded-full overflow-hidden"><div className={`h-full bg-${color}-500 rounded-full`} style={{ width: `${(count / data.compras.length) * 100}%` }} /></div>
                      <span className="text-sm font-medium text-white w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
