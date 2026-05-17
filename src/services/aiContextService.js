import { api } from './api';

export const aiContextService = {
  /**
   * Coleta métricas de hoje, ontem, categorias e produtos com suas variações
   * formatando um objeto limpo para alimentar o prompt da IA.
   */
  async obterContextoConsolidado() {
    try {
      const [categories, products, variations, orders] = await Promise.all([
        api.get('categories').catch(() => []),
        api.get('products').catch(() => []),
        api.get('variacoes').catch(() => []),
        api.get('compras').catch(() => []),
      ]);

      const now = new Date();
      
      // Criação segura de fusos horários locais para hoje e ontem
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const endOfYesterday = new Date(startOfToday.getTime() - 1);

      // Filtra pedidos concluídos ou aprovados (qualquer status diferente de aguardando e cancelado)
      const validOrders = orders.filter(o => 
        o.status && 
        o.status.toUpperCase() !== 'AGUARDANDO_PAGAMENTO' && 
        o.status.toUpperCase() !== 'CANCELADO'
      );

      const todayOrders = validOrders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= startOfToday && orderDate <= endOfToday;
      });

      const yesterdayOrders = validOrders.filter(o => {
        const orderDate = new Date(o.date);
        return orderDate >= startOfYesterday && orderDate <= endOfYesterday;
      });

      const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

      // Mapeamento dos produtos estruturados com suas respectivas variações
      const productsWithVariations = products.map(p => {
        const prodVariations = variations.filter(v => v.produtoId === p.id);
        return {
          id: p.id,
          nome: p.nome,
          miniDesc: p.miniDesc || '',
          status: p.status || 'ATIVO',
          categoriaId: p.categoriaId,
          variacoes: prodVariations.map(v => ({
            id: v.id,
            nome: v.nome,
            preco: Number(v.preco) || 0,
            metodoEntrega: v.metodoEntrega || v.estoque_tipo || 'MANUAL',
            status: v.status || 'ATIVO',
            quantidadeStock: Number(v.quantidadeStock) || 0,
            stockData: v.stockData || []
          }))
        };
      });

      // Últimas 15 entregas concluídas / aprovadas
      const entregasRecentes = validOrders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 15)
        .map(o => ({
          id: o.id,
          cliente: o.userName || 'Cliente',
          produto: `${o.productName} - ${o.variationName}`,
          total: Number(o.total) || 0,
          status: o.status,
          entregue: o.deliveryContent || [],
          data: o.date
        }));

      return {
        estatisticas: {
          hoje: {
            vendas: todayOrders.length,
            faturamento: todayRevenue
          },
          ontem: {
            vendas: yesterdayOrders.length,
            faturamento: yesterdayRevenue
          }
        },
        categorias: categories.map(c => ({ id: c.id, nome: c.nome, status: c.status || 'ATIVO' })),
        produtos: productsWithVariations,
        entregasRecentes
      };
    } catch (error) {
      console.error("Erro ao obter contexto consolidado para a IA:", error);
      return {
        estatisticas: { hoje: { vendas: 0, faturamento: 0 }, ontem: { vendas: 0, faturamento: 0 } },
        categorias: [],
        produtos: [],
        entregasRecentes: []
      };
    }
  }
};
