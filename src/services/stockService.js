import { api } from './api';

export const stockService = {
  /**
   * Calcula o estoque real ou simulado baseado nas configurações da variação.
   * Utilizado para exibição visual nas lojas e vitrines.
   * 
   * @param {Object} variation Objeto da variação contendo regras de estoque
   * @returns {Number} Quantidade para exibição
   */
  getDisplayStock: (variation) => {
    if (!variation) return 0;
    
    // Entrega manual exibe 0 ou status de aviso, dependendo da UI (tratado pelo componente)
    if (variation.metodoEntrega !== 'AUTOMATICA' && variation.metodoEntrega !== 'AGENTE') {
        return 0;
    }
    
    // AUTOMÁTICA real: Conta as linhas disponíveis
    if (variation.metodoEntrega === 'AUTOMATICA' && !variation.isInfinite) {
       return variation.quantidadeStock || 0;
    }

    // AGENTE ou AUTOMÁTICA(Infinita): Aplica a simulação realista
    const min = variation.minStockSimulated || 5;
    const max = variation.maxStockSimulated || 99;
    
    // Fator de tempo muda a cada minuto para parecer orgânico
    const timeFactor = Math.floor(Date.now() / 60000); 
    
    // Fator global (se houver compras na sessão atual)
    const globalPurchases = parseInt(localStorage.getItem('nexmarket_sim_purchases') || '0');
    
    const range = max - min;
    // O ID da variação garante que cada produto tenha um número diferente no mesmo minuto
    const baseId = typeof variation.id === 'string' ? variation.id.charCodeAt(0) : variation.id;
    const base = (baseId * (timeFactor + globalPurchases)) % (range > 0 ? range : 1);
    
    return min + base;
  },

  /**
   * Dedução física do estoque para produtos automáticos.
   * Modifica o banco de dados.
   * 
   * @param {String|Number} variationId ID da variação
   * @param {Number} quantity Quantidade comprada
   * @returns {Promise<String>} Conteúdo das linhas reservadas
   */
  deductRealStock: async (variationId, quantity) => {
    const variations = await api.get('variacoes');
    const variation = variations.find(v => String(v.id) === String(variationId));
    
    if (!variation) throw new Error("Variação não encontrada.");
    if (variation.metodoEntrega !== 'AUTOMATICA') throw new Error("Método não dedutível fisicamente.");
    if (variation.isInfinite) return "Entrega agendada via sistema infinito.";

    // Filtra linhas vazias para evitar envio de brancos
    let currentLines = (variation.stockData || []).filter(line => typeof line === 'string' && line.trim() !== '');
    
    if (currentLines.length < quantity) {
        throw new Error("Estoque insuficiente no momento do despacho.");
    }

    // Remove as linhas do início (FIFO)
    const reservedLines = currentLines.splice(0, quantity);
    
    // Atualiza a variação no banco com as linhas restantes (limpas)
    await api.patch(`variacoes/${variation.id}`, {
      stockData: currentLines,
      quantidadeStock: currentLines.length,
      dataAtualizacao: new Date().toISOString()
    });

    return reservedLines.join('\n');
  }
};
