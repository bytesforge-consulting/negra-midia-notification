/**
 * Scheduled Handler - Cron Jobs
 *
 * Handler dedicado para processar eventos de cron jobs do Cloudflare Workers.
 * Responsável por executar tarefas agendadas como digest diário, semanal e mensal.
 */

import { getBrazilTimeAsUTC } from '../helpers';
import { createPrismaClient } from '../services/database';
import { createSchedulerService } from '../services/scheduler';

/**
 * Handler principal para eventos agendados (cron jobs)
 *
 * @param controller - Controlador do evento agendado
 * @param env - Variáveis de ambiente/bindings do Cloudflare
 * @param ctx - Contexto de execução
 */
export async function scheduledHandler(
  controller: any,
  env: CloudflareBindings,
  _ctx: any
): Promise<void> {
  const scheduledTime = controller.scheduledTime;

  console.log(
    `[CRON] Executando job agendado: ${controller.cron} em ${getBrazilTimeAsUTC().toISOString()}`
  );

  try {
    // Criar contexto para acessar serviços
    const prisma = createPrismaClient(env.DB);
    const schedulerService = createSchedulerService(prisma, env);

    // Verificar qual cron schedule disparou esta execução
    switch (controller.cron) {
      case '0 3 * * *':
        // Job diário às 0h Brasil (3h UTC)
        console.log('[CRON] Executando job diário');
        await schedulerService.executeDailyJob(scheduledTime);
        break;

      case '0 3 * * 1':
        // Job semanal às segundas-feiras 0h Brasil (3h UTC)
        console.log('[CRON] Executando job semanal');
        await schedulerService.executeWeeklyJob(scheduledTime);
        break;

      case '0 3 1 * *':
        // Job mensal no dia 1 às 0h Brasil (3h UTC)
        console.log('[CRON] Executando job mensal');
        await schedulerService.executeMonthlyJob(scheduledTime);
        break;

      default:
        console.warn(`[CRON] Agendamento não reconhecido: ${controller.cron}`);
        break;
    }

    console.log(`[CRON] Job ${controller.cron} executado com sucesso`);
  } catch (error) {
    console.error(`[CRON] Erro no job ${controller.cron}:`, error);

    // Re-throw para permitir que o runtime do Cloudflare registre a falha
    throw error;
  }
}
