import { api } from './api';
import { deliveryService } from './deliveryService';

export const orderService = {
  /**
   * Cria pedidos a partir do carrinho de compras.
   * Inicialmente cria com status AGUARDANDO_PAGAMENTO.
   * 
   * @param {Object} user Usuário logado
   * @param {Array} cartItems Itens do carrinho
   */
  createOrdersFromCart: async (user, cartItems) => {
    try {
      const createdOrders = [];

      for (const item of cartItems) {
        const variationId = item.variation?.id;
        const metodoEntrega = item.variation?.metodoEntrega || 'MANUAL';
        
        const order = {
          id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          userId: user.id,
          userName: user.nome,
          productId: item.id,
          productName: item.nome,
          variationId: variationId,
          variationName: item.variation?.nome,
          quantity: item.quantity,
          total: item.price * item.quantity,
          status: 'AGUARDANDO_PAGAMENTO',
          metodoEntrega: metodoEntrega,
          deliveryContent: 'Aguardando processamento...',
          date: new Date().toISOString(),
          timeline: [
            { status: 'CRIADO', label: 'Pedido Criado', date: new Date().toISOString() }
          ]
        };

        await api.save('compras', order);
        createdOrders.push(order);
      }

      return { success: true, orders: createdOrders };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Aprova um pedido, atualizando o status e iniciando a entrega.
   */
  approveOrder: async (orderId) => {
    try {
      const orders = await api.get('compras');
      const order = orders.find(o => o.id === orderId);
      if (!order || order.status !== 'AGUARDANDO_PAGAMENTO') return;

      const updatedTimeline = [
        ...order.timeline,
        { status: 'PAGO', label: 'Pagamento Confirmado', date: new Date().toISOString() }
      ];

      // Determinar o status inicial pós-pagamento
      const method = order.metodoEntrega || 'MANUAL';
      let nextStatus = 'PROCESSANDO';

      updatedTimeline.push({ status: 'PROCESSANDO', label: 'Iniciando Entrega', date: new Date().toISOString() });

      // Atualiza o pedido para PROCESSANDO
      await api.patch(`compras/${orderId}`, {
        status: nextStatus,
        timeline: updatedTimeline
      });

      // Se for automática, tenta despachar imediatamente
      if (method === 'AUTOMATICA') {
        const result = await deliveryService.processAutomatic(orderId, order.variationId, order.quantity);
        if (!result.success) {
           console.error(`Falha na entrega automática do pedido ${orderId}:`, result.error);
           // Mantém em processando para intervenção manual se falhar
        }
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao aprovar pedido:", error);
      return { success: false, error: error.message };
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const orders = await api.get('compras');
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      await api.patch(`compras/${orderId}`, {
        status: 'CANCELADO',
        timeline: [
          ...order.timeline,
          { status: 'CANCELADO', label: 'Pedido Cancelado', date: new Date().toISOString() }
        ]
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  getUserOrders: async (userId) => {
    try {
        const response = await api.get('compras');
        return response.filter(o => o.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        return [];
    }
  }
};
