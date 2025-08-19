import type { PrismaClient } from '@prisma/client';
import type { ApiResponse } from './common';
import type { PaginatedResponse } from './pagination';

type PrismaClientType = PrismaClient;
type NotificationModelDelegate = PrismaClientType['notification'];
type NotificationFromPrisma = Awaited<ReturnType<NotificationModelDelegate['findFirst']>>;
type NotificationPrismaType = NonNullable<NotificationFromPrisma>;

export interface AppNotification {
  id?: number;
  name: string;
  email: string;
  phone: string;
  body: string;
  subject: string;
  sent_at: Date;
  read_at: Date | null;
}

export type PrismaNotification = NotificationPrismaType;

export interface CreateNotificationRequest {
  name: string;
  email: string;
  phone: string;
  body: string;
  subject: string;
}

export interface NotificationSearchResponse
  extends ApiResponse<{
    notifications: AppNotification[];
    pagination: PaginatedResponse;
    search_term?: string;
  }> {}
