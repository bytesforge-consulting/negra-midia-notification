export interface AppNotification {
	name: string;
	email: string;
	phone: string;
	body: string;
	subject: string;
	sent_at: Date;
	read_at: Date;
}

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