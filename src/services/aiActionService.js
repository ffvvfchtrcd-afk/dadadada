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

        case 'CRIAR_PRODUTO': {
          const { nome, categoriaId, miniDesc, preco, metodoEntrega, variacoes } = payload;
          if (!nome) throw new Error("Nome do produto obrigatório.");
          if (!categoriaId) throw new Error("Categoria obrigatória.");

          const slug = String(nome).toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

          // 1. Cria o Produto
          const pResult = await api.save('products', {
            nome,
            slug,
            categoriaId,
            miniDesc: miniDesc || '',
            descricao: miniDesc || '',
            status: 'ATIVO',
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
          });

          const createdProduct = pResult?.[0] || pResult;
          if (!createdProduct || !createdProduct.id) throw new Error("Falha ao salvar produto no Supabase.");

          // 2. Cria as variações fornecidas ou a variação padrão
          const vResults = [];
          if (variacoes && Array.isArray(variacoes) && variacoes.length > 0) {
            for (const v of variacoes) {
              const vSlug = String(v.nome || 'padrao').toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');

              const vRes = await api.save('variacoes', {
                produtoId: createdProduct.id,
                nome: v.nome || 'Padrão',
                slug: vSlug,
                preco: Number(v.preco) || 1.00,
                estoque_tipo: v.metodoEntrega || v.estoque_tipo || 'MANUAL',
                status: v.status || 'ATIVO',
                quantidadeStock: Number(v.quantidadeStock) || 0,
                stockData: v.stockData || [],
                dataCriacao: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString()
              });
              vResults.push(vRes);
            }
          } else {
            const vRes = await api.save('variacoes', {
              produtoId: createdProduct.id,
              nome: 'Padrão',
              slug: 'padrao',
              preco: Number(preco) || 1.00,
              estoque_tipo: metodoEntrega || 'MANUAL',
              status: 'ATIVO',
              quantidadeStock: 0,
              stockData: [],
              dataCriacao: new Date().toISOString(),
              dataAtualizacao: new Date().toISOString()
            });
            vResults.push(vRes);
          }

          return {
            success: true,
            message: `Produto "${nome}" criado com sucesso com ${vResults.length} variação(ões) no Supabase!`,
            data: { produto: createdProduct, variacoes: vResults }
          };
        }

        case 'DELETAR_PRODUTO': {
          const { id, tipo } = payload;
          if (!id) throw new Error("ID do alvo obrigatório.");

          const targetType = String(tipo).toLowerCase();
          if (targetType === 'variacao' || targetType === 'variação') {
            await api.delete('variacoes', id);
            return { success: true, message: `Variação deletada do Supabase com sucesso!` };
          } else {
            // Deleta produto (e opcionalmente suas variações atreladas)
            const variations = await api.get('variacoes');
            const related = variations.filter(v => v.produtoId === id);
            for (const v of related) {
              await api.delete('variacoes', v.id);
            }
            await api.delete('products', id);
            return { success: true, message: `Produto e todas as suas variações associadas foram deletados com sucesso!` };
          }
        }

        case 'ATUALIZAR_SALDO_USUARIO': {
          const { email, saldo } = payload;
          if (!email) throw new Error("E-mail do usuário obrigatório.");
          if (saldo === undefined || isNaN(Number(saldo))) throw new Error("Novo saldo inválido.");

          const users = await api.get('users');
          const user = users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase());
          if (!user) throw new Error(`Usuário com e-mail ${email} não encontrado.`);

          const result = await api.patch(`users/${user.id}`, {
            saldo: Number(saldo),
            dataAtualizacao: new Date().toISOString()
          });

          return {
            success: true,
            message: `Saldo do usuário ${user.nome} (${email}) atualizado com sucesso para R$ ${Number(saldo).toFixed(2)}!`,
            data: result
          };
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
