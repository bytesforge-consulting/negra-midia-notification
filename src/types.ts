// Importações do Prisma para type-safety
import type { PrismaClient } from '@prisma/client';
// Importações para timezone robusto do Brasil
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

// Inferir tipo de notification a partir do PrismaClient
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

// Tipo derivado do Prisma - garante consistência com o schema
export type PrismaNotification = NotificationPrismaType;

export interface CreateNotificationRequest {
	name: string;
	email: string;
	phone: string;
	body: string;
	subject: string;
}

export interface NotificationRow {
	id?: number;
	name: string;
	email: string;
	phone: string;
	body: string;
	subject: string;
	sent_at: string;
	read_at: string | null;
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

// AI Types
export interface ChatMessage {
	role: "system" | "user" | "assistant";
	content: string;
}

export interface AIGenerateRequest {
	model?: string;
	messages: ChatMessage[];
	max_tokens?: number;
	temperature?: number;
}

export interface AIGenerateResponse {
	success: boolean;
	data?: {
		response: string;
		usage?: {
			prompt_tokens: number;
			completion_tokens: number;
			total_tokens: number;
		};
	};
	error?: string;
}

export interface NotificationGenerateRequest {
	context: string;
	type: "email" | "sms" | "push";
	tone?: "formal" | "casual" | "urgent" | "friendly";
	language?: "pt-BR" | "en-US";
}

export interface NotificationSummarizeRequest {
	notifications: AppNotification[];
	timeframe?: "today" | "week" | "month";
}

// Novos tipos para integração IA + D1
export interface ProcessUnreadRequest {
	action?: "analyze" | "process" | "digest";
	mark_as_read?: boolean;
	include_summary?: boolean;
	max_notifications?: number;
}

export interface ProcessUnreadResponse {
	success: boolean;
	data?: {
		summary: string;
		notifications_processed: AppNotification[];
		total_unread: number;
		marked_as_read: number;
		insights: {
			most_common_senders: string[];
			urgent_count: number;
			categories: Record<string, number>;
		};
	};
	error?: string;
}

export interface DailyDigestResponse {
	success: boolean;
	data?: {
		digest: string;
		date: string;
		total_notifications: number;
		unread_count: number;
		top_senders: string[];
		urgent_notifications: AppNotification[];
		processed_notifications: AppNotification[];
	};
	error?: string;
}

// ===== PAGINAÇÃO =====

export interface PaginationRequest {
  page?: number;       // Página atual (default: 1)
  limit?: number;      // Quantidade por página (default: 10, max: 100)
  search?: string;     // Busca por nome ou email
}

export interface PaginationMeta {
  page: number;        // Página atual
  limit: number;       // Itens por página
  total: number;       // Total de itens
  total_pages: number; // Total de páginas
  has_next: boolean;   // Tem próxima página
  has_prev: boolean;   // Tem página anterior
}

export interface NotificationSearchResponse extends ApiResponse<{
  notifications: AppNotification[];
  pagination: PaginationMeta;
  search_term?: string;
}> {}

// === HELPERS DE CONVERSÃO PRISMA ===

/**
 * Converte um objeto notification do Prisma para AppNotification
 * @param notification - Objeto notification do Prisma
 * @returns AppNotification formatado para a API
 */
export const mapPrismaToApi = (notification: NotificationPrismaType): AppNotification => ({
	id: notification.id,
	name: notification.name,
	email: notification.email,
	phone: notification.phone,
	body: notification.body,
	subject: notification.subject,
	sent_at: notification.sent_at,
	read_at: notification.read_at,
});

/**
 * 🇧🇷 Obter hora atual do Brasil de forma simples e confiável
 * @returns Data/hora atual no timezone do Brasil
 */
export const getBrazilTime = (): Date => {
	// Método simples: subtrair 3 horas da hora UTC (horário padrão de Brasília)
	const now = new Date();
	const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
	return brazilTime;
};

/**
 * 🇧🇷 Obter hora atual do Brasil para salvar no banco
 * Esta versão é mais robusta usando date-fns-tz
 * @returns Data com hora do Brasil para storage
 */
export const getBrazilTimeAsUTC = (): Date => {
	const timeZone = 'America/Sao_Paulo';
	
	// Usar date-fns-tz para obter hora precisa do Brasil
	const now = new Date();
	const brazilTime = utcToZonedTime(now, timeZone);
	
	// Criar nova data com os componentes da hora do Brasil
	// mas tratada como se fosse UTC (para o banco)
	const adjustedDate = new Date(Date.UTC(
		brazilTime.getFullYear(),
		brazilTime.getMonth(),
		brazilTime.getDate(),
		brazilTime.getHours(),
		brazilTime.getMinutes(),
		brazilTime.getSeconds(),
		brazilTime.getMilliseconds()
	));
	
	return adjustedDate;
};

/**
 * Converte CreateNotificationRequest para dados do Prisma
 * @param request - Dados de criação da notificação
 * @returns Dados formatados para o Prisma.create()
 */
export const mapCreateRequestToPrisma = (request: CreateNotificationRequest) => ({
	name: request.name,
	email: request.email,
	phone: request.phone,
	body: request.body,
	subject: request.subject,
	sent_at: getBrazilTimeAsUTC(), // 🇧🇷 Hora do Brasil formatada para storage UTC
	// read_at permanece null por padrão
});

/**
 * Converte array de notifications do Prisma para AppNotifications
 * @param notifications - Array de notifications do Prisma
 * @returns Array de AppNotifications
 */
export const mapPrismaArrayToApi = (notifications: NotificationPrismaType[]): AppNotification[] => {
	return notifications.map(mapPrismaToApi);
};

/**
 * Obter hora atual do Brasil para marcar como lida (salvar no banco)
 * @returns Data/hora do Brasil convertida para UTC (para armazenamento)
 */
export const getBrazilReadTime = (): Date => {
	return getBrazilTimeAsUTC(); // Usa versão UTC para salvar no banco
};

/**
 * 🇧🇷 Formatar data/hora no padrão brasileiro
 * @param date - Data para formatar
 * @param includeTime - Se deve incluir horário (default: true)
 * @returns String formatada no padrão brasileiro
 */
export const formatBrazilTime = (date: Date, includeTime: boolean = true): string => {
	const options: Intl.DateTimeFormatOptions = {
		timeZone: 'America/Sao_Paulo',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	};
	
	if (includeTime) {
		options.hour = '2-digit';
		options.minute = '2-digit';
		options.second = '2-digit';
		options.timeZoneName = 'short';
	}
	
	return new Intl.DateTimeFormat('pt-BR', options).format(date);
};

/**
 * 🇧🇷 Converter data UTC do banco para hora local do Brasil para exibição
 * @param utcDate - Data em UTC vinda do banco
 * @returns Data convertida para hora local do Brasil
 */
export const convertUTCToBrazilTime = (utcDate: Date): Date => {
	const timeZone = 'America/Sao_Paulo';
	return utcToZonedTime(utcDate, timeZone);
};