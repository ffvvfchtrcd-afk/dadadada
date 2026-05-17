import { api } from './api';
import { stockService } from './stockService';

export const deliveryService = {
  // Methods for Automatic Delivery
  processAutomatic: async (orderId, variationId, quantity) => {
    try {
      // Usa o novo serviço unificado de dedução física de estoque
      const deliveredContent = await stockService.deductRealStock(variationId, quantity);
      
      const orders = await api.get('compras');
      const order = orders.find(o => o.id === orderId);
      
      if (!order) throw new Error('Pedido não encontrado');

      // Update order with content and status
      const updatedTimeline = [
        ...(order.timeline || []),
        { status: 'ENTREGUE', label: 'Entrega Automática Concluída', date: new Date().toISOString() }
      ];

      await api.patch(`compras/${orderId}`, {
        deliveryContent: deliveredContent,
        status: 'ENTREGUE',
        timeline: updatedTimeline,
        dateDelivered: new Date().toISOString()
      });
      
      return { success: true, content: deliveredContent };
    } catch (error) {
      console.error("Erro na entrega automática:", error);
      return { success: false, error: error.message };
    }
  },

  // Methods for Agent Delivery (User sees Auto, Admin delivers manually)
  processAgent: async (orderId, deliveryContent) => {
    try {
      const orders = await api.get('compras');
      const order = orders.find(o => o.id === orderId);

      const updatedTimeline = [
        ...(order.timeline || []),
        { status: 'ENTREGUE', label: 'Entrega Concluída', date: new Date().toISOString() }
      ];

      await api.patch(`compras/${orderId}`, {
        deliveryContent: deliveryContent,
        status: 'ENTREGUE',
        timeline: updatedTimeline,
        dateDelivered: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Methods for Manual Delivery
  processManual: async (orderId, deliveryContent) => {
    try {
      const orders = await api.get('compras');
      const order = orders.find(o => o.id === orderId);

      const updatedTimeline = [
        ...(order.timeline || []),
        { status: 'ENTREGUE', label: 'Entrega Assistida Concluída', date: new Date().toISOString() }
      ];

      await api.patch(`compras/${orderId}`, {
        deliveryContent: deliveryContent,
        status: 'ENTREGUE',
        timeline: updatedTimeline,
        dateDelivered: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
