import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import { adaptiveLoggerMiddleware } from './middleware/logger';
import { ApiResponse } from './types';

// Import routes
import notificationsRoutes from './routes/notifications';
import aiRoutes from './routes/ai';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Apply logging middleware first (captures all requests)
app.use('*', adaptiveLoggerMiddleware);

// Apply CORS middleware globally
app.use('*', corsMiddleware);

// Health check endpoint
app.get('/health', c => {
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

// API info endpoint
app.get('/', c => {
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
          'POST /ai/generate-notification - Gerar notificação',
          'POST /ai/summarize-notifications - Resumir notificações',
          'GET /ai/models - Listar modelos disponíveis'
        ],
        system: ['GET /health - Status da API', 'GET / - Informações da API'],
        features: [
          'Logging automático (desenvolvimento)',
          'CORS dinâmico',
          'IA integrada via gateway',
          'Banco D1 via Prisma ORM',
          'Timezone Brasil (UTC-3)'
        ]
      }
    }
  };
  return c.json(response);
});

// Mount routes
app.route('/notifications', notificationsRoutes);
app.route('/ai', aiRoutes);

// 404 handler
app.notFound(c => {
  const response: ApiResponse<never> = {
    success: false,
    error: 'Endpoint não encontrado'
  };
  return c.json(response, 404);
});

// Error handler
app.onError((error, c) => {
  console.error('Erro não tratado:', error);

  const response: ApiResponse<never> = {
    success: false,
    error: 'Erro interno do servidor'
  };
  return c.json(response, 500);
});

export default app;
