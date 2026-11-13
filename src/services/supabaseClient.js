import { createClient } from '@supabase/supabase-js';

function readEnvConfig() {
  const rawUrl =
    import.meta.env?.VITE_SUPABASE_URL ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : '') ||
    '';
  const rawAnonKey =
    import.meta.env?.VITE_SUPABASE_ANON_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : '') ||
    '';

  return {
    url: String(rawUrl).trim(),
    anonKey: String(rawAnonKey).trim(),
  };
}

function isPlaceholderValue(value) {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('your-project-id') ||
    lower.includes('your-public-anon-key') ||
    lower === 'undefined' ||
    lower === 'null'
  );
}

function isServiceRoleKey(key) {
  if (!key) return false;
  if (key.toLowerCase().includes('service_role')) return true;

  // Check JWT payload if key is a 3-part JWT
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr =
        typeof atob === 'function'
          ? atob(base64)
          : Buffer.from(base64, 'base64').toString('utf8');
      const payload = JSON.parse(jsonStr);
      if (payload?.role === 'service_role') {
        return true;
      }
    } catch {
      // Ignore malformed JWT segment
    }
  }
  return false;
}

export function validateSupabaseConfig(url, anonKey) {
  if (!url || isPlaceholderValue(url)) {
    return {
      isValid: false,
      reason: 'MISSING_URL',
      message: 'Chưa cấu hình VITE_SUPABASE_URL trong file .env.',
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      isValid: false,
      reason: 'INVALID_URL',
      message: 'VITE_SUPABASE_URL không đúng định dạng URL hợp lệ.',
    };
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
    return {
      isValid: false,
      reason: 'INSECURE_URL',
      message: 'VITE_SUPABASE_URL phải sử dụng giao thức HTTPS.',
    };
  }

  if (!anonKey || isPlaceholderValue(anonKey)) {
    return {
      isValid: false,
      reason: 'MISSING_ANON_KEY',
      message: 'Chưa cấu hình VITE_SUPABASE_ANON_KEY trong file .env.',
    };
  }

  if (isServiceRoleKey(anonKey)) {
    return {
      isValid: false,
      reason: 'FORBIDDEN_SERVICE_ROLE_KEY',
      message: 'Bảo mật: Tuyệt đối không sử dụng service_role key ở phía Frontend!',
    };
  }

  return {
    isValid: true,
    reason: 'OK',
    message: 'Đã cấu hình kết nối Supabase hợp lệ.',
  };
}

export function createSupabaseClientInstance(customConfig = null) {
  const { url, anonKey } = customConfig || readEnvConfig();
  const validation = validateSupabaseConfig(url, anonKey);

  if (!validation.isValid) {
    return {
      client: null,
      status: validation,
    };
  }

  try {
    const client = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 5,
        },
      },
    });

    return {
      client,
      status: validation,
    };
  } catch (err) {
    return {
      client: null,
      status: {
        isValid: false,
        reason: 'CLIENT_INIT_FAILED',
        message: err?.message || 'Không thể khởi tạo Supabase client.',
      },
    };
  }
}

const defaultInstance = createSupabaseClientInstance();

export const supabase = defaultInstance.client;

export function isSupabaseConfigured() {
  return Boolean(defaultInstance.client && defaultInstance.status.isValid);
}

export function getSupabaseStatus() {
  return { ...defaultInstance.status };
}

export default supabase;

