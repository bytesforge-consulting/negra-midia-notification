import type { CreateEmailOptions, CreateEmailRequestOptions } from 'resend';
import type { ApiResponse } from './common';

export interface EmailRequest {
  payload: CreateEmailOptions;
  options?: CreateEmailRequestOptions;
}

export interface EmailData {
  id: string;
}

export type EmailResponse = ApiResponse<EmailData>;
