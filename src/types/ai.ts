import type { AppNotification } from './notification';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
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

export interface ProcessUnreadRequest {
  action?: 'analyze' | 'process' | 'digest';
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
