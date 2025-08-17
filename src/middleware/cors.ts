import { cors } from 'hono/cors';
import type { Context, Next } from 'hono';

// Configurações padrão de CORS (fallback se não definidas na plataforma)
const DEFAULT_CORS_CONFIG = {
  ALLOWED_ORIGINS: '*', // Desenvolvimento
  CORS_CREDENTIALS: 'false',
  CORS_MAX_AGE: '86400',
  CORS_METHODS: 'GET,POST,PUT,DELETE,OPTIONS',
  CORS_HEADERS: 'Content-Type,Authorization,X-Requested-With,X-API-Key'
};

// Log de origem das configurações (para debug)
const logConfigSource = (env: CloudflareBindings) => {
  const sources: string[] = [];

  if (env.ALLOWED_ORIGINS && env.ALLOWED_ORIGINS !== DEFAULT_CORS_CONFIG.ALLOWED_ORIGINS) {
    sources.push('ALLOWED_ORIGINS: Plataforma');
  } else {
    sources.push('ALLOWED_ORIGINS: wrangler.jsonc');
  }

  if (env.ENVIRONMENT === 'development') {
    console.log('🔧 CORS Sources:', sources.join(', '));
  }
};

// Função para obter configuração de ambiente com fallbacks
const getEnvConfig = (env: CloudflareBindings) => ({
  allowedOrigins: env.ALLOWED_ORIGINS || DEFAULT_CORS_CONFIG.ALLOWED_ORIGINS,
  credentials: (env.CORS_CREDENTIALS || DEFAULT_CORS_CONFIG.CORS_CREDENTIALS) === 'true',
  maxAge: parseInt(env.CORS_MAX_AGE || DEFAULT_CORS_CONFIG.CORS_MAX_AGE),
  methods: (env.CORS_METHODS || DEFAULT_CORS_CONFIG.CORS_METHODS).split(',').map(m => m.trim()),
  headers: (env.CORS_HEADERS || DEFAULT_CORS_CONFIG.CORS_HEADERS).split(',').map(h => h.trim())
});

// Função para validar origem
const isOriginAllowed = (origin: string | undefined, allowedOrigins: string): boolean => {
  if (!origin) {
    return true;
  } // Requests diretos (sem origem)

  const origins = allowedOrigins.split(',').map(o => o.trim());

  // Se contém '*', permitir todas
  if (origins.includes('*')) {
    return true;
  }

  // Verificar origem exata
  if (origins.includes(origin)) {
    return true;
  }

  // Verificar wildcards (ex: *.negramidia.com)
  return origins.some(allowedOrigin => {
    if (allowedOrigin.startsWith('*.')) {
      const domain = allowedOrigin.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });
};

// Middleware CORS configurável via variáveis de ambiente
export const corsMiddleware = async (c: Context, next: Next) => {
  const config = getEnvConfig(c.env);

  // Log das configurações e suas origens em desenvolvimento
  if (c.env.ENVIRONMENT === 'development') {
    logConfigSource(c.env);
    console.log('🔧 CORS Config:', {
      origins: config.allowedOrigins,
      credentials: config.credentials,
      maxAge: config.maxAge,
      environment: c.env.ENVIRONMENT || 'not-set'
    });
  }

  const corsHandler = cors({
    origin: (origin, _ctx) => {
      const allowed = isOriginAllowed(origin, config.allowedOrigins);

      if (!allowed && c.env.ENVIRONMENT === 'development') {
        console.warn(`❌ CORS: Origem rejeitada: ${origin}`);
      }

      return allowed ? origin : null;
    },
    allowMethods: config.methods,
    allowHeaders: config.headers,
    credentials: config.credentials,
    maxAge: config.maxAge
  });

  return corsHandler(c, next);
};
