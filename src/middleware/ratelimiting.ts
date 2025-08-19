import { Context, Next } from 'hono';

export const rateLimitMiddleware = async (c: Context, next: Next) => {
  const env = c.env as CloudflareBindings;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const path = c.req.path;
  const key = `${path}:${ip}`;

  // Determina qual rate limiter usar com base no caminho
  const rateLimiter = path.startsWith('/api/ai') ? env.AI_RATE_LIMITER : env.API_RATE_LIMITER;

  // Aplica o rate limiting
  const { success } = await rateLimiter.limit({ key });

  // Se excedeu o limite, retorna erro 429
  if (!success) {
    return c.json(
      {
        success: false,
        error: 'Too Many Requests',
        message: `Rate limit excedido. Tente novamente em instantes.`
      },
      429
    );
  }
  // Continua para o próximo middleware/handler
  await next();
};
