import { api } from './api';

export const aiActionService = {
  /**
   * Executa ações estruturadas disparadas pela IA na base de dados (Supabase).
   * 
   * @param {String} actionName Nome da ação (EDITAR_PRODUTO, ALTERAR_METODO_ENTREGA, CARREGAR_ESTOQUE)
   * @param {Object} payload Parâmetros da ação
   * @returns {Promise<Object>} Resultado da execução
   */
  async executarAcao(actionName, payload) {
    try {
      if (!actionName) {
        throw new Error("Nome da ação ausente.");
      }

      switch (actionName.toUpperCase()) {
        case 'EDITAR_PRODUTO': {
          const { id, tipo, campos } = payload;
          if (!id) throw new Error("ID não fornecido para edição.");
          if (!campos || Object.keys(campos).length === 0) throw new Error("Nenhum campo fornecido para edição.");

          const targetType = String(tipo).toLowerCase();
          if (targetType === 'variacao' || targetType === 'variação') {
            // Edita Variação
            const result = await api.patch(`variacoes/${id}`, {
              ...campos,
              dataAtualizacao: new Date().toISOString()
            });
            return { success: true, message: `Variação editada com sucesso!`, data: result };
          } else {
            // Edita Produto
            const result = await api.patch(`products/${id}`, {
              ...campos,
              dataAtualizacao: new Date().toISOString()
            });
            return { success: true, message: `Produto editado com sucesso!`, data: result };
          }
        }

        case 'ALTERAR_METODO_ENTREGA': {
          const { variationId, metodoEntrega } = payload;
          if (!variationId) throw new Error("ID da variação não fornecido.");
          
          const validMethods = ['AUTOMATICA', 'MANUAL', 'AGENTE'];
          const methodUpper = String(metodoEntrega).toUpperCase();
          
          if (!validMethods.includes(methodUpper)) {
            throw new Error(`Método de entrega inválido. Valores aceitos: AUTOMATICA, MANUAL, AGENTE.`);
          }

          const result = await api.patch(`variacoes/${variationId}`, {
            metodoEntrega: methodUpper,
            estoque_tipo: methodUpper,
            dataAtualizacao: new Date().toISOString()
          });

          return { 
            success: true, 
            message: `Método de entrega alterado para ${methodUpper}!`, 
            data: result 
          };
        }

        case 'CARREGAR_ESTOQUE': {
          const { variationId, lines } = payload;
          if (!variationId) throw new Error("ID da variação não fornecido.");
          if (!lines || !Array.isArray(lines) || lines.length === 0) {
            throw new Error("Linhas de estoque inválidas ou ausentes.");
          }

          // Busca as variações vigentes
          const variations = await api.get('variacoes');
          const variation = variations.find(v => String(v.id) === String(variationId));
          if (!variation) throw new Error(`Variação de ID ${variationId} não encontrada.`);

          // Filtra linhas vazias
          const newLines = lines.filter(line => typeof line === 'string' && line.trim() !== '');
          if (newLines.length === 0) throw new Error("Nenhuma conta válida para carregar.");

          // Concatena com o estoque existente
          const currentLines = variation.stockData || [];
          const updatedLines = [...currentLines, ...newLines];

          const result = await api.patch(`variacoes/${variationId}`, {
            stockData: updatedLines,
            quantidadeStock: updatedLines.length,
            metodoEntrega: 'AUTOMATICA',
            estoque_tipo: 'AUTOMATICA',
            dataAtualizacao: new Date().toISOString()
          });

          return { 
            success: true, 
            message: `${newLines.length} novas contas carregadas no estoque da variação ${variation.nome || variationId}!`, 
            data: result 
          };
        }

        default:
          throw new Error(`Ação '${actionName}' não reconhecida pelo sistema de IA.`);
      }
    } catch (error) {
      console.error(`Erro ao executar ação administrativa [${actionName}]:`, error);
      return { success: false, error: error.message };
    }
  }
};
