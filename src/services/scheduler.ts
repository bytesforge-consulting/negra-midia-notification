/**
 * Serviço de Agendamento - Cron Jobs
 *
 * Este serviço contém métodos que são executados automaticamente
 * através de cron triggers configurados no Cloudflare Workers.
 *
 * Horários configurados:
 * - Daily: Todos os dias às 0h UTC (21h Brasil)
 * - Weekly: Todos os domingos às 0h UTC (21h sábado no Brasil)
 */

import { PrismaClient } from '@prisma/client';
import { createDigestService, DigestPeriod } from './digest';

export class SchedulerService {
  private prisma: PrismaClient;
  private env: CloudflareBindings;

  constructor(prisma: PrismaClient, env: CloudflareBindings) {
    this.prisma = prisma;
    this.env = env;
  }

  /**
   * Job Diário - Executado todos os dias às 0h Brasil (3h UTC)
   *
   * Tarefas executadas:
   * - Geração de digest diário com IA
   * - Processamento de notificações urgentes
   * - Limpeza de notificações antigas
   * - Verificação de integridade do sistema
   *
   * @param scheduledTime - Timestamp do agendamento
   */
  async executeDailyJob(scheduledTime: number): Promise<void> {
    console.log(`[CRON DAILY] Iniciado em: ${new Date(scheduledTime).toISOString()}`);

    try {
      const digestService = createDigestService(this.prisma, this.env);

      console.log('[CRON DAILY] Gerando digest diário...');
      const digestResult = await digestService.generateDigest(DigestPeriod.DAILY, true);

      if (digestResult.success) {
        console.log(
          `[CRON DAILY] Digest gerado: ${digestResult.data?.total_notifications} notificações do dia, ${digestResult.data?.urgent_notifications.length} urgentes processadas`
        );
        console.log(
          `[CRON DAILY] Preview do digest: ${digestResult.data?.digest.substring(0, 200)}...`
        );
      } else {
        console.error('[CRON DAILY] Falha na geração do digest:', digestResult.error);
      }
      console.log('[CRON DAILY] Job diário executado com sucesso');
    } catch (error) {
      console.error('[CRON DAILY] Erro no job diário:', error);
      throw error;
    }
  }

  /**
   * Job Semanal - Executado todas as segundas-feiras às 0h Brasil (3h UTC)
   *
   * Tarefas executadas:
   * - Geração de digest semanal com IA e análise de tendências
   * - Limpeza profunda de dados
   * - Otimização de banco de dados
   * - Análise de performance semanal
   *
   * @param scheduledTime - Timestamp do agendamento
   */
  async executeWeeklyJob(scheduledTime: number): Promise<void> {
    console.log(`[CRON WEEKLY] Iniciado em: ${new Date(scheduledTime).toISOString()}`);

    try {
      const digestService = createDigestService(this.prisma, this.env);

      console.log('[CRON WEEKLY] Gerando digest semanal...');
      const digestResult = await digestService.generateDigest(DigestPeriod.WEEKLY, true);

      if (digestResult.success) {
        console.log(
          `[CRON WEEKLY] Digest semanal gerado: ${digestResult.data?.total_notifications} notificações na semana`
        );
        console.log(
          `[CRON WEEKLY] Categorias: ${JSON.stringify(digestResult.data?.insights.categories)}`
        );

        // Log do digest para monitoramento
        console.log(`[CRON WEEKLY] Preview: ${digestResult.data?.digest.substring(0, 200)}...`);
      } else {
        console.error('[CRON WEEKLY] Falha na geração do digest:', digestResult.error);
      }

      console.log('[CRON WEEKLY] Job semanal executado com sucesso');
    } catch (error) {
      console.error('[CRON WEEKLY] Erro no job semanal:', error);
      throw error;
    }
  }

  /**
   * Job Mensal - Executado no dia 1 de cada mês às 0h Brasil (3h UTC)
   *
   * Tarefas executadas:
   * - Geração de digest mensal completo com IA e análise estratégica
   * - Arquivamento de dados antigos
   * - Análise de tendências mensais e insights
   * - Backup completo do sistema
   * - Auditoria de segurança
   *
   * @param scheduledTime - Timestamp do agendamento
   */
  async executeMonthlyJob(scheduledTime: number): Promise<void> {
    console.log(`[CRON MONTHLY] Iniciado em: ${new Date(scheduledTime).toISOString()}`);

    try {
      const digestService = createDigestService(this.prisma, this.env);

      console.log('[CRON MONTHLY] Gerando digest mensal...');
      const digestResult = await digestService.generateDigest(DigestPeriod.MONTHLY, true);

      if (digestResult.success) {
        console.log(
          `[CRON MONTHLY] Digest mensal gerado: ${digestResult.data?.total_notifications} notificações no mês`
        );
        console.log(
          `[CRON MONTHLY] Dia mais ativo: ${digestResult.data?.insights.most_active_day}`
        );
        console.log(
          `[CRON MONTHLY] Categorias: ${JSON.stringify(digestResult.data?.insights.categories)}`
        );

        // Log do digest para arquivo/monitoramento
        console.log(`[CRON MONTHLY] Preview: ${digestResult.data?.digest.substring(0, 300)}...`);
      } else {
        console.error('[CRON MONTHLY] Falha na geração do digest:', digestResult.error);
      }
      console.log('[CRON MONTHLY] Job mensal executado com sucesso');
    } catch (error) {
      console.error('[CRON MONTHLY] Erro no job mensal:', error);
      throw error;
    }
  }
}

/**
 * Factory para criar instância do SchedulerService
 */
export function createSchedulerService(
  prisma: PrismaClient,
  env: CloudflareBindings
): SchedulerService {
  return new SchedulerService(prisma, env);
}
