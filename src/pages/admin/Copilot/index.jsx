import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, RefreshCw, Play, CheckCircle2,
  AlertTriangle, Key, Cpu, History, Trash2, X, Terminal,
  Paperclip, FileSpreadsheet, Pin, Plus, MessageSquare, Columns, HelpCircle
} from 'lucide-react';
import { openrouterService } from '../../../services/openrouterService';
import { aiActionService } from '../../../services/aiActionService';

// Renderizador simples e robusto de Markdown nativo
function parseSimpleMarkdown(text) {
  if (!text) return '';
  
  // Limpa todos os blocos de ação técnica para não exibir na conversa do chat
  let cleanText = text.replace(/\[ADMIN_ACTION\]\s*\{.*/g, '').trim();

  // Escapa HTML básico
  let html = cleanText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bloco de código
  html = html.replace(/```(?:json|javascript|js)?\n([\s\S]*?)```/g, (match, code) => {
    return `<pre class="bg-dark-900/80 border border-dark-600/30 rounded-xl p-4 my-3 overflow-x-auto text-xs font-mono text-cyan-400"><code>${code}</code></pre>`;
  });

  // Negrito
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Listas de itens
  html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="ml-4 list-disc text-gray-300">$1</li>');

  // Parágrafos
  html = html.split('\n').map(line => {
    if (line.trim().startsWith('<pre') || line.trim().startsWith('<li')) return line;
    return line.trim() ? `<p class="mb-2 leading-relaxed text-gray-200">${line}</p>` : '';
  }).join('\n');

  return html;
}

export default function Copilot() {
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem('nexmarket_copilot_threads');
    if (saved) return JSON.parse(saved);

    return [
      {
        id: 'thread-uploads',
        title: '📤 Configurar Uploads',
        messages: [
          {
            id: 'welcome-uploads',
            role: 'assistant',
            content: '👋 Olá! Este é o canal dedicado para **Configurar Uploads** de produtos por planilha (CSV/TXT). Você pode arrastar um arquivo para cá, anexar pelo ícone de clipe ou me dar instruções de mapeamento de colunas!'
          }
        ],
        isPermanent: true,
        category: 'preset'
      },
      {
        id: 'thread-prices',
        title: '🔍 Pesquisas de Preços',
        messages: [
          {
            id: 'welcome-prices',
            role: 'assistant',
            content: '👋 Olá! Este é o canal dedicado para **Pesquisa e Sincronização Dinâmica de Preços** com fornecedores externos. Você pode configurar URLs, definir markups (como sua margem de 40%) e testar seletores de scrapers!'
          }
        ],
        isPermanent: true,
        category: 'preset'
      },
      {
        id: 'thread-general',
        title: '💬 Chat Geral',
        messages: [
          {
            id: 'welcome-general',
            role: 'assistant',
            content: 'Olá! Sou o seu **IA Copiloto da NexMarket (v1.2)**. Tenho acesso a todo o catálogo de produtos, variações, métodos de entrega e estatísticas de vendas em tempo real. \n\nPosso ajudar você a:\n- **Consultar Métricas:** *"Quantas vendas tivemos hoje?"* ou *"Qual faturamento de ontem?"*\n- **Editar Informações:** *"Mude o preço do Netflix Premium para R$ 19.90"* ou *"Edite a descrição do Fone Gamer"*.\n- **Gerenciar Estoque:** *"Adicione essas contas na variação X"*.\n- **Políticas de Entrega:** *"Altere o envio do plano mensal para automático"*.\n\nComo posso ajudar você a otimizar a sua operação hoje?'
          }
        ],
        isPermanent: true,
        category: 'preset'
      }
    ];
  });

  const [currentThreadId, setCurrentThreadId] = useState('thread-general');
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Sincroniza threads no localStorage
  useEffect(() => {
    localStorage.setItem('nexmarket_copilot_threads', JSON.stringify(threads));
  }, [threads]);

  // Deriva mensagens da thread ativa de forma transparente
  const activeThread = threads.find(t => t.id === currentThreadId) || threads.find(t => t.id === 'thread-general') || threads[0];
  const messages = activeThread.messages;

  // Intercepta setMessages mantendo 100% de retrocompatibilidade
  const setMessages = (updateFn) => {
    setThreads(prev => prev.map(t => {
      if (t.id === currentThreadId) {
        const nextMessages = typeof updateFn === 'function' ? updateFn(t.messages) : updateFn;
        return { ...t, messages: nextMessages };
      }
      return t;
    }));
  };
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('openrouter/free');
  const [modelsList, setModelsList] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [currentActionFeedback, setCurrentActionFeedback] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null); // { name: '', size: '', content: '' }

  // Estados do Chat Dividido (Split Screen)
  const [splitThreadId, setSplitThreadId] = useState(null);
  const [splitInput, setSplitInput] = useState('');
  const [splitAttachedFile, setSplitAttachedFile] = useState(null);
  const [splitLoading, setSplitLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const splitMessagesEndRef = useRef(null);
  const splitFileInputRef = useRef(null);
  const splitChatContainerRef = useRef(null);

  // Múltiplas Chaves de API do OpenRouter
  const [apiKeys, setApiKeys] = useState(() => {
    const saved = localStorage.getItem('nexmarket_copilot_keys');
    if (saved) return JSON.parse(saved);

    const oldKey = localStorage.getItem('nexmarket_openrouter_key') || '';
    return [
      { id: 'key-default', name: 'Chave Principal', value: oldKey }
    ];
  });

  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  // Salva no localStorage quando muda
  useEffect(() => {
    localStorage.setItem('nexmarket_copilot_keys', JSON.stringify(apiKeys));
    const defaultKey = apiKeys.find(k => k.id === 'key-default')?.value || '';
    localStorage.setItem('nexmarket_openrouter_key', defaultKey);
  }, [apiKeys]);

  // Cria uma nova conversa customizada
  const handleCreateThread = () => {
    const newThread = {
      id: `thread-${Date.now()}`,
      title: `Nova Conversa ${threads.filter(t => t.category !== 'preset').length + 1}`,
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: '👋 Olá! Esta é uma nova conversa customizada. Como posso ajudar com a NexMarket hoje?'
        }
      ],
      isPermanent: false
    };
    setThreads(prev => [...prev, newThread]);
    setCurrentThreadId(newThread.id);
  };

  // Alterna o status fixado (permanente) de uma conversa
  const handleTogglePin = (threadId, e) => {
    e.stopPropagation();
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, isPermanent: !t.isPermanent };
      }
      return t;
    }));
  };

  // Deleta uma conversa customizada
  const handleDeleteThread = (threadId, e) => {
    e.stopPropagation();
    const threadToDelete = threads.find(t => t.id === threadId);
    if (!threadToDelete) return;
    if (threadToDelete.category === 'preset') {
      alert("Canais predefinidos do sistema não podem ser excluídos.");
      return;
    }
    
    if (confirm(`Deseja excluir permanentemente a conversa "${threadToDelete.title}"?`)) {
      setThreads(prev => prev.filter(t => t.id !== threadId));
      if (currentThreadId === threadId) {
        setCurrentThreadId('thread-general');
      }
    }
  };

  // Inicia edição de título
  const handleStartRename = (thread, e) => {
    e.stopPropagation();
    if (thread.category === 'preset') return; // impede renomear presets do sistema
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  };

  // Salva renomeação
  const handleSaveRename = (threadId) => {
    if (editingTitle.trim()) {
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return { ...t, title: editingTitle.trim() };
        }
        return t;
      }));
    }
    setEditingThreadId(null);
  };

  // Manipulador de upload de CSV
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert("Por favor, selecione um arquivo de tabela (.csv) ou texto (.txt).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: event.target.result
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Inicializa modelos e configurações
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const models = await openrouterService.obterModelosGratuitos();
        setModelsList(models);
      } catch (e) {
        console.error("Erro ao carregar modelos do OpenRouter:", e);
      }
    };
    fetchModels();

    const savedKey = localStorage.getItem('nexmarket_openrouter_key') || '';
    setCustomKey(savedKey);

    const savedLogs = JSON.parse(localStorage.getItem('nexmarket_ai_logs') || '[]');
    setActionLogs(savedLogs);
  }, []);

  // Rolagem automática inteligente do chat principal
  useEffect(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    // Só força o scroll se o usuário já estiver próximo do fim
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Rolagem automática inteligente do chat split (dividido)
  const splitActiveThread = threads.find(t => t.id === splitThreadId);
  const splitMessages = splitActiveThread ? splitActiveThread.messages : [];

  useEffect(() => {
    if (!splitChatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = splitChatContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    if (isNearBottom) {
      splitMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [splitMessages, splitLoading]);

  // Adicionar nova chave de API
  const handleAddApiKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newKeyValue.trim()) return;
    const newKey = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      value: newKeyValue.trim()
    };
    setApiKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setNewKeyValue('');
  };

  // Remover chave de API
  const handleDeleteApiKey = (keyId) => {
    if (keyId === 'key-default') {
      alert("A chave principal não pode ser removida.");
      return;
    }
    if (confirm("Deseja remover esta chave de API? Chats associados a ela voltarão a usar a Chave Principal.")) {
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      setThreads(prev => prev.map(t => {
        if (t.keyId === keyId) {
          return { ...t, keyId: 'key-default' };
        }
        return t;
      }));
    }
  };

  // Salvar valor de uma chave existente
  const handleUpdateKeyValue = (keyId, newValue) => {
    setApiKeys(prev => prev.map(k => {
      if (k.id === keyId) {
        return { ...k, value: newValue.trim() };
      }
      return k;
    }));
  };

  // Salvar upload de arquivo no split (dividido)
  const handleSplitFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      alert("Por favor, selecione um arquivo de tabela (.csv) ou texto (.txt).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSplitAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        content: event.target.result
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Limpar logs de auditoria
  const handleClearLogs = () => {
    localStorage.removeItem('nexmarket_ai_logs');
    setActionLogs([]);
  };

  // Trata e executa possíveis ações administrativas embutidas na resposta da IA (vinculada a thread correspondente)
  const handlePotentialAdminActionForThread = async (responseText, threadId) => {
    const actionRegex = /\[ADMIN_ACTION\]\s*(\{.*)/g;
    let match;
    const actionsToExecute = [];

    while ((match = actionRegex.exec(responseText)) !== null) {
      try {
        const actionData = JSON.parse(match[1]);
        actionsToExecute.push(actionData);
      } catch (e) {
        console.error("Falha ao interpretar comando da IA:", e);
      }
    }

    if (actionsToExecute.length === 0) return;

    // Executa as ações em lote sequencialmente
    for (let i = 0; i < actionsToExecute.length; i++) {
      const { comando, parametros } = actionsToExecute[i];
      try {
        // Feedback visual animado
        setCurrentActionFeedback({
          comando,
          status: 'executing',
          message: `IA executando ação (${i + 1}/${actionsToExecute.length}): ${comando}...`
        });

        // Executa mutação real no banco
        const result = await aiActionService.executarAcao(comando, parametros);

        if (result.success) {
          const newLog = {
            id: Date.now() + i,
            action: comando,
            details: result.message,
            date: new Date().toLocaleTimeString('pt-BR')
          };

          // Atualiza os logs na lista de auditoria e local storage
          setActionLogs(prev => {
            const updated = [newLog, ...prev].slice(0, 50);
            localStorage.setItem('nexmarket_ai_logs', JSON.stringify(updated));
            return updated;
          });

          setCurrentActionFeedback({
            comando,
            status: 'success',
            message: `[${i + 1}/${actionsToExecute.length}] ${result.message}`
          });
        } else {
          setCurrentActionFeedback({
            comando,
            status: 'failed',
            message: `Erro na ação ${i + 1}: ${result.error || result.message}`
          });

          // Se a ação falhou com erro de preço não localizado, dispara o loop interativo da IA!
          if (comando === 'CONFIGURAR_SINCRONIZACAO_PRECO') {
            const isSelectorFailure = parametros.syncSelector && parametros.syncSelector !== 'auto';
            const systemInput = isSelectorFailure
              ? `[SISTEMA: O teste da sincronização de preços falhou mesmo com o seletor "${parametros.syncSelector}" na variação ${parametros.variationId}. Erro: ${result.error || result.message}. Explique ao administrador de forma gentil que a leitura ainda falhou com este seletor, e peça para verificar se o link ou o seletor estão corretos.]`
              : `[SISTEMA: O teste da sincronização de preços falhou na variação ${parametros.variationId}. Erro: ${result.error || result.message}. Explique de forma muito amigável que você tentou ler o link mas não localizou o preço de forma automática. Pergunte qual é a classe CSS (ex: '.price-item', '.money'), ID ou tag HTML onde o preço fica localizado nesta página para tentarmos novamente.]`;

            setTimeout(async () => {
              const isMain = threadId === currentThreadId;
              if (isMain) setLoading(true);
              else setSplitLoading(true);

              const assistantMsgId = `ai-${Date.now()}`;
              
              setThreads(prev => prev.map(t => {
                if (t.id === threadId) {
                  const updatedMessages = [...t.messages, { id: assistantMsgId, role: 'assistant', content: '' }];
                  const messagesToSend = [
                    ...t.messages,
                    { id: `sys-${Date.now()}`, role: 'user', content: systemInput }
                  ];

                  // Puxa a chave de API da thread
                  const threadKeyId = t.keyId || 'key-default';
                  const keyObject = apiKeys.find(k => k.id === threadKeyId) || apiKeys[0];
                  const keyValue = keyObject?.value || '';
                  
                  openrouterService.enviarMensagemStream(
                    messagesToSend,
                    model,
                    (chunk, fullContent) => {
                      setThreads(innerPrev => innerPrev.map(innerT => {
                        if (innerT.id === threadId) {
                          return {
                            ...innerT,
                            messages: innerT.messages.map(msg => 
                              msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
                            )
                          };
                        }
                        return innerT;
                      }));
                    },
                    { apiKey: keyValue }
                  ).catch(err => console.error("Erro no fluxo interativo:", err))
                   .finally(() => {
                      if (isMain) setLoading(false);
                      else setSplitLoading(false);
                   });

                  return { ...t, messages: updatedMessages };
                }
                return t;
              }));
            }, 1000);
          }
        }
      } catch (err) {
        console.error(`Erro ao rodar ação ${i + 1}:`, err);
      }

      // Pequeno delay entre execuções para dar feedback visual fluido na tela
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Oculta feedback após 3 segundos do término de tudo
    setTimeout(() => {
      setCurrentActionFeedback(null);
    }, 3000);

    // Notifica os outros componentes para atualizarem o estado local do painel
    window.dispatchEvent(new Event('app-state-change'));
  };

  const handlePotentialAdminAction = (responseText) => {
    return handlePotentialAdminActionForThread(responseText, currentThreadId);
  };

  // Envio de mensagem generalizado para uma thread específica
  const handleSendToThread = async (threadId, isLeft = true) => {
    const textInput = isLeft ? input : splitInput;
    const fileAttached = isLeft ? attachedFile : splitAttachedFile;
    const isTargetLoading = isLeft ? loading : splitLoading;

    if ((!textInput.trim() && !fileAttached) || isTargetLoading) return;

    let finalInput = textInput.trim();
    let displayInput = textInput.trim();

    if (fileAttached) {
      finalInput = `[ARQUIVO_IMPORTACAO: ${fileAttached.name}]\n\`\`\`csv\n${fileAttached.content}\n\`\`\`\n\nInstrução do Administrador: ${finalInput || 'Importe este arquivo no sistema NexMarket.'}`;
      displayInput = displayInput ? `📎 Anexou ${fileAttached.name} — ${displayInput}` : `📎 Anexou o arquivo de importação ${fileAttached.name}`;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: displayInput
    };

    // Adiciona a mensagem do usuário à thread
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, messages: [...t.messages, userMessage] };
      }
      return t;
    }));

    // Limpa os campos daquele lado
    if (isLeft) {
      setInput('');
      setAttachedFile(null);
      setLoading(true);
    } else {
      setSplitInput('');
      setSplitAttachedFile(null);
      setSplitLoading(true);
    }

    const assistantMsgId = `ai-${Date.now()}`;
    
    // Adiciona o balão de resposta em branco
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return { ...t, messages: [...t.messages, { id: assistantMsgId, role: 'assistant', content: '' }] };
      }
      return t;
    }));

    try {
      const targetThread = threads.find(t => t.id === threadId);
      const messagesToSend = [...(targetThread ? targetThread.messages : []), { ...userMessage, content: finalInput }];
      
      // Carrega a chave de API vinculada à thread correspondente
      const threadKeyId = targetThread?.keyId || 'key-default';
      const keyObject = apiKeys.find(k => k.id === threadKeyId) || apiKeys[0];
      const keyValue = keyObject?.value || '';

      const streamResult = await openrouterService.enviarMensagemStream(
        messagesToSend,
        model,
        (chunk, fullContent) => {
          setThreads(prev => prev.map(t => {
            if (t.id === threadId) {
              return {
                ...t,
                messages: t.messages.map(msg => 
                  msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
                )
              };
            }
            return t;
          }));
        },
        { apiKey: keyValue }
      );

      // Executa ação técnica caso a IA tenha retornado comandos estruturados
      if (streamResult && streamResult.content) {
        await handlePotentialAdminActionForThread(streamResult.content, threadId);
      }

    } catch (err) {
      console.error(err);
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: t.messages.map(msg => 
              msg.id === assistantMsgId 
                ? { ...msg, content: `⚠️ **Erro de Conexão:** ${err.message || 'Falha ao obter resposta do OpenRouter.'}` } 
                : msg
            )
          };
        }
        return t;
      }));
    } finally {
      if (isLeft) setLoading(false);
      else setSplitLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    handleSendToThread(currentThreadId, true);
  };

  const handleSplitSend = (e) => {
    e.preventDefault();
    handleSendToThread(splitThreadId, false);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-dark-950 text-gray-100 relative">
      
      {/* Sidebar de Canais e Conversas */}
      <div className="w-64 bg-dark-900/60 border-r border-dark-600/30 flex flex-col h-full z-20 backdrop-blur-xl">
        {/* Cabeçalho da Sidebar */}
        <div className="p-4 border-b border-dark-600/30 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Conversas da IA</span>
          <button
            onClick={handleCreateThread}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all active:scale-95"
            title="Novo Chat"
          >
            <Plus className="w-3 h-3" />
            Novo
          </button>
        </div>

        {/* Lista de Threads */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          
          {/* Seção 1: Canais Fixos do Sistema */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block px-2 mb-2">Canais do Sistema</span>
            <div className="space-y-1">
              {threads.filter(t => t.category === 'preset').map(thread => {
                const isActive = thread.id === currentThreadId;
                const isSplitActive = thread.id === splitThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setCurrentThreadId(thread.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left text-xs cursor-pointer group relative ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/5' 
                        : isSplitActive
                        ? 'bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 shadow-sm'
                        : 'hover:bg-dark-800/40 text-gray-400 border border-transparent hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate font-medium">{thread.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botão de Split (Exibido no Hover) */}
                      {thread.id !== currentThreadId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSplitThreadId(thread.id);
                          }}
                          className="p-1 rounded-md hover:bg-dark-700 text-gray-500 hover:text-cyan-400 transition-all opacity-0 group-hover:opacity-100"
                          title="Abrir no lado direito (Tela Dividida)"
                        >
                          <Columns className="w-3 h-3" />
                        </button>
                      )}
                      
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-dark-700/60 text-gray-400 font-semibold border border-dark-600/30 uppercase group-hover:hidden">Fixo</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção 2: Conversas Customizadas */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500 block px-2 mb-2">Minhas Conversas</span>
            <div className="space-y-1">
              {threads.filter(t => t.category !== 'preset').length === 0 ? (
                <p className="text-[11px] text-gray-600 px-2 py-4 italic text-center">Nenhuma conversa customizada criada.</p>
              ) : (
                threads.filter(t => t.category !== 'preset').map(thread => {
                  const isActive = thread.id === currentThreadId;
                  const isSplitActive = thread.id === splitThreadId;
                  const isEditing = thread.id === editingThreadId;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => setCurrentThreadId(thread.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left text-xs border cursor-pointer relative group ${
                        isActive 
                          ? 'bg-dark-800/80 border-dark-600/60 text-gray-200 shadow-md' 
                          : isSplitActive
                          ? 'bg-indigo-500/5 border border-indigo-500/20 text-indigo-400'
                          : 'hover:bg-dark-800/30 text-gray-400 border-transparent hover:text-gray-300'
                      }`}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => handleSaveRename(thread.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(thread.id)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="bg-dark-900 border border-cyan-500/50 rounded-lg px-2 py-1 text-gray-200 text-xs w-3/4 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      ) : (
                        <div 
                          className="flex items-center gap-2 truncate w-2/3"
                          onDoubleClick={(e) => handleStartRename(thread, e)}
                          title="Clique duas vezes para renomear"
                        >
                          <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                          <span className="truncate font-medium">{thread.title}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Botão de Split */}
                        {thread.id !== currentThreadId && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSplitThreadId(thread.id);
                            }}
                            className="p-1 rounded-md hover:bg-dark-700 text-gray-500 hover:text-cyan-400 transition-all"
                            title="Abrir no lado direito (Tela Dividida)"
                          >
                            <Columns className="w-3 h-3" />
                          </button>
                        )}
                        
                        {/* Botão de Fixar / Pin */}
                        <button
                          onClick={(e) => handleTogglePin(thread.id, e)}
                          className={`p-1 rounded-md hover:bg-dark-700 transition-all ${thread.isPermanent ? 'text-amber-400' : 'text-gray-500 hover:text-amber-400'}`}
                          title={thread.isPermanent ? 'Desafixar conversa' : 'Fixar conversa como permanente'}
                        >
                          <Pin className="w-3 h-3 fill-current" />
                        </button>
                        
                        {/* Botão de Deletar */}
                        {!thread.isPermanent && (
                          <button
                            onClick={(e) => handleDeleteThread(thread.id, e)}
                            className="p-1 rounded-md hover:bg-dark-700 text-gray-500 hover:text-red-400 transition-all"
                            title="Excluir conversa"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Ícone pequeno de pin caso esteja fixada mas sem hover */}
                      {thread.isPermanent && (
                        <Pin className="w-2.5 h-2.5 text-amber-500/80 absolute right-2 top-2 group-hover:opacity-0 transition-opacity fill-current" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
      
      {/* Container Principal do Chat (e Split View) */}
      <div className="flex-1 flex h-full overflow-hidden relative z-10">
        
        {/* Lado Esquerdo (Main Chat) */}
        <div className={`flex flex-col h-full relative border-r border-dark-600/30 ${splitThreadId ? 'w-1/2' : 'w-full'}`}>
          
          {/* Cabeçalho do Chat */}
          <div className="h-16 border-b border-dark-600/30 flex items-center justify-between px-6 bg-dark-800/20 backdrop-blur-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-100 flex items-center gap-2">
                  IA Admin Copiloto
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    ATIVO
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    v1.3.1
                  </span>
                </h1>
                <p className="text-xs text-gray-500">Superpoderes de controle e auditoria baseados em OpenRouter</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão Guia de Recursos da IA */}
              <button
                onClick={() => setShowFeaturesModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all font-semibold text-xs active:scale-95 shadow-sm shadow-cyan-500/5"
                title="Ver tudo o que a IA pode fazer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>O QUE FAÇO?</span>
              </button>

              {/* Seletor de Chave da Thread Ativa */}
              <div className="flex items-center gap-2 bg-dark-700/30 border border-dark-600/30 px-3 py-1.5 rounded-xl text-xs">
                <Key className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={activeThread?.keyId || 'key-default'}
                  onChange={(e) => {
                    const newKeyId = e.target.value;
                    setThreads(prev => prev.map(t => {
                      if (t.id === currentThreadId) {
                        return { ...t, keyId: newKeyId };
                      }
                      return t;
                    }));
                  }}
                  className="bg-transparent text-gray-300 focus:outline-none cursor-pointer font-medium"
                >
                  {apiKeys.map(k => (
                    <option key={k.id} value={k.id} className="bg-dark-800 text-gray-200">
                      {k.name} ({k.value ? 'Configurada' : 'Vazia'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor de Modelo */}
              <div className="flex items-center gap-2 bg-dark-700/30 border border-dark-600/30 px-3 py-1.5 rounded-xl text-xs">
                <Cpu className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="bg-transparent text-gray-300 focus:outline-none cursor-pointer font-medium"
                >
                  {modelsList.map(m => (
                    <option key={m.id} value={m.id} className="bg-dark-800 text-gray-200">
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Configurar Chave */}
              <button
                onClick={() => setShowKeyModal(true)}
                className="p-2 rounded-xl border border-dark-600/30 bg-dark-700/10 hover:bg-dark-700/50 text-gray-400 hover:text-cyan-400 transition-all flex items-center gap-1.5"
                title="Gerenciador de Chaves de API"
              >
                <Key className="w-4 h-4" />
                <span className="text-[10px] font-bold text-gray-400">CHAVES</span>
              </button>

              {/* Alternar Sidebar */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-xl border border-dark-600/30 transition-all ${
                  isSidebarOpen ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-dark-700/10 hover:bg-dark-700/50 text-gray-400'
                }`}
              >
                <History className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notificação de Feedback de Ações Administradas */}
          <AnimatePresence>
            {currentActionFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-18 left-6 right-6 z-50 rounded-2xl border p-4 shadow-xl backdrop-blur-xl flex items-center justify-between gap-4 bg-dark-800/90 border-cyan-500/30 shadow-cyan-500/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      Comando de Banco Detectado
                    </h4>
                    <p className="text-sm text-gray-200 mt-0.5">{currentActionFeedback.message}</p>
                  </div>
                </div>

                {currentActionFeedback.status === 'executing' ? (
                  <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                ) : currentActionFeedback.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Zona de Mensagens do Chat Zone */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}
              >
                {msg.role !== 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-md overflow-hidden ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-dark-800/40 border border-dark-600/30 rounded-tl-none'
                  }`}
                >
                  <div 
                    className="prose prose-invert max-w-none text-sm break-words overflow-x-auto custom-scrollbar"
                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(msg.content) }}
                  />
                </div>

                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-xl bg-dark-700 border border-dark-600/50 flex items-center justify-center flex-shrink-0 text-gray-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-4 justify-start">
                <div className="w-9 h-9 rounded-xl bg-dark-800/60 border border-dark-600/30 flex items-center justify-center flex-shrink-0 text-cyan-400">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-dark-800/20 border border-dark-600/30 rounded-2xl rounded-tl-none p-4 max-w-[75%] flex items-center gap-2 text-sm text-gray-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>IA está compilando dados e digitando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensagem */}
          <div className="p-6 border-t border-dark-600/30 bg-dark-800/10 backdrop-blur-xl relative flex-shrink-0">
            
            {/* floating file pill */}
            <AnimatePresence>
              {attachedFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-12 left-6 right-6 p-3 bg-dark-800/90 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 text-xs backdrop-blur-md shadow-lg"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="font-semibold text-gray-200">{attachedFile.name}</span>
                    <span className="text-gray-500">({attachedFile.size})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1 text-gray-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSend} className="flex gap-3 relative items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.txt"
                className="hidden"
              />
              
              <button
                type="button"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                className="p-4 rounded-xl bg-dark-800/60 border border-dark-600/30 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 disabled:opacity-50 transition-all flex items-center justify-center flex-shrink-0"
                title="Anexar arquivo CSV ou TXT"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loading ? 'IA está processando...' : 'Cole o CSV, anexe um arquivo ou peça para importar produtos...'}
                disabled={loading}
                className="flex-1 bg-dark-800/50 border border-dark-600/30 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-gray-100 placeholder-gray-500 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={loading || (!input.trim() && !attachedFile)}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all flex-shrink-0"
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Lado Direito (Split Chat) */}
        {splitThreadId && (
          <div className="w-1/2 flex flex-col h-full bg-dark-950/20 backdrop-blur-sm relative border-l border-dark-600/40">
            
            {/* Cabeçalho do Chat Split */}
            <div className="h-16 border-b border-dark-600/30 flex items-center justify-between px-6 bg-dark-800/10 backdrop-blur-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Columns className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-200 text-xs flex items-center gap-1.5">
                    {splitActiveThread?.title}
                    {splitActiveThread?.isPermanent && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">FIXADO</span>
                    )}
                  </h3>
                  <p className="text-[10px] text-gray-500">Visualização Simultânea / Tela Dividida</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Seletor de Chave da Thread Split */}
                <div className="flex items-center gap-1.5 bg-dark-700/30 border border-dark-600/30 px-2 py-1 rounded-lg text-[10px]">
                  <Key className="w-3 h-3 text-gray-400" />
                  <select
                    value={splitActiveThread?.keyId || 'key-default'}
                    onChange={(e) => {
                      const newKeyId = e.target.value;
                      setThreads(prev => prev.map(t => {
                        if (t.id === splitThreadId) {
                          return { ...t, keyId: newKeyId };
                        }
                        return t;
                      }));
                    }}
                    className="bg-transparent text-gray-300 focus:outline-none cursor-pointer font-medium"
                  >
                    {apiKeys.map(k => (
                      <option key={k.id} value={k.id} className="bg-dark-800 text-gray-200">
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botão de Fechar Split View */}
                <button
                  onClick={() => setSplitThreadId(null)}
                  className="p-1.5 rounded-lg hover:bg-dark-700/50 text-gray-400 hover:text-gray-200 transition-all active:scale-95"
                  title="Fechar Tela Dividida"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Zona de Mensagens do Chat Split */}
            <div ref={splitChatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 custom-scrollbar">
              {splitMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} max-w-full`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-md overflow-hidden ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-dark-800/40 border border-dark-600/30 rounded-tl-none'
                    }`}
                  >
                    <div 
                      className="prose prose-invert max-w-none text-sm break-words overflow-x-auto custom-scrollbar"
                      dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(msg.content) }}
                    />
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-dark-700 border border-dark-600/50 flex items-center justify-center flex-shrink-0 text-gray-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {splitLoading && splitMessages[splitMessages.length - 1]?.content === '' && (
                <div className="flex gap-4 justify-start">
                  <div className="w-9 h-9 rounded-xl bg-dark-800/60 border border-dark-600/30 flex items-center justify-center flex-shrink-0 text-cyan-400">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-dark-800/20 border border-dark-600/30 rounded-2xl rounded-tl-none p-4 max-w-[75%] flex items-center gap-2 text-sm text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>IA está compilando dados e digitando...</span>
                  </div>
                </div>
              )}

              <div ref={splitMessagesEndRef} />
            </div>

            {/* Input de Mensagem do Chat Split */}
            <div className="p-6 border-t border-dark-600/30 bg-dark-800/10 backdrop-blur-xl relative flex-shrink-0">
              
              {/* Floating File Pill do Chat Split */}
              <AnimatePresence>
                {splitAttachedFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -top-12 left-6 right-6 p-3 bg-dark-800/90 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4 text-xs backdrop-blur-md shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-emerald-400">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="font-semibold text-gray-200">{splitAttachedFile.name}</span>
                      <span className="text-gray-500">({splitAttachedFile.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSplitAttachedFile(null)}
                      className="p-1 text-gray-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSplitSend} className="flex gap-3 relative items-center">
                <input
                  type="file"
                  ref={splitFileInputRef}
                  onChange={handleSplitFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                />
                
                <button
                  type="button"
                  disabled={splitLoading}
                  onClick={() => splitFileInputRef.current?.click()}
                  className="p-4 rounded-xl bg-dark-800/60 border border-dark-600/30 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30 disabled:opacity-50 transition-all flex items-center justify-center flex-shrink-0"
                  title="Anexar arquivo CSV ou TXT"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={splitInput}
                  onChange={(e) => setSplitInput(e.target.value)}
                  placeholder={splitLoading ? 'IA está processando...' : 'Fale simultaneamente nesta conversa...'}
                  disabled={splitLoading}
                  className="flex-1 bg-dark-800/50 border border-dark-600/30 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-gray-100 placeholder-gray-500 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={splitLoading || (!splitInput.trim() && !splitAttachedFile)}
                  className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all flex-shrink-0"
                >
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        )}
      </div>

      {/* Barra Lateral de Auditoria de Ações */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-dark-800/15 backdrop-blur-xl flex flex-col flex-shrink-0 z-0 overflow-hidden"
          >
            <div className="p-6 border-b border-dark-600/30 flex items-center justify-between">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Auditoria de Ações
              </h2>
              {actionLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="p-1 text-gray-500 hover:text-red-400 rounded-lg hover:bg-dark-700/50 transition-all"
                  title="Limpar logs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
              {actionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-4">
                  <Bot className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-xs">Nenhum comando administrativo foi disparado pela IA ainda.</p>
                  <p className="text-[10px] text-gray-600 mt-1">
                    Experimente pedir: "mude a descrição do fone" ou "carregue estoque".
                  </p>
                </div>
              ) : (
                actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-dark-600/20 bg-dark-850/40 relative shadow-sm hover:border-cyan-500/20 transition-all"
                  >
                    <span className="text-[9px] font-bold text-gray-500 absolute top-2 right-3">
                      {log.date}
                    </span>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal para Gerenciador de Chaves de API */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-dark-800 border border-dark-600/50 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => setShowKeyModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-gray-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-200">Gerenciador de Chaves OpenRouter</h3>
                  <p className="text-xs text-gray-500 font-medium">Cadastre e gerencie múltiplas chaves de API</p>
                </div>
              </div>

              {/* Lista de Chaves Cadastradas */}
              <div className="flex-1 overflow-y-auto mb-4 pr-1 space-y-3 custom-scrollbar">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Minhas Chaves ({apiKeys.length})</span>
                {apiKeys.map((k) => (
                  <div key={k.id} className="p-3 bg-dark-900 border border-dark-600/40 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-cyan-400 truncate">{k.name}</p>
                      <input
                        type="password"
                        value={k.value}
                        onChange={(e) => handleUpdateKeyValue(k.id, e.target.value)}
                        placeholder="sk-or-v1-... (Sem chave de API)"
                        className="bg-transparent text-gray-400 border-none outline-none w-full text-[10px] mt-1 font-mono focus:text-gray-200"
                      />
                    </div>
                    {k.id !== 'key-default' && (
                      <button
                        onClick={() => handleDeleteApiKey(k.id)}
                        className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-dark-800 transition-all flex-shrink-0"
                        title="Remover Chave"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Formulário para Adicionar Nova Chave */}
              <form onSubmit={handleAddApiKey} className="pt-4 border-t border-dark-600/30 space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Adicionar Nova Chave</span>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Nome (ex: Chave Pessoal)"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50 text-gray-100 placeholder-gray-600 transition-all"
                  />
                  <input
                    type="password"
                    required
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    placeholder="OpenRouter API Key (sk-or-...)"
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50 text-gray-100 placeholder-gray-600 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/10 transition-all text-center flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Cadastrar Chave
                </button>
              </form>

              <div className="flex justify-end pt-4 border-t border-dark-600/30 mt-4">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl border border-dark-600 text-xs font-semibold text-gray-400 hover:bg-dark-700/50 hover:text-gray-200 transition-all"
                >
                  Concluído
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Guia de Recursos da IA */}
      <AnimatePresence>
        {showFeaturesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl p-6 rounded-2xl bg-dark-800 border border-dark-600/50 shadow-2xl relative max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-gray-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-200">Guia de Recursos do Copiloto</h3>
                  <p className="text-xs text-gray-500 font-medium">Tudo o que a inteligência artificial do NexMarket pode fazer por você</p>
                </div>
              </div>

              {/* Grid de Recursos */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar text-xs">
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Recurso 1: Importação de CSV */}
                  <div className="p-4 bg-dark-900/60 border border-dark-600/40 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                      <span>Importação Avançada de CSV</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Envie qualquer planilha de produtos ou categorias. A IA identifica e mapeia colunas (foto, nome, etc.) automaticamente, cria categorias inexistentes na hora e ignora colunas incompatíveis.
                    </p>
                    <div className="p-2 rounded bg-dark-800/50 text-[10px] text-gray-500 font-mono">
                      "Importe este arquivo no sistema..." ou anexe um .csv/.txt
                    </div>
                  </div>

                  {/* Recurso 2: Monitoramento de Preços */}
                  <div className="p-4 bg-dark-900/60 border border-dark-600/40 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Cpu className="w-4 h-4 flex-shrink-0" />
                      <span>Sincronização de Preços & Markup</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Sincronize preços com fornecedores externos (ex: Auraa Store) com 40% de margem de lucro. A IA testa links, detecta preços e pergunta se precisar de ajuda com seletores CSS de forma interativa.
                    </p>
                    <div className="p-2 rounded bg-dark-800/50 text-[10px] text-gray-500 font-mono">
                      "Pegue os preços do site X link Y..."
                    </div>
                  </div>

                  {/* Recurso 3: Ações Administrativas Diretas */}
                  <div className="p-4 bg-dark-900/60 border border-dark-600/40 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Terminal className="w-4 h-4 flex-shrink-0" />
                      <span>Comandos no Banco Supabase</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      A IA pode fazer alterações diretas seguras e auditadas no banco de dados. Modifique produtos, crie categorias ou configure sincronizadores de preços escrevendo apenas em linguagem natural.
                    </p>
                    <div className="p-2 rounded bg-dark-800/50 text-[10px] text-gray-500 font-mono">
                      "Mude o estoque da variação 12 para 50..."
                    </div>
                  </div>

                  {/* Recurso 4: Tela Dividida (Split Screen) */}
                  <div className="p-4 bg-dark-900/60 border border-dark-600/40 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Columns className="w-4 h-4 flex-shrink-0" />
                      <span>Chats Simultâneos (Split View)</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Fale em dois canais ao mesmo tempo! Clique no ícone de colunas na barra lateral para abrir qualquer conversa no lado direito da tela e realizar multitarefas de forma integrada.
                    </p>
                    <div className="p-2 rounded bg-dark-800/50 text-[10px] text-gray-500 font-mono">
                      Passe o mouse em um chat na barra lateral e clique em [Columns]
                    </div>
                  </div>

                  {/* Recurso 5: Múltiplas Chaves de API */}
                  <div className="p-4 bg-dark-900/60 border border-dark-600/40 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Key className="w-4 h-4 flex-shrink-0" />
                      <span>Gerenciador de Chaves de API</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Cadastre e nomeie múltiplas chaves OpenRouter. Associe chaves de API diferentes para chats individuais no cabeçalho de cada conversa para total flexibilidade e controle.
                    </p>
                    <div className="p-2 rounded bg-dark-800/50 text-[10px] text-gray-500 font-mono">
                      Clique no botão [CHAVES] no cabeçalho para gerenciar
                    </div>
                  </div>

                  {/* Recurso 6: Workspace e Canais Fixos */}
                  <div className="p-4 bg-dark-900/60 border border-dark-600/40 rounded-xl space-y-2 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span>Workspace Organizacional</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Aproveite canais fixos focados em Uploads (📤 Configurar Uploads) e Scrapers (🔍 Pesquisa de Preços), ou crie e fixe seus próprios chats customizados para manter tudo organizado.
                    </p>
                    <div className="p-2 rounded bg-dark-800/50 text-[10px] text-gray-500 font-mono">
                      Clique duas vezes no título de um chat para renomeá-lo
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4 border-t border-dark-600/30 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFeaturesModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium shadow-lg shadow-cyan-500/10 hover:opacity-90 transition-all text-center active:scale-95"
                >
                  Entendido, obrigado!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
