/* eslint-disable no-unused-vars */
import type { ApiResponse } from './common';

export enum DigestPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface DigestData {
  digest: string;
  period: DigestPeriod;
  start_date: string;
  end_date: string;
  total_notifications: number;
  unread_count: number;
  top_senders: string[];
  urgent_notifications: any[];
  processed_notifications: any[];
  insights: {
    most_active_day?: string;
    categories?: Record<string, number>;
    trends?: string;
  };
}

export type DigestResult = ApiResponse<DigestData>;
