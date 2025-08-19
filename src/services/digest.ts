/* eslint-disable no-unused-vars */
/**
 * Serviço de Digest - Geração de resumos inteligentes com IA
 *
 * Encapsula a lógica de geração de resumos (daily-digest) para ser
 * reutilizada tanto pelos endpoints HTTP quanto pelos cron jobs.
 *
 * Suporta diferentes períodos: diário, semanal, mensal
 */

import { PrismaClient } from '@prisma/client';
import type { ChatMessage } from '../types';
import { mapPrismaArrayToApi, getBrazilReadTime, getBrazilTimeAsUTC } from '../helpers';
import { DigestPeriod, DigestResult } from '../types/digest';

export class DigestService {
  private prisma: PrismaClient;
  private env: CloudflareBindings;

  constructor(prisma: PrismaClient, env: CloudflareBindings) {
    this.prisma = prisma;
    this.env = env;
  }

  /**
   * Gera digest para o período especificado
   */
  async generateDigest(
    period: DigestPeriod,
    markUrgentAsRead: boolean = true
  ): Promise<DigestResult> {
    try {
      // Calcular datas do período
      const { startDate, endDate } = this.getDateRange(period);

      // Buscar notificações do período
      const periodNotifications = await this.prisma.notification.findMany({
        where: {
          sent_at: {
            gte: startDate,
            lt: endDate
          }
        },
        orderBy: {
          sent_at: 'desc'
        }
      });

      // Buscar não lidas (limitado para não sobrecarregar)
      const unreadNotifications = await this.prisma.notification.findMany({
        where: {
          read_at: null
        },
        orderBy: {
          sent_at: 'desc'
        },
        take: period === 'monthly' ? 50 : period === 'weekly' ? 30 : 20
      });

      const periodNotificationsApi = mapPrismaArrayToApi(periodNotifications);
      const unreadNotificationsApi = mapPrismaArrayToApi(unreadNotifications);

      // Identificar urgentes
      const urgentNotifications = unreadNotificationsApi.filter(n => {
        const urgentKeywords = ['urgente', 'importante', 'emergência', 'crítico', 'prioridade'];
        return urgentKeywords.some(
          keyword =>
            n.subject.toLowerCase().includes(keyword) || n.body.toLowerCase().includes(keyword)
        );
      });

      // Análise de remetentes
      const senderCount: Record<string, number> = {};
      unreadNotificationsApi.forEach(n => {
        senderCount[n.email] = (senderCount[n.email] || 0) + 1;
      });
      const topSenders = Object.entries(senderCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, period === 'monthly' ? 10 : period === 'weekly' ? 7 : 5)
        .map(([name]) => name);

      // Análise adicional para períodos maiores
      const insights = this.generateInsights(periodNotificationsApi, period);

      // Gerar prompt baseado no período
      const { systemPrompt, userPrompt } = this.generatePrompts(
        period,
        startDate,
        endDate,
        periodNotificationsApi,
        unreadNotificationsApi,
        urgentNotifications,
        topSenders,
        insights
      );

      // Chamar IA
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const aiResponse = (await this.env.AI.run(
        '@cf/meta/llama-3.1-8b-instruct',
        {
          messages,
          max_tokens: period === 'monthly' ? 1000 : period === 'weekly' ? 800 : 600,
          temperature: 0.6
        },
        {
          gateway: {
            id: this.env.AI_GATEWAY_NAME
          }
        }
      )) as any;

      // Marcar urgentes como lidas se solicitado
      let processedNotifications: any[] = [];
      if (markUrgentAsRead && urgentNotifications.length > 0) {
        const urgentIds = unreadNotifications
          .filter((row: any) =>
            urgentNotifications.some(
              urgent => urgent.name === row.name && urgent.subject === row.subject
            )
          )
          .map((row: any) => row.id)
          .filter(Boolean);

        if (urgentIds.length > 0) {
          await this.prisma.notification.updateMany({
            where: {
              id: { in: urgentIds }
            },
            data: {
              read_at: getBrazilReadTime()
            }
          });

          urgentNotifications.forEach(notification => {
            notification.read_at = getBrazilTimeAsUTC();
          });

          processedNotifications = urgentNotifications;
        }
      }

      return {
        success: true,
        data: {
          digest: aiResponse.response || 'Não foi possível gerar digest',
          period,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          total_notifications: periodNotificationsApi.length,
          unread_count: unreadNotificationsApi.length,
          top_senders: topSenders,
          urgent_notifications: urgentNotifications,
          processed_notifications: processedNotifications,
          insights
        }
      };
    } catch (error) {
      console.error(`[DIGEST ${period.toUpperCase()}] Erro:`, error);
      return {
        success: false,
        error: `Erro ao gerar digest ${period}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Calcula intervalo de datas baseado no período
   */
  private getDateRange(period: DigestPeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Final do dia atual

    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;

      case 'weekly':
        // Última semana (7 dias)
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;

      case 'monthly':
        // Último mês
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;

      default:
        // Fallback para diário se período não reconhecido
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Gera insights adicionais baseados no período
   */
  private generateInsights(notifications: any[], period: DigestPeriod): any {
    const insights: any = {};

    if (period === 'weekly' || period === 'monthly') {
      // Análise por categoria/assunto
      const categories: Record<string, number> = {};
      notifications.forEach(n => {
        const subject = n.subject.toLowerCase();

        if (subject.includes('venda') || subject.includes('pedido')) {
          categories['Vendas'] = (categories['Vendas'] || 0) + 1;
        } else if (subject.includes('suporte') || subject.includes('problema')) {
          categories['Suporte'] = (categories['Suporte'] || 0) + 1;
        } else if (subject.includes('marketing') || subject.includes('campanha')) {
          categories['Marketing'] = (categories['Marketing'] || 0) + 1;
        } else {
          categories['Geral'] = (categories['Geral'] || 0) + 1;
        }
      });

      insights.categories = categories;
    }

    if (period === 'monthly') {
      // Dia mais ativo do mês
      const dayCount: Record<string, number> = {};
      notifications.forEach(n => {
        const day = new Date(n.sent_at).toISOString().split('T')[0];
        dayCount[day] = (dayCount[day] || 0) + 1;
      });

      const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];

      if (mostActiveDay) {
        insights.most_active_day = mostActiveDay[0];
      }
    }

    return insights;
  }

  /**
   * Gera prompts específicos para cada período
   */
  private generatePrompts(
    period: DigestPeriod,
    startDate: Date,
    endDate: Date,
    periodNotifications: any[],
    unreadNotifications: any[],
    urgentNotifications: any[],
    topSenders: string[],
    insights: any
  ): { systemPrompt: string; userPrompt: string } {
    const periodNames = {
      daily: 'diário',
      weekly: 'semanal',
      monthly: 'mensal'
    };

    const systemPrompt = `Você é um assistente executivo que cria resumos ${periodNames[period]} para a plataforma Negra Mídia.

Crie um digest ${periodNames[period]} profissional e estratégico incluindo:

1. **Visão Geral do Período**: Resumo das principais atividades
2. **Pendências Críticas**: Notificações urgentes que precisam de atenção imediata
3. **Métricas do Período**: Números e estatísticas relevantes
4. **Insights e Tendências**: Padrões observados${period !== 'daily' ? ' ao longo do período' : ''}
5. **Ações Recomendadas**: Próximos passos prioritários

${period === 'monthly' ? 'Inclua análise de tendências mensais e recomendações estratégicas.' : ''}
${period === 'weekly' ? 'Foque em padrões semanais e planejamento para a próxima semana.' : ''}

Mantenha tom executivo mas acessível. Use emojis moderadamente para organização visual.`;

    const userPrompt = `Digest ${periodNames[period]} para ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}:

📊 MÉTRICAS DO PERÍODO:
- Notificações no período: ${periodNotifications.length}
- Não lidas total: ${unreadNotifications.length}
- Urgentes detectadas: ${urgentNotifications.length}

👥 PRINCIPAIS REMETENTES:
${topSenders.slice(0, period === 'monthly' ? 5 : 3).join(', ')}

🚨 NOTIFICAÇÕES URGENTES:
${
  urgentNotifications
    .slice(0, period === 'monthly' ? 5 : 3)
    .map(n => `- ${n.name}: ${n.subject}`)
    .join('\n') || 'Nenhuma urgência detectada'
}

📋 ÚLTIMAS NÃO LIDAS:
${unreadNotifications
  .slice(0, period === 'monthly' ? 8 : 5)
  .map(n => `- ${n.name}: ${n.subject}`)
  .join('\n')}

${
  insights.categories
    ? `\n📈 CATEGORIAS:\n${Object.entries(insights.categories)
        .map(([cat, count]) => `- ${cat}: ${count}`)
        .join('\n')}`
    : ''
}

${insights.most_active_day ? `\n📅 DIA MAIS ATIVO: ${insights.most_active_day}` : ''}`;

    return { systemPrompt, userPrompt };
  }
}
