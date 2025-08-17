import type { Context, Next } from 'hono';
import { formatBrazilTime } from '../types';

interface LogRequest {
  method: string;
  url: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
  timestamp: string;
}

interface LogResponse {
  status: number;
  duration: number;
  contentLength?: string;
}

interface LogEntry {
  request: LogRequest;
  response?: LogResponse;
  error?: string;
}

/**
 * Middleware de logging para desenvolvimento
 * Registra todas as requisições HTTP com detalhes úteis para debug
 */
export const loggerMiddleware = async (c: Context, next: Next) => {
  const env = c.env?.ENVIRONMENT || 'development';

  // Só ativa logs detalhados em desenvolvimento
  if (env !== 'development') {
    return next();
  }

  const startTime = Date.now();
  const timestamp = formatBrazilTime(new Date());

  // Captura dados da requisição
  const request: LogRequest = {
    method: c.req.method,
    url: c.req.url,
    userAgent: c.req.header('User-Agent'),
    referer: c.req.header('Referer'),
    ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
    timestamp
  };

  // Log da requisição entrada
  console.log('\n===== NOVA REQUISICAO =====');
  console.log(`TIMESTAMP: ${timestamp}`);
  console.log(`REQUEST: ${request.method} ${request.url}`);
  console.log(`IP: ${request.ip}`);
  if (request.userAgent) {
    console.log(`USER-AGENT: ${request.userAgent.substring(0, 100)}...`);
  }
  if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
    const contentType = c.req.header('Content-Type') || '';
    console.log(`CONTENT-TYPE: ${contentType}`);
    console.log(`BODY: [Sera logado apos processamento para nao interferir]`);
  }

  const logEntry: LogEntry = { request };

  try {
    // Executa a próxima middleware/handler
    await next();

    // Captura dados da resposta
    const endTime = Date.now();
    const duration = endTime - startTime;

    const response: LogResponse = {
      status: c.res.status,
      duration,
      contentLength: c.res.headers.get('Content-Length') || undefined
    };

    logEntry.response = response;

    // Log da resposta
    const statusText = getStatusText(response.status);
    console.log(`\n${statusText} ===== RESPOSTA =====`);
    console.log(`STATUS: ${response.status}`);
    console.log(`DURACAO: ${duration}ms`);
    if (response.contentLength) {
      console.log(`TAMANHO: ${response.contentLength} bytes`);
    }

    // Informações básicas da resposta
    const contentType = c.res.headers.get('Content-Type');
    if (contentType) {
      console.log(`CONTENT-TYPE: ${contentType}`);
    }
    console.log(
      `HEADERS: ${Array.from(c.res.headers.entries())
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')}`
    );

    // Nota: Body da resposta não é logado para evitar problemas de stream

    console.log('===== FIM REQUISICAO =====\n');
  } catch (error) {
    // Log de erro
    const endTime = Date.now();
    const duration = endTime - startTime;

    logEntry.error = error instanceof Error ? error.message : String(error);
    logEntry.response = {
      status: 500,
      duration
    };

    console.log('\nERROR ===== ERRO NA REQUISICAO =====');
    console.log(`ERRO: ${logEntry.error}`);
    console.log(`DURACAO_ATE_ERRO: ${duration}ms`);
    console.log(`STACK:`, error);
    console.log('ERROR ===== FIM ERRO =====\n');

    // Re-throw o erro para que seja tratado pelos handlers de erro
    throw error;
  }
};

/**
 * Retorna texto indicativo baseado no status HTTP
 */
function getStatusText(status: number): string {
  if (status >= 200 && status < 300) {
    return 'SUCCESS';
  } // Sucesso
  if (status >= 300 && status < 400) {
    return 'REDIRECT';
  } // Redirecionamento
  if (status >= 400 && status < 500) {
    return 'CLIENT_ERROR';
  } // Erro do cliente
  if (status >= 500) {
    return 'SERVER_ERROR';
  } // Erro do servidor
  return 'UNKNOWN'; // Desconhecido
}

/**
 * Middleware simplificado para produção (logs mínimos)
 */
export const productionLoggerMiddleware = async (c: Context, next: Next) => {
  const startTime = Date.now();

  try {
    await next();
    const duration = Date.now() - startTime;

    // Log simplificado para produção
    console.log(`${c.req.method} ${c.req.url} - ${c.res.status} - ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`ERROR ${c.req.method} ${c.req.url} - ${duration}ms:`, error);
    throw error;
  }
};

/**
 * Middleware adaptativo que escolhe o tipo de log baseado no ambiente
 */
export const adaptiveLoggerMiddleware = (c: Context, next: Next) => {
  const env = c.env?.ENVIRONMENT || 'development';

  if (env === 'development') {
    return loggerMiddleware(c, next);
  } else {
    return productionLoggerMiddleware(c, next);
  }
};
