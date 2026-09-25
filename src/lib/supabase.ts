import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or runtime storage fallback for seamless preview configuration
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const STORAGE_CUSTOM_URL_KEY = 'nfc_custom_supabase_url';
const STORAGE_CUSTOM_KEY_KEY = 'nfc_custom_supabase_anon_key';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean; isCustom: boolean } {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOM_URL_KEY) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOM_KEY_KEY) : null;

  const url = customUrl || ENV_SUPABASE_URL;
  const anonKey = customKey || ENV_SUPABASE_ANON_KEY;
  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('your-project') &&
    !anonKey.includes('your-supabase-anon-key')
  );

  return {
    url,
    anonKey,
    isConfigured,
    isCustom: Boolean(customUrl && customKey),
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_CUSTOM_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_CUSTOM_KEY_KEY, anonKey.trim());
    window.location.reload();
  }
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_CUSTOM_URL_KEY);
    localStorage.removeItem(STORAGE_CUSTOM_KEY_KEY);
    window.location.reload();
  }
}

// Fallback dummy client for build-time safety and graceful offline mode
const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_ANON_KEY = 'placeholder-key';

const activeConfig = getSupabaseConfig();
const clientUrl = activeConfig.isConfigured ? activeConfig.url : FALLBACK_URL;
const clientKey = activeConfig.isConfigured ? activeConfig.anonKey : FALLBACK_ANON_KEY;

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not yet configured.',
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(1);

    if (error) {
      // If table doesn't exist yet, return helpful guidance
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase project, but tables are not created yet. Please execute supabase/schema.sql in the SQL Editor.',
        };
      }
      return { success: false, message: `Database error: ${error.message}` };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase! Found ${data ? data.length : 0} sample profile records.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to establish network connection with Supabase.',
    };
  }
}
