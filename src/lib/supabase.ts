import { createClient } from '@supabase/supabase-js';

/**
 * 環境変数を取得（遅延評価）
 */
function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set in environment variables');
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables');
  }
  return key;
}

/**
 * Supabase クライアント（クライアントサイド用）
 *
 * 使用例:
 * ```typescript
 * import { supabase } from '@/lib/supabase';
 *
 * const { data, error } = await supabase
 *   .from('knowledge_base')
 *   .select('*')
 *   .limit(10);
 * ```
 */
let _supabase: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
    }
    return (_supabase as any)[prop];
  },
});

/**
 * Supabase Admin クライアント（サーバーサイド専用）
 *
 * ⚠️ 注意: このクライアントは service_role キーを使用するため、
 * サーバーサイド（API Routes, Server Components）でのみ使用してください。
 * クライアントサイドでは絶対に使用しないこと！
 *
 * 使用例:
 * ```typescript
 * import { supabaseAdmin } from '@/lib/supabase';
 *
 * // API Routeで使用
 * export async function POST(request: Request) {
 *   const { data, error } = await supabaseAdmin
 *     .from('knowledge_base')
 *     .insert({ ... });
 * }
 * ```
 */
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
