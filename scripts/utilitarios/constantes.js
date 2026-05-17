/* ============================================
   NEXCHAT - Constantes
   IDs, Modelos disponíveis, Configurações padrão
   ============================================ */

const OPENROUTER_URL_BASE = 'https://openrouter.ai/api/v1/chat/completions';

const CHAVES_ARMAZENAMENTO = {
    API_KEY: 'nexchat_api_key',
    CONVERSAS: 'nexchat_conversas',
    CONVERSA_ATIVA: 'nexchat_conversa_ativa',
    MODELO_SELECIONADO: 'nexchat_modelo',
    PROMPT_SISTEMA: 'nexchat_prompt_sistema',
    TEMPERATURA: 'nexchat_temperatura',
    MAX_TOKENS: 'nexchat_max_tokens',
    STREAMING: 'nexchat_streaming',
};

const CONFIGURACAO_PADRAO = {
    promptSistema: 'Você é um assistente de IA prestativo, preciso e amigável. Responda sempre em português do Brasil de forma clara e organizada.',
    temperatura: 0.7,
    maxTokens: 2048,
    streaming: true,
};

const MODELOS_DISPONIVEIS = [
    // --- Router automático ---
    {
        id: 'openrouter/free',
        nome: 'Auto (Modelo Gratuito Aleatório)',
        descricao: 'O OpenRouter seleciona automaticamente um modelo gratuito online para você',
        categoria: 'OpenRouter',
        icone: '✨',
    },
    // --- DeepSeek ---
    {
        id: 'deepseek/deepseek-r1:free',
        nome: 'DeepSeek R1',
        descricao: 'Raciocínio avançado e resolução de problemas',
        categoria: 'DeepSeek',
        icone: '🧠',
    },
    {
        id: 'deepseek/deepseek-chat-v3-0324:free',
        nome: 'DeepSeek V3',
        descricao: 'Chat geral rápido e versátil',
        categoria: 'DeepSeek',
        icone: '⚡',
    },
    // --- Meta Llama ---
    {
        id: 'meta-llama/llama-4-maverick:free',
        nome: 'Llama 4 Maverick',
        descricao: 'Modelo multimodal poderoso da Meta',
        categoria: 'Meta Llama',
        icone: '🦙',
    },
    {
        id: 'meta-llama/llama-4-scout:free',
        nome: 'Llama 4 Scout',
        descricao: 'Contexto longo e análise detalhada',
        categoria: 'Meta Llama',
        icone: '🔍',
    },
    // --- Qwen ---
    {
        id: 'qwen/qwen3-235b-a22b:free',
        nome: 'Qwen 3 235B',
        descricao: 'Multilíngue com excelente raciocínio',
        categoria: 'Qwen',
        icone: '🌐',
    },
    {
        id: 'qwen/qwen3-30b-a3b:free',
        nome: 'Qwen 3 30B',
        descricao: 'Rápido e eficiente para tarefas gerais',
        categoria: 'Qwen',
        icone: '🚀',
    },
    // --- Google ---
    {
        id: 'google/gemma-3-27b-it:free',
        nome: 'Gemma 3 27B',
        descricao: 'Modelo aberto do Google, rápido e preciso',
        categoria: 'Google',
        icone: '💎',
    },
    // --- NVIDIA ---
    {
        id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
        nome: 'Nemotron Ultra 253B',
        descricao: 'Modelo gigante da NVIDIA para raciocínio complexo',
        categoria: 'NVIDIA',
        icone: '🎮',
    },
    // --- Outros ---
    {
        id: 'mistralai/mistral-small-3.1-24b-instruct:free',
        nome: 'Mistral Small 3.1',
        descricao: 'Eficiente e compacto da Mistral AI',
        categoria: 'Mistral',
        icone: '🌊',
    },
    {
        id: 'microsoft/phi-4-reasoning:free',
        nome: 'Phi-4 Reasoning',
        descricao: 'Modelo de raciocínio da Microsoft',
        categoria: 'Microsoft',
        icone: '🔬',
    },
];
