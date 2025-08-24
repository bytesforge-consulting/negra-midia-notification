import { Context, Next } from 'hono';
import { basicAuth } from 'hono/basic-auth';

export async function authMiddleware(c: Context, next: Next) {
  const env = c.env as CloudflareBindings;

  const auth = basicAuth({
    username: await env.NEGRA_MIDIA_API_USER.get(), //'dev_user',
    password: await env.NEGRA_MIDIA_API_PASSWORD.get() //'dev_password'
  });

  return await auth(c, next);
}
