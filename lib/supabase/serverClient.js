// ==================== CLIENTE SUPABASE PARA SERVER ====================
// Arquivo: /lib/supabase/serverClient.js
//
// Funções centralizadas para criação de clientes Supabase
// Utilizadas em API routes e server-side code

import { createClient } from '@supabase/supabase-js';

/**
 * Cria cliente Supabase com chave anônima (padrão)
 * Usado para operações que não requerem privilégios administrativos
 *
 * @returns {Object} Cliente Supabase configurado
 * @throws {Error} Se as variáveis de ambiente não estiverem configuradas
 *
 * @example
 * const supabase = getSupabaseAnonClient();
 * const { data, error } = await supabase.from('avatares').select('*');
 */
export function getSupabaseAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL e ANON_KEY devem estar configurados nas variáveis de ambiente');
  }

  return createClient(url, key);
}

/**
 * Cria cliente Supabase com Service Role Key
 * Usado para operações administrativas que bypasam Row Level Security (RLS)
 *
 * ⚠️ ATENÇÃO: Use apenas em contextos server-side seguros!
 * Nunca exponha este cliente ao frontend
 *
 * @returns {Object} Cliente Supabase com privilégios administrativos
 * @throws {Error} Se as variáveis de ambiente não estiverem configuradas
 *
 * @example
 * const supabase = getSupabaseServiceClient();
 * const { data, error } = await supabase.from('avatares').insert(avatar);
 */
export function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase URL e SERVICE_ROLE_KEY devem estar configurados nas variáveis de ambiente');
  }

  return createClient(url, key);
}

/**
 * Cria cliente Supabase com validação segura
 * Retorna null se as credenciais não estiverem disponíveis
 * Útil para contextos onde Supabase é opcional
 *
 * @param {boolean} useServiceRole - Se deve usar Service Role Key ao invés de Anon Key
 * @returns {Object|null} Cliente Supabase ou null se não configurado
 *
 * @example
 * const supabase = getSupabaseClientSafe();
 * if (!supabase) {
 *   return Response.json({ error: 'Database não configurado' }, { status: 500 });
 * }
 */
export function getSupabaseClientSafe(useServiceRole = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'cache-control': 'no-cache',
      },
    },
  });
}

/**
 * Verifica se as credenciais Supabase estão configuradas
 *
 * @param {boolean} checkServiceRole - Se deve verificar Service Role Key
 * @returns {boolean} Se as credenciais estão disponíveis
 *
 * @example
 * if (!isSupabaseConfigured()) {
 *   console.error('Supabase não está configurado!');
 * }
 */
export function isSupabaseConfigured(checkServiceRole = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = checkServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(url && key);
}

// Exportação default para compatibilidade
export default {
  getSupabaseAnonClient,
  getSupabaseServiceClient,
  getSupabaseClientSafe,
  isSupabaseConfigured
};
