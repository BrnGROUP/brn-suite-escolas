import { vi } from 'vitest';
import * as SupabaseJS from '@supabase/supabase-js';

// Bloqueador de rede global para testes (impede conexões externas de rede não autorizadas)
const allowedHosts = [
  'localhost',
  '127.0.0.1',
  'mocked-project.supabase.co'
];

// Interceptador para globalThis.fetch
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlString = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.href 
      : input.url;

  try {
    // Tenta fazer o parse apenas se for uma URL absoluta
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      const url = new URL(urlString);
      const isAllowed = allowedHosts.some(host => url.hostname === host || url.hostname.endsWith('supabase.co'));
      if (!isAllowed && !url.hostname.startsWith('localhost')) {
        throw new Error(`🚫 [Network Guard] External network call to "${urlString}" is blocked by default in tests. Use MSW or mock this endpoint.`);
      }
    }
  } catch (e: any) {
    if (e.message?.includes('[Network Guard]')) {
      throw e;
    }
  }
  
  if (originalFetch) {
    return originalFetch(input, init);
  }
  
  throw new Error(`Fetch is not defined in this environment.`);
};

// Interceptador para globalThis.XMLHttpRequest
const originalXHR = globalThis.XMLHttpRequest;
if (originalXHR) {
  class GuardedXMLHttpRequest extends originalXHR {
    open(method: string, url: string | URL, ...args: any[]) {
      const urlString = typeof url === 'string' ? url : url.href;
      try {
        if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
          const parsedUrl = new URL(urlString);
          const isAllowed = allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith('supabase.co'));
          if (!isAllowed && !parsedUrl.hostname.startsWith('localhost')) {
            throw new Error(`🚫 [Network Guard] External network call via XMLHttpRequest to "${urlString}" is blocked by default in tests.`);
          }
        }
      } catch (e: any) {
        if (e.message?.includes('[Network Guard]')) {
          throw e;
        }
      }
      // @ts-ignore
      super.open(method, url, ...args);
    }
  }
  globalThis.XMLHttpRequest = GuardedXMLHttpRequest as any;
}

// Configura valores padrão para as variáveis de ambiente caso estejam ausentes no ambiente de testes
if (!process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://mocked-project.supabase.co';
}
if (!process.env.VITE_SUPABASE_ANON_KEY) {
  process.env.VITE_SUPABASE_ANON_KEY = 'mocked-anon-key';
}

// Interceptador de segurança do Supabase para bloquear operações de gravação (Opção B)
vi.mock('@supabase/supabase-js', async () => {
  const actual = await vi.importActual<typeof SupabaseJS>('@supabase/supabase-js');
  
  return {
    ...actual,
    createClient: (url: string, key: string, options?: any) => {
      const client = actual.createClient(url, key, options);
      
      // Salva o método original 'from' do cliente Supabase
      const originalFrom = client.from.bind(client);
      
      // Envolve o construtor de queries com guardas de segurança
      client.from = (table: string) => {
        const queryBuilder = originalFrom(table);
        
        return {
          ...queryBuilder,
          select: (...args: any[]) => {
            // Permite leituras reais (select)
            return queryBuilder.select(...args);
          },
          insert: () => {
            throw new Error(`🚫 [Security Guard] Write operation (INSERT) is strictly forbidden in this test environment to protect the database. Table targeted: "${table}".`);
          },
          update: () => {
            throw new Error(`🚫 [Security Guard] Write operation (UPDATE) is strictly forbidden in this test environment to protect the database. Table targeted: "${table}".`);
          },
          delete: () => {
            throw new Error(`🚫 [Security Guard] Write operation (DELETE) is strictly forbidden in this test environment to protect the database. Table targeted: "${table}".`);
          },
          upsert: () => {
            throw new Error(`🚫 [Security Guard] Write operation (UPSERT) is strictly forbidden in this test environment to protect the database. Table targeted: "${table}".`);
          }
        } as any;
      };
      
      return client;
    }
  };
});

