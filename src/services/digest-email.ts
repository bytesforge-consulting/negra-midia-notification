/**
 * Digest Email Service - Versão Limpa sem HTML Hardcoded
 *
 * Serviço responsável por criar e enviar e-mails de digest
 * usando apenas templates externos
 */

import { sendSimpleEmail } from './email';
import { formatBrazilTime, capitalizeFirst } from '../helpers';
import { createTemplateEngine, TemplateVariables } from './template-engine';

export interface DigestEmailData {
  period: string;
  start_date: string;
  end_date: string;
  total_notifications: number;
  unread_count: number;
  urgent_notifications: Array<{ id: number; subject: string }>;
  top_senders: string[];
  digest: string;
  insights?: any;
}

export class DigestEmailService {
  private env: CloudflareBindings;
  private templateEngine: ReturnType<typeof createTemplateEngine>;

  constructor(env: CloudflareBindings) {
    this.env = env;
    this.templateEngine = createTemplateEngine(env);
  }

  /**
   * Criar e enviar digest por e-mail
   */
  async createAndSendDigest(digestData: DigestEmailData): Promise<{
    success: boolean;
    emailId?: string;
    error?: string;
  }> {
    try {
      const subject = this.createSubject(digestData);
      const htmlContent = await this.createEmailHTML(digestData);

      const from = this.env.DIGEST_EMAIL_FROM;
      const to = this.env.DIGEST_EMAIL_TO;

      console.log(`[DIGEST EMAIL] Enviando ${digestData.period} para ${to}...`);

      const emailResult = await sendSimpleEmail(from, to, subject, htmlContent, this.env);

      if (emailResult.success && emailResult.data?.id) {
        console.log(`[DIGEST EMAIL] ✅ Enviado com sucesso! ID: ${emailResult.data.id}`);
        return {
          success: true,
          emailId: emailResult.data.id
        };
      } else {
        console.error('[DIGEST EMAIL] ❌ Falha no envio:', emailResult.error);
        return {
          success: false,
          error: emailResult.error || 'Erro desconhecido no envio'
        };
      }
    } catch (error) {
      console.error('[DIGEST EMAIL] ❌ Erro geral:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Criar HTML do e-mail usando apenas templates
   */
  async createEmailHTML(digestData: DigestEmailData): Promise<string> {
    try {
      // Variáveis principais
      const periodLabel = capitalizeFirst(digestData.period);
      const currentTime = formatBrazilTime(new Date());

      const variables: TemplateVariables = {
        subject: `Digest ${periodLabel}`,
        periodLabel,
        startDate: digestData.start_date,
        endDate: digestData.end_date,
        totalNotifications: digestData.total_notifications,
        unreadCount: digestData.unread_count,
        urgentCount: digestData.urgent_notifications.length,
        digest: digestData.digest,
        currentTime
      };

      // Seções condicionais
      const conditionalSections: { [key: string]: string } = {};

      // Badge de urgência
      conditionalSections.urgentBadge = await this.createUrgentBadge(
        digestData.urgent_notifications.length
      );

      // Seção de insights
      if (digestData.insights && Object.keys(digestData.insights).length > 0) {
        conditionalSections.insightsSection = await this.createInsightsSection(digestData.insights);
      } else {
        conditionalSections.insightsSection = '';
      }

      // Seção de remetentes
      if (digestData.top_senders && digestData.top_senders.length > 0) {
        conditionalSections.sendersSection = await this.createSendersSection(
          digestData.top_senders
        );
      } else {
        conditionalSections.sendersSection = '';
      }

      // Renderizar template principal
      const baseTemplate = await this.templateEngine.loadTemplate('templates/digest/base.html');
      return this.templateEngine.renderWithSections(baseTemplate, variables, conditionalSections);
    } catch (error) {
      console.error('Erro ao criar HTML do e-mail:', error);
      return await this.createFallbackHTML(digestData);
    }
  }

  /**
   * Criar badge de urgência usando template
   */
  private async createUrgentBadge(urgentCount: number): Promise<string> {
    if (urgentCount === 0) {
      return '';
    }

    try {
      return await this.templateEngine.renderTemplateFile('templates/digest/urgent-badge.html', {
        urgentCount
      });
    } catch (error) {
      console.warn('Erro ao carregar template urgent-badge:', error);
      return '';
    }
  }

  /**
   * Criar seção de insights usando template
   */
  private async createInsightsSection(insights: any): Promise<string> {
    if (!insights || Object.keys(insights).length === 0) {
      return '';
    }

    try {
      const insightsContent = this.formatInsights(insights);
      return await this.templateEngine.renderTemplateFile(
        'templates/digest/insights-section.html',
        {
          insightsContent
        }
      );
    } catch (error) {
      console.warn('Erro ao carregar template de insights:', error);
      return '';
    }
  }

  /**
   * Criar seção de remetentes usando template
   */
  private async createSendersSection(topSenders: string[]): Promise<string> {
    if (!topSenders || topSenders.length === 0) {
      return '';
    }

    try {
      // Criar itens de remetentes
      const senderItems = await Promise.all(
        topSenders.slice(0, 5).map(async sender => {
          return await this.templateEngine.renderTemplateFile('templates/digest/sender-item.html', {
            senderEmail: sender
          });
        })
      );

      const sendersContent = senderItems.join('');

      return await this.templateEngine.renderTemplateFile('templates/digest/senders-section.html', {
        sendersContent
      });
    } catch (error) {
      console.warn('Erro ao carregar template de remetentes:', error);
      return '';
    }
  }

  /**
   * Criar fallback HTML usando template
   */
  private async createFallbackHTML(digestData: DigestEmailData): Promise<string> {
    try {
      const periodLabel = capitalizeFirst(digestData.period);
      const currentTime = formatBrazilTime(new Date());

      return await this.templateEngine.renderTemplateFile('templates/digest/fallback.html', {
        periodLabel,
        startDate: digestData.start_date,
        endDate: digestData.end_date,
        totalNotifications: digestData.total_notifications,
        unreadCount: digestData.unread_count,
        urgentCount: digestData.urgent_notifications.length,
        digest: digestData.digest,
        currentTime
      });
    } catch (error) {
      console.error('Erro até no template fallback:', error);
      // Último recurso - HTML mínimo inline
      const periodLabel = capitalizeFirst(digestData.period);
      const currentTime = formatBrazilTime(new Date());

      return `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Digest ${periodLabel}</h1>
            <p>Período: ${digestData.start_date} - ${digestData.end_date}</p>
            <p>Total de notificações: ${digestData.total_notifications}</p>
            <p>Resumo: ${digestData.digest}</p>
            <p><small>Gerado em ${currentTime} por Bytes Forge Consultoria</small></p>
          </body>
        </html>
      `;
    }
  }

  /**
   * Criar assunto do e-mail
   */
  private createSubject(digestData: DigestEmailData): string {
    const periodMap = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal'
    };

    const periodLabel =
      periodMap[digestData.period as keyof typeof periodMap] || capitalizeFirst(digestData.period);

    return `Digest ${periodLabel} de ${digestData.start_date} à ${digestData.end_date}`;
  }

  /**
   * Formatar insights para exibição
   */
  private formatInsights(insights: any): string {
    const lines: string[] = [];

    if (insights.most_active_day) {
      lines.push(`📅 Dia mais ativo: ${insights.most_active_day}`);
    }

    if (insights.categories && Object.keys(insights.categories).length > 0) {
      lines.push('📂 Categorias principais:');
      Object.entries(insights.categories)
        .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
        .slice(0, 3)
        .forEach(([category, count]) => {
          lines.push(`  • ${category}: ${count}`);
        });
    }

    if (insights.trends) {
      lines.push(`📊 Tendência: ${insights.trends}`);
    }

    return lines.join('\n');
  }
}

/**
 * Factory para criar instância do DigestEmailService
 */
export function createDigestEmailService(env: CloudflareBindings): DigestEmailService {
  return new DigestEmailService(env);
}
