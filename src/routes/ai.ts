import { Hono } from 'hono';
import {
  AIGenerateRequest,
  AIGenerateResponse,
  ProcessUnreadRequest,
  ProcessUnreadResponse,
  DailyDigestResponse,
  ApiResponse,
  ChatMessage,
  mapPrismaArrayToApi,
  getBrazilReadTime,
  getBrazilTimeAsUTC
} from '../types';
import { getPrismaFromContext } from '../services/database';
import { DigestPeriod } from '../services/digest';

const ai = new Hono<{ Bindings: CloudflareBindings }>();

// POST /ai/generate - Geração livre de texto usando IA
ai.post('/generate', async c => {
  try {
    const request = await c.req.json<AIGenerateRequest>();

    // Validação
    if (!request.messages || request.messages.length === 0) {
      const response: AIGenerateResponse = {
        success: false,
        error: 'É necessário fornecer pelo menos uma mensagem'
      };
      return c.json(response, 400);
    }

    // Configuração padrão
    const aiRequest = {
      model: request.model || '@cf/meta/llama-3.1-8b-instruct',
      messages: request.messages,
      max_tokens: request.max_tokens || 1000,
      temperature: request.temperature || 0.7
    };

    // Chamar IA via gateway
    const aiResponse = (await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages: aiRequest.messages,
        max_tokens: aiRequest.max_tokens,
        temperature: aiRequest.temperature
      },
      {
        gateway: {
          id: c.env.AI_GATEWAY_NAME
        }
      }
    )) as any;

    const response: AIGenerateResponse = {
      success: true,
      data: {
        response: aiResponse.response || 'Resposta não disponível',
        usage: aiResponse.usage || undefined
      }
    };

    return c.json(response);
  } catch (error) {
    const response: AIGenerateResponse = {
      success: false,
      error: `Erro ao gerar resposta: ${
        error instanceof Error ? error.message : 'Erro desconhecido'
      }`
    };
    return c.json(response, 500);
  }
});

// GET /ai/models - Listar modelos disponíveis
ai.get('/models', async c => {
  try {
    const availableModels = [
      {
        id: '@cf/meta/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        description: 'Modelo de conversação geral',
        type: 'chat'
      },
      {
        id: '@cf/microsoft/phi-2',
        name: 'Phi-2',
        description: 'Modelo compacto e eficiente',
        type: 'chat'
      },
      {
        id: '@cf/mistral/mistral-7b-instruct-v0.1',
        name: 'Mistral 7B Instruct',
        description: 'Modelo multilíngue',
        type: 'chat'
      }
    ];

    const response: ApiResponse<typeof availableModels> = {
      success: true,
      data: availableModels
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao listar modelos: ${
        error instanceof Error ? error.message : 'Erro desconhecido'
      }`
    };
    return c.json(response, 500);
  }
});

// Função `mapRowToNotification` removida - agora usamos `mapPrismaToApi` do types.ts

// POST /ai/process-unread - Processar notificações não lidas com IA
ai.post('/process-unread', async c => {
  try {
    const request = await c.req.json<ProcessUnreadRequest>();
    const markAsRead = request.mark_as_read !== false; // default true
    const maxNotifications = request.max_notifications || 50;

    // Buscar notificações não lidas (usando Prisma)
    const prisma = getPrismaFromContext(c);
    const unreadNotifications = await prisma.notification.findMany({
      where: {
        read_at: null
      },
      orderBy: {
        sent_at: 'desc'
      },
      take: maxNotifications
    });

    if (unreadNotifications.length === 0) {
      const response: ProcessUnreadResponse = {
        success: true,
        data: {
          summary: 'Nenhuma notificação não lida encontrada.',
          notifications_processed: [],
          total_unread: 0,
          marked_as_read: 0,
          insights: {
            most_common_senders: [],
            urgent_count: 0,
            categories: {}
          }
        }
      };
      return c.json(response);
    }

    // Converter para formato da API
    const unreadApiNotifications = mapPrismaArrayToApi(unreadNotifications);

    // Gerar insights
    const senderCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    let urgentCount = 0;

    unreadApiNotifications.forEach(notification => {
      // Contar remetentes
      senderCount[notification.name] = (senderCount[notification.name] || 0) + 1;

      // Detectar urgência (palavras-chave no assunto)
      const urgentKeywords = ['urgente', 'importante', 'emergência', 'crítico', 'ação'];
      if (
        urgentKeywords.some(
          keyword =>
            notification.subject.toLowerCase().includes(keyword) ||
            notification.body.toLowerCase().includes(keyword)
        )
      ) {
        urgentCount++;
      }

      // Categorizar por tipo (simples heurística)
      if (
        notification.subject.toLowerCase().includes('pedido') ||
        notification.body.toLowerCase().includes('compra')
      ) {
        categoryCount['Vendas'] = (categoryCount['Vendas'] || 0) + 1;
      } else if (
        notification.subject.toLowerCase().includes('suporte') ||
        notification.body.toLowerCase().includes('problema')
      ) {
        categoryCount['Suporte'] = (categoryCount['Suporte'] || 0) + 1;
      } else {
        categoryCount['Geral'] = (categoryCount['Geral'] || 0) + 1;
      }
    });

    // Preparar dados para IA
    const notificationsSummary = unreadNotifications.map((n: any) => ({
      remetente: n.name,
      assunto: n.subject,
      corpo: n.body.substring(0, 200) + '...',
      data: n.sent_at.toISOString().split('T')[0]
    }));

    const systemPrompt = `Você é um assistente de análise de notificações para a plataforma Negra Mídia.

Analise as notificações não lidas e forneça um resumo executivo incluindo:

1. **Resumo Geral**: Panorama das ${unreadNotifications.length} notificações não lidas
2. **Prioridades**: Destaque notificações que requerem ação imediata
3. **Tendências**: Padrões identificados nos tipos de mensagem
4. **Recomendações**: Ações sugeridas para o usuário
5. **Próximos Passos**: O que deve ser feito primeiro

Seja conciso, focado em insights úteis e mantenha tom profissional mas amigável.`;

    const userPrompt = `Notificações não lidas (${unreadNotifications.length} total):

${JSON.stringify(notificationsSummary, null, 2)}

Estatísticas:
- Total: ${unreadNotifications.length}
- Urgentes: ${urgentCount}
- Principais remetentes: ${Object.entries(senderCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ')}
- Categorias: ${Object.entries(categoryCount)
      .map(([cat, count]) => `${cat}: ${count}`)
      .join(', ')}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Chamar IA
    const aiResponse = (await c.env.AI.run(
      '@cf/meta/llama-3.1-8b-instruct',
      {
        messages,
        max_tokens: 800,
        temperature: 0.7
      },
      {
        gateway: {
          id: c.env.AI_GATEWAY_NAME
        }
      }
    )) as any;

    // Marcar como lidas se solicitado (usando Prisma)
    let markedAsRead = 0;
    if (markAsRead) {
      const ids = unreadNotifications.map((n: any) => n.id).filter(Boolean);
      if (ids.length > 0) {
        const updateResult = await prisma.notification.updateMany({
          where: {
            id: { in: ids }
          },
          data: {
            read_at: getBrazilReadTime() // 🇧🇷 Hora local do Brasil
          }
        });

        markedAsRead = updateResult.count || 0;
      }

      // Atualizar read_at nas notificações retornadas (hora do Brasil 🇧🇷)
      unreadApiNotifications.forEach(notification => {
        notification.read_at = getBrazilTimeAsUTC();
      });
    }

    const response: ProcessUnreadResponse = {
      success: true,
      data: {
        summary: aiResponse.response || 'Não foi possível gerar resumo',
        notifications_processed: unreadApiNotifications,
        total_unread: unreadApiNotifications.length,
        marked_as_read: markedAsRead,
        insights: {
          most_common_senders: Object.entries(senderCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name]) => name),
          urgent_count: urgentCount,
          categories: categoryCount
        }
      }
    };

    return c.json(response);
  } catch (error) {
    const response: ProcessUnreadResponse = {
      success: false,
      error: `Erro ao processar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
    return c.json(response, 500);
  }
});

// POST /ai/analyze-unread - Analisar notificações não lidas SEM marcar como lidas
ai.post('/analyze-unread', async c => {
  try {
    const request = await c.req.json<ProcessUnreadRequest>();
    // Forçar mark_as_read = false para apenas análise
    request.mark_as_read = false;

    // Reutilizar a lógica do process-unread
    return ai.fetch(
      new Request(c.req.url.replace('/analyze-unread', '/process-unread'), {
        method: 'POST',
        headers: c.req.raw.headers,
        body: JSON.stringify(request)
      }),
      c.env
    );
  } catch (error) {
    const response: ProcessUnreadResponse = {
      success: false,
      error: `Erro ao analisar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
    return c.json(response, 500);
  }
});

// GET /ai/daily-digest - Resumo diário das notificações (usando Prisma)
ai.get('/daily-digest', async c => {
  try {
    const prisma = getPrismaFromContext(c);
    const { createDigestService } = await import('../services/digest');
    const digestService = createDigestService(prisma, c.env);

    // Usar o DigestService para manter consistência com os cron jobs
    const digestResult = await digestService.generateDigest(DigestPeriod.DAILY, true);
    const response: DailyDigestResponse = {
      success: true,
      data: {
        digest: digestResult.data!.digest,
        date: digestResult.data!.start_date,
        total_notifications: digestResult.data!.total_notifications,
        unread_count: digestResult.data!.unread_count,
        top_senders: digestResult.data!.top_senders,
        urgent_notifications: digestResult.data!.urgent_notifications,
        processed_notifications: digestResult.data!.processed_notifications
      }
    };
    return c.json(response);
  } catch (error) {
    const response: DailyDigestResponse = {
      success: false,
      error: `Erro ao gerar digest diário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
    return c.json(response, 500);
  }
});

export default ai;
