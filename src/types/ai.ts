import type { AppNotification } from './notification';
import type { ApiResponse } from './common';

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

export interface AIGenerateData {
  response: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type AIGenerateResponse = ApiResponse<AIGenerateData>;

export interface ProcessUnreadRequest {
  action?: 'analyze' | 'process' | 'digest';
  mark_as_read?: boolean;
  include_summary?: boolean;
  max_notifications?: number;
}

export interface ProcessUnreadData {
  summary: string;
  notifications_processed: AppNotification[];
  total_unread: number;
  marked_as_read: number;
  insights: {
    most_common_senders: string[];
    urgent_count: number;
    categories: Record<string, number>;
  };
}

export type ProcessUnreadResponse = ApiResponse<ProcessUnreadData>;

export interface DailyDigestData {
  digest: string;
  date: string;
  total_notifications: number;
  unread_count: number;
  top_senders: string[];
  urgent_notifications: AppNotification[];
  processed_notifications: AppNotification[];
}

export type DailyDigestResponse = ApiResponse<DailyDigestData>;
