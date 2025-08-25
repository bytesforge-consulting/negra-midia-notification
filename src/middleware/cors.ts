import { cors } from 'hono/cors';
import type { Context, Next } from 'hono';
import type { ApiResponse } from '../types/common';

// Configurações padrão de CORS (fallback se não definidas na plataforma)
const DEFAULT_CORS_CONFIG = {
  ALLOWED_ORIGINS: '*.negramidia.net', // Permite qualquer subdomínio de negramidia.net
  CORS_CREDENTIALS: 'false',
  CORS_MAX_AGE: '86400',
  CORS_METHODS: 'GET',
  CORS_HEADERS: 'Content-Type,Authorization,X-Requested-With,X-API-Key'
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
    return false;
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

  // Pular validação CORS para endpoints de depuração
  const isDebugEndpoint = c.req.path.startsWith('/api/__');
  if (isDebugEndpoint) {
    return next();
  }

  // Log das configurações e suas origens em desenvolvimento
  if (c.req.url.includes('localhost')) {
    console.log('🔧 CORS Configuração:', {
      origins: config.allowedOrigins,
      credentials: config.credentials,
      maxAge: config.maxAge,
      environment: c.env.ENVIRONMENT || 'not-set'
    });
  }

  // Verificar se a origem é permitida antes de aplicar o CORS
  const origin = c.req.header('Origin');
  const allowed = isOriginAllowed(origin, config.allowedOrigins);

  if (!allowed) {
    console.warn(`❌ CORS: Origem rejeitada: ${origin}`);
    const response: ApiResponse<never> = {
      success: false,
      error: 'Origem não permitida'
    };
    return c.json(response, 403);
  }

  const corsHandler = cors({
    origin: (origin, _ctx) => {
      return isOriginAllowed(origin, config.allowedOrigins) ? origin : null;
    },
    allowMethods: config.methods,
    allowHeaders: config.headers,
    credentials: config.credentials,
    maxAge: config.maxAge
  });

  return corsHandler(c, next);
};
