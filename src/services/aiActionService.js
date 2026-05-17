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

        case 'CRIAR_CATEGORIA': {
          const { nome, icone, imageUrl } = payload;
          if (!nome) throw new Error("Nome da categoria obrigatório.");

          const slug = String(nome).toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

          const result = await api.save('categories', {
            nome,
            slug,
            icone: icone || 'Folder',
            imageUrl: imageUrl || '',
            status: 'ATIVO',
            hierarquia: 1,
            dataCriacao: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
          });

          return {
            success: true,
            message: `Categoria "${nome}" criada com sucesso no Supabase!`,
            data: result
          };
        }

        case 'DELETAR_CATEGORIA': {
          const { id } = payload;
          if (!id) throw new Error("ID da categoria obrigatório.");

          // Busca produtos sob esta categoria para limpar em cascata
          const products = await api.get('products');
          const relatedProducts = products.filter(p => String(p.categoriaId) === String(id));

          for (const p of relatedProducts) {
            const variations = await api.get('variacoes');
            const relatedVars = variations.filter(v => v.produtoId === p.id);
            for (const v of relatedVars) {
              await api.delete('variacoes', v.id);
            }
            await api.delete('products', p.id);
          }

        }

        case 'CRIAR_PRODUTOS_LOTE': {
          const { produtos } = payload;
          if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
            throw new Error("Nenhum produto fornecido para o lote.");
          }

          const createdList = [];
          for (const prod of produtos) {
            const { nome, categoriaId, miniDesc, variacoes } = prod;
            if (!nome || !categoriaId) continue;

            // 1. Resolve ou cria de forma autónoma a categoria se não existir
            let catId = categoriaId;
            try {
              const categories = await api.get('categories');
              const catExists = categories.find(c => 
                String(c.id) === String(catId) || 
                String(c.nome).toLowerCase() === String(catId).toLowerCase()
              );

              if (!catExists) {
                // Cria a nova categoria ausente automaticamente
                const newCatSlug = String(catId).toLowerCase()
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)+/g, '');

                const newCat = await api.save('categories', {
                  nome: catId, 
                  slug: newCatSlug,
                  icone: 'Folder',
                  imageUrl: '',
                  status: 'ATIVO',
                  hierarquia: 1,
                  dataCriacao: new Date().toISOString(),
                  dataAtualizacao: new Date().toISOString()
                });
                const createdCatObj = newCat?.[0] || newCat;
                catId = createdCatObj.id;
              } else {
                catId = catExists.id;
              }
            } catch (errCat) {
              console.error("Falha ao resolver/criar categoria automaticamente, usando valor original:", errCat);
            }

            const slug = String(nome).toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '');

            // 2. Cria o Produto
            const pResult = await api.save('products', {
              nome,
              slug,
              categoriaId: catId,
              miniDesc: miniDesc || '',
              descricao: miniDesc || '',
              status: 'ATIVO',
              dataCriacao: new Date().toISOString(),
              dataAtualizacao: new Date().toISOString()
            });

            const createdProduct = pResult?.[0] || pResult;
            if (!createdProduct || !createdProduct.id) continue;

            // 2. Cria as variações associadas
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
                preco: 1.00,
                estoque_tipo: 'MANUAL',
                status: 'ATIVO',
                quantidadeStock: 0,
                stockData: [],
                dataCriacao: new Date().toISOString(),
                dataAtualizacao: new Date().toISOString()
              });
              vResults.push(vRes);
            }
            createdList.push({ produto: createdProduct, variacoes: vResults });
          }

          return {
            success: true,
            message: `Importação em lote concluída! Criado com sucesso ${createdList.length} produto(s) no Supabase!`,
            data: createdList
          };
        }

        case 'CRIAR_CATEGORIAS_LOTE': {
          const { categorias } = payload;
          if (!categorias || !Array.isArray(categorias) || categorias.length === 0) {
            throw new Error("Nenhuma categoria fornecida para o lote.");
          }

          const createdList = [];
          for (const cat of categorias) {
            const { nome, icone, imageUrl } = cat;
            if (!nome) continue;

            const slug = String(nome).toLowerCase()
              .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, '');

            const result = await api.save('categories', {
              nome,
              slug,
              icone: icone || 'Folder',
              imageUrl: imageUrl || '',
              status: 'ATIVO',
              hierarquia: 1,
              dataCriacao: new Date().toISOString(),
              dataAtualizacao: new Date().toISOString()
            });
            createdList.push(result?.[0] || result);
          }

          return {
            success: true,
            message: `Importação em lote concluída! Criada com sucesso ${createdList.length} categoria(s) no Supabase!`,
            data: createdList
          };
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

        case 'REMOVER_ITENS_ESTOQUE': {
          const { variationId, lines } = payload;
          if (!variationId) throw new Error("ID da variação não fornecido.");
          if (!lines || !Array.isArray(lines) || lines.length === 0) {
            throw new Error("Linhas para remover não especificadas.");
          }

          const variations = await api.get('variacoes');
          const variation = variations.find(v => String(v.id) === String(variationId));
          if (!variation) throw new Error(`Variação de ID ${variationId} não encontrada.`);

          const currentStock = variation.stockData || [];
          const updatedStock = currentStock.filter(item => !lines.includes(item));
          const removedCount = currentStock.length - updatedStock.length;

          const result = await api.patch(`variacoes/${variationId}`, {
            stockData: updatedStock,
            quantidadeStock: updatedStock.length,
            dataAtualizacao: new Date().toISOString()
          });

          return {
            success: true,
            message: `Removido com sucesso ${removedCount} conta(s) do estoque da variação ${variation.nome || variationId}!`,
            data: result
          };
        }

        case 'CONFIGURAR_SINCRONIZACAO_PRECO': {
          const { variationId, syncUrl, syncSelector, syncMarkup } = payload;
          if (!variationId) throw new Error("ID da variação não fornecido.");
          if (!syncUrl) throw new Error("URL de sincronização obrigatória.");

          const markupValue = syncMarkup !== undefined ? Number(syncMarkup) : 40.00;

          // 1. Testa a extração de preço chamando o proxy serverless para evitar erros de CORS
          const testRes = await fetch('/api/cron-price-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              test: true,
              syncUrl,
              syncSelector: syncSelector || 'auto',
              syncMarkup: markupValue
            })
          });

          if (!testRes.ok) {
            throw new Error(`Erro na rede do servidor de teste: HTTP ${testRes.status}`);
          }

          const testData = await testRes.json();

          if (!testData.success) {
            // Falhou ao encontrar o preço. Retorna uma falha tratável e solicita seletor manual ao usuário
            return {
              success: false,
              reason: 'PRICE_NOT_FOUND',
              message: `Acessei o link, mas não consegui localizar o preço no HTML de forma automática. Por favor, me diga em qual classe CSS, ID ou tag HTML fica o preço nessa página para eu tentar novamente!`,
              data: { syncUrl, syncSelector, syncMarkup: markupValue }
            };
          }

          // 2. Se obteve sucesso, grava as informações no Supabase e atualiza o preço final da variação
          const finalPrice = testData.finalPrice;
          const result = await api.patch(`variacoes/${variationId}`, {
            preco: finalPrice,
            sync_url: syncUrl,
            sync_selector: syncSelector || 'auto',
            sync_markup: markupValue,
            sync_last_at: new Date().toISOString(),
            dataAtualizacao: new Date().toISOString()
          });

          return {
            success: true,
            message: `Sincronização configurada com sucesso! Consegui ler o link, extraí o preço original de R$ ${testData.originalPrice.toFixed(2)} e, aplicando sua margem de ${markupValue}%, atualizei o preço da variação para R$ ${finalPrice.toFixed(2)}!`,
            data: result
          };
        }

        case 'EXECUTAR_SINCRONIZACAO_PRECOS': {
          const response = await fetch('/api/cron-price-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const result = await response.json();
          if (!result.success) {
            throw new Error(result.error || "Falha na resposta do servidor de sincronização.");
          }

          return {
            success: true,
            message: `Sincronização de preços em lote concluída com sucesso!`,
            data: result.logs
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
