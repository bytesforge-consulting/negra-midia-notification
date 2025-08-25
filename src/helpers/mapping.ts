/**
 * Helpers de Mapeamento
 *
 * Funções utilitárias para converter dados entre diferentes formatos,
 * especialmente entre objetos do Prisma e objetos da API.
 */

import type {
  AppNotification,
  PrismaNotification,
  CreateNotificationRequest
} from '../types/notification';
import { getBrazilTimeAsUTC } from './date';

/**
 * Converte um objeto notification do Prisma para AppNotification
 *
 * @param notification - Objeto do Prisma
 * @returns Objeto formatado para a API
 */
export const mapPrismaToApi = (notification: PrismaNotification): AppNotification => ({
  id: notification.id,
  name: notification.name,
  email: notification.email,
  phone: notification.phone,
  body: notification.body,
  subject: notification.subject,
  sent_at: notification.sent_at,
  read_at: notification.read_at
});

/**
 * Converte CreateNotificationRequest para dados do Prisma
 *
 * @param request - Dados da requisição da API
 * @returns Objeto formatado para o Prisma
 */
export const mapCreateRequestToPrisma = (request: CreateNotificationRequest) => ({
  name: request.name,
  email: request.email,
  phone: request.phone || null,
  body: request.body,
  subject: request.subject,
  sent_at: getBrazilTimeAsUTC()
});

/**
 * Converte array de notifications do Prisma para AppNotifications
 *
 * @param notifications - Array de objetos do Prisma
 * @returns Array de objetos formatados para a API
 */
export const mapPrismaArrayToApi = (notifications: PrismaNotification[]): AppNotification[] => {
  return notifications.map(mapPrismaToApi);
};
