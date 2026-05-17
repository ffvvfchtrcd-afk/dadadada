import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, RefreshCw, Play, CheckCircle2,
  AlertTriangle, Key, Cpu, History, Trash2, X, Terminal
} from 'lucide-react';
import { openrouterService } from '../../../services/openrouterService';
import { aiActionService } from '../../../services/aiActionService';

// Renderizador simples e robusto de Markdown nativo
function parseSimpleMarkdown(text) {
  if (!text) return '';
  
  // Limpa blocos de ação técnica para não exibir no balão comum do chat
  let cleanText = text.replace(/\[ADMIN_ACTION\]\s*\{.*\}\s*$/, '').trim();

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
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá! Sou o seu **IA Copiloto da NexMarket**. Tenho acesso a todo o catálogo de produtos, variações, métodos de entrega e estatísticas de vendas em tempo real. \n\nPosso ajudar você a:\n- **Consultar Métricas:** *"Quantas vendas tivemos hoje?"* ou *"Qual faturamento de ontem?"*\n- **Editar Informações:** *"Mude o preço do Netflix Premium para R$ 19.90"* ou *"Edite a descrição do Fone Gamer"*.\n- **Gerenciar Estoque:** *"Adicione essas contas na variação X"*.\n- **Políticas de Entrega:** *"Altere o envio do plano mensal para automático"*.\n\nComo posso ajudar você a otimizar a sua operação hoje?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('openrouter/free');
  const [modelsList, setModelsList] = useState([]);
  const [actionLogs, setActionLogs] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [customKey, setCustomKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [currentActionFeedback, setCurrentActionFeedback] = useState(null);

  const messagesEndRef = useRef(null);

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

  // Rolagem automática do chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Salvar chave de API customizada
  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('nexmarket_openrouter_key', customKey.trim());
    setShowKeyModal(false);
  };

  // Limpar logs de auditoria
  const handleClearLogs = () => {
    localStorage.removeItem('nexmarket_ai_logs');
    setActionLogs([]);
  };

  // Trata e executa possíveis ações administrativas embutidas na resposta da IA
  const handlePotentialAdminAction = async (responseText) => {
    const actionRegex = /\[ADMIN_ACTION\]\s*(\{.*\})\s*$/;
    const match = responseText.match(actionRegex);

    if (match) {
      try {
        const actionData = JSON.parse(match[1]);
        const { comando, parametros } = actionData;

        // Feedback visual animado
        setCurrentActionFeedback({
          comando,
          status: 'executing',
          message: `IA solicitou execução de: ${comando}...`
        });

        // Executa mutação real no banco
        const result = await aiActionService.executarAcao(comando, parametros);

        if (result.success) {
          const newLog = {
            id: Date.now(),
            action: comando,
            details: result.message,
            date: new Date().toLocaleTimeString('pt-BR')
          };

          const updatedLogs = [newLog, ...actionLogs].slice(0, 50);
          setActionLogs(updatedLogs);
          localStorage.setItem('nexmarket_ai_logs', JSON.stringify(updatedLogs));

          setCurrentActionFeedback({
            comando,
            status: 'success',
            message: result.message
          });

          // Notifica os outros componentes para atualizarem o estado local
          window.dispatchEvent(new Event('app-state-change'));
        } else {
          setCurrentActionFeedback({
            comando,
            status: 'failed',
            message: `Erro na execução: ${result.error}`
          });
        }
      } catch (e) {
        console.error("Falha ao interpretar comando da IA:", e);
        setCurrentActionFeedback({
          comando: 'DESCONHECIDO',
          status: 'failed',
          message: 'Falha ao decodificar JSON do comando administrativo.'
        });
      }

      // Oculta feedback após 5 segundos
      setTimeout(() => {
        setCurrentActionFeedback(null);
      }, 5000);
    }
  };

  // Envio de mensagem
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const assistantMsgId = `ai-${Date.now()}`;
    // Adiciona o balão de resposta em branco
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '' }]);

    try {
      const streamResult = await openrouterService.enviarMensagemStream(
        [...messages, userMessage],
        model,
        (chunk, fullContent) => {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
          ));
        }
      );

      // Executa a ação administrativa de forma segura a partir do conteúdo consolidado retornado pelo stream
      if (streamResult && streamResult.content) {
        await handlePotentialAdminAction(streamResult.content);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId 
          ? { ...msg, content: `⚠️ **Erro de Conexão:** ${err.message || 'Falha ao obter resposta do OpenRouter.'}` } 
          : msg
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-dark-950 text-gray-100 relative">
      
      {/* Container Principal do Chat */}
      <div className="flex-1 flex flex-col h-full relative z-10 border-r border-dark-600/30">
        
        {/* Cabeçalho do Chat */}
        <div className="h-16 border-b border-dark-600/30 flex items-center justify-between px-6 bg-dark-800/20 backdrop-blur-xl">
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
              </h1>
              <p className="text-xs text-gray-500">Superpoderes de controle e auditoria baseados em OpenRouter</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              className="p-2 rounded-xl border border-dark-600/30 bg-dark-700/10 hover:bg-dark-700/50 text-gray-400 hover:text-cyan-400 transition-all"
              title="Chave de API Customizada"
            >
              <Key className="w-4 h-4" />
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

        {/* Zona de Mensagens do Chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-2xl p-4 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-dark-800/40 border border-dark-600/30 rounded-tl-none'
                }`}
              >
                <div 
                  className="prose prose-invert max-w-none text-sm"
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
        <div className="p-6 border-t border-dark-600/30 bg-dark-800/10 backdrop-blur-xl">
          <form onSubmit={handleSend} className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? 'IA está processando...' : 'Pergunte sobre vendas ou edite o estoque, produtos e variações...'}
              disabled={loading}
              className="flex-1 bg-dark-800/50 border border-dark-600/30 rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-gray-100 placeholder-gray-500 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:hover:opacity-40 shadow-lg shadow-cyan-500/10 active:scale-95 transition-all"
            >
              <span>Enviar</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
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

      {/* Modal para Chave Customizada */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-dark-800 border border-dark-600/50 shadow-2xl relative"
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
                  <h3 className="font-semibold text-gray-200">Chave OpenRouter</h3>
                  <p className="text-xs text-gray-500">Configure sua chave de API pessoal</p>
                </div>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 text-gray-100 placeholder-gray-600 transition-all"
                  />
                  <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                    Se deixado em branco, a aplicação utilizará a chave global segura configurada nas variáveis de ambiente da Vercel.
                  </p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-dark-600 text-xs font-medium text-gray-400 hover:bg-dark-700/50 hover:text-gray-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/10 transition-all"
                  >
                    Salvar Chave
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
