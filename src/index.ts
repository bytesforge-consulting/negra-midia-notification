import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { adaptiveLoggerMiddleware } from './middleware/logger';
import { rateLimitMiddleware } from './middleware/ratelimiting';
import type { ApiResponse } from './types';
import { getBrazilReadTime } from './helpers';
import { scheduledHandler } from './routes/scheduled';

// Importar rotas
import notificationsRoutes from './routes/notifications';
import aiRoutes from './routes/ai';
import { authMiddleware } from './middleware/auth';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Aplicar middleware de logging primeiro (captura todas as requisições)
app.use('*', adaptiveLoggerMiddleware);
// Aplicar middleware de rate limiting para rotas específicas
app.use('*', rateLimitMiddleware);
// Aplicar middleware CORS globalmente
app.use('/api/*', corsMiddleware);
// Aplicar middleware de autenticação
app.use('/api/*', authMiddleware);

// Endpoints de depuração (com prefixo /api)
app.get('/api/__debug', async c => {
  const response: ApiResponse<{
    method: string;
    url: string;
    path: string;
    headers: Record<string, string>;
    timestamp: string;
  }> = {
    success: true,
    data: {
      method: c.req.method,
      url: c.req.url,
      path: c.req.path,
      headers: Object.fromEntries(c.req.raw.headers.entries()),
      timestamp: getBrazilReadTime().toISOString()
    }
  };
  return c.json(response);
});

app.get('/api/__health', c => {
  const response: ApiResponse<{
    status: string;
    timestamp: string;
    version: string;
    services: string[];
  }> = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: ['notifications', 'ai', 'database']
    }
  };
  return c.json(response);
});

// Endpoints de informações da API - com e sem prefixo
app.get('/api', c => {
  const response: ApiResponse<{
    name: string;
    description: string;
    version: string;
    endpoints: Record<string, string[]>;
  }> = {
    success: true,
    data: {
      name: 'Negra Mídia Notify API',
      description: 'API para gerenciamento de notificações com IA integrada',
      version: '1.0.0',
      endpoints: {
        notifications: [
          'GET /notifications - Listar notificações',
          'GET /notifications/:id - Buscar por ID',
          'POST /notifications - Criar notificação',
          'PUT /notifications/:id/read - Marcar como lida',
          'GET /notifications/paginate - Buscar notificações com paginação e filtro'
        ],
        ai: [
          'POST /ai/generate - Geração livre de texto',
          'POST /ai/process-unread - Processar notificações não lidas',
          'POST /ai/analyze-unread - Analisar notificações sem marcar como lidas',
          'GET /ai/daily-digest - Digest diário com IA',
          'GET /ai/models - Listar modelos disponíveis'
        ],
        system: ['GET /health - Status da API', 'GET / - Informações da API'],
        cron: [
          'Diário às 0h Brasil (3h UTC) - Digest diário com IA',
          'Semanal às segundas 0h Brasil (3h UTC) - Digest semanal e limpeza',
          'Mensal dia 1 às 0h Brasil (3h UTC) - Digest mensal e auditoria'
        ],
        features: [
          'Logging automático (desenvolvimento)',
          'CORS dinâmico',
          'IA integrada via gateway',
          'Banco D1 via Prisma ORM',
          'Timezone Brasil (UTC-3)',
          'Cron jobs automáticos'
        ]
      }
    }
  };
  return c.json(response);
});

// Montar rotas - com e sem prefixo /api para compatibilidade
app.route('/api/notifications', notificationsRoutes);
app.route('/api/ai', aiRoutes);

// Manipulador 404
app.notFound(c => {
  const response: ApiResponse<never> = {
    success: false,
    error: `Requisição ${c.req.method} ${c.req.url} não encontrada`
  };
  return c.json(response, 404);
});

// Manipulador de erros
app.onError((error, c) => {
  console.error('Erro não tratado:', error);

  // Verificar se é um erro de autenticação básica
  if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
    // Retornar erro 401 para autenticação básica
    const authErrorResponse: ApiResponse<never> = {
      success: false,
      error: 'Autenticação necessária'
    };
    return c.json(authErrorResponse, 401);
  }

  // Para outros erros, retornar 500
  const response: ApiResponse<never> = {
    success: false,
    error: JSON.stringify(error)
  };
  return c.json(response, 500);
});

export default {
  fetch: app.fetch,
  scheduled: scheduledHandler
};
