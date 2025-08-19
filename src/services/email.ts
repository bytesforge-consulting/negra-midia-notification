import { Resend } from 'resend';
import type { EmailRequest, EmailResponse } from '../types';

export const sendEmail = async (
  request: EmailRequest,
  env: CloudflareBindings
): Promise<EmailResponse> => {
  try {
    const api_key = await env.RESEND_APIKEY.get();
    const resend = new Resend(api_key);

    const { data, error } = await resend.emails.send(request.payload, request.options);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      data: {
        id: data!.id
      }
    };
  } catch (error) {
    return {
      success: false,
      error: JSON.stringify(error)
    };
  }
};

export const sendSimpleEmail = async (
  from: string,
  to: string | string[],
  subject: string,
  html: string,
  env: CloudflareBindings
): Promise<EmailResponse> => {
  try {
    const api_key = await env.RESEND_APIKEY.get();
    const resend = new Resend(api_key);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      replyTo: from,
      html
    });

    if (error) {
      return {
        success: false,
        error: JSON.stringify(error)
      };
    }

    return {
      success: true,
      data: {
        id: data!.id
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
