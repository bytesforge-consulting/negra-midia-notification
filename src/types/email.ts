import type { CreateEmailOptions, CreateEmailRequestOptions } from 'resend';

export interface EmailRequest {
  payload: CreateEmailOptions;
  options?: CreateEmailRequestOptions;
}

export interface EmailResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: string;
}
