import { createClient } from '@supabase/supabase-js';

// Inicialização segura para evitar quebra em modo JSON sem chaves configuradas
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: { 'x-client-info': 'nexmarket-storefront' }
  }
});
