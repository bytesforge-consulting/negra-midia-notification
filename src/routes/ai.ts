import { Hono } from "hono";
import {
  AIGenerateRequest,
  AIGenerateResponse,
  NotificationGenerateRequest,
  NotificationSummarizeRequest,
  AppNotification,
  ApiResponse,
  ChatMessage
} from "../types";

const ai = new Hono<{ Bindings: CloudflareBindings }>();

// POST /ai/generate - Geração livre de texto usando IA
ai.post("/generate", async (c) => {
  try {
    const request = await c.req.json<AIGenerateRequest>();

    // Validação
    if (!request.messages || request.messages.length === 0) {
      const response: AIGenerateResponse = {
        success: false,
        error: "É necessário fornecer pelo menos uma mensagem",
      };
      return c.json(response, 400);
    }

    // Configuração padrão
    const aiRequest = {
      model: request.model || "@cf/meta/llama-3.1-8b-instruct",
      messages: request.messages,
      max_tokens: request.max_tokens || 1000,
      temperature: request.temperature || 0.7,
    };

    // Chamar IA via gateway
    const aiResponse = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: aiRequest.messages,
      max_tokens: aiRequest.max_tokens,
      temperature: aiRequest.temperature,
    }) as any;

    const response: AIGenerateResponse = {
      success: true,
      data: {
        response: aiResponse.response || "Resposta não disponível",
        usage: aiResponse.usage || undefined,
      },
    };

    return c.json(response);
  } catch (error) {
    const response: AIGenerateResponse = {
      success: false,
      error: `Erro ao gerar resposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// POST /ai/generate-notification - Gerar notificação usando IA
ai.post("/generate-notification", async (c) => {
  try {
    const request = await c.req.json<NotificationGenerateRequest>();

    // Validação
    if (!request.context) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Contexto é obrigatório para gerar notificação",
      };
      return c.json(response, 400);
    }

    const tone = request.tone || "friendly";
    const language = request.language || "pt-BR";
    const type = request.type || "email";

    // Prompt customizado para gerar notificações
    const systemPrompt = `Você é um assistente especializado em criar notificações ${type} profissionais.
    
Diretrizes:
- Tom: ${tone}
- Idioma: ${language}
- Tipo: ${type}
- Seja conciso e claro
- Use formatação adequada
- Para email: inclua assunto e corpo
- Para SMS: máximo 160 caracteres
- Para push: máximo 50 caracteres no título e 100 no corpo

Retorne apenas o conteúdo da notificação no seguinte formato JSON:
{
  "subject": "assunto aqui (para email)",
  "body": "corpo da mensagem aqui"
}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Contexto: ${request.context}` }
    ];

    // Chamar IA
    const aiResponse = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 500,
      temperature: 0.3,
    }) as any;

    let notificationContent;
    try {
      notificationContent = JSON.parse(aiResponse.response || "{}");
    } catch {
      // Se não conseguir parsear JSON, criar estrutura manual
      notificationContent = {
        subject: type === "sms" ? "" : "Notificação Importante",
        body: aiResponse.response || "Erro ao gerar conteúdo",
      };
    }

    const response: ApiResponse<typeof notificationContent> = {
      success: true,
      data: notificationContent,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao gerar notificação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// POST /ai/summarize-notifications - Resumir notificações usando IA
ai.post("/summarize-notifications", async (c) => {
  try {
    const request = await c.req.json<NotificationSummarizeRequest>();

    // Validação
    if (!request.notifications || request.notifications.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: "É necessário fornecer pelo menos uma notificação para resumir",
      };
      return c.json(response, 400);
    }

    const timeframe = request.timeframe || "today";

    // Preparar dados das notificações
    const notificationsData = request.notifications.map(n => ({
      assunto: n.subject,
      remetente: n.name,
      email: n.email,
      enviado_em: n.sent_at,
      lido_em: n.read_at,
      corpo: n.body.substring(0, 200) // Limitar tamanho do corpo
    }));

    const systemPrompt = `Você é um assistente que cria resumos executivos de notificações.

Analise as notificações fornecidas e crie um resumo executivo incluindo:
1. Número total de notificações
2. Principais remetentes
3. Assuntos mais comuns
4. Taxa de abertura
5. Tendências importantes
6. Ações recomendadas

Seja conciso e focado em insights úteis para gestão.`;

    const userPrompt = `Resumir notificações do período: ${timeframe}

Dados das notificações:
${JSON.stringify(notificationsData, null, 2)}`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    // Chamar IA
    const aiResponse = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 800,
      temperature: 0.5,
    }) as any;

    const response: ApiResponse<{ summary: string; timeframe: string; total_notifications: number }> = {
      success: true,
      data: {
        summary: aiResponse.response || "Não foi possível gerar resumo",
        timeframe,
        total_notifications: request.notifications.length,
      },
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao resumir notificações: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// GET /ai/models - Listar modelos disponíveis
ai.get("/models", async (c) => {
  try {
    const availableModels = [
      {
        id: "@cf/meta/llama-3.1-8b-instruct",
        name: "Llama 3.1 8B Instruct",
        description: "Modelo de conversação geral",
        type: "chat"
      },
      {
        id: "@cf/microsoft/phi-2",
        name: "Phi-2",
        description: "Modelo compacto e eficiente",
        type: "chat"
      },
      {
        id: "@cf/mistral/mistral-7b-instruct-v0.1",
        name: "Mistral 7B Instruct",
        description: "Modelo multilíngue",
        type: "chat"
      }
    ];

    const response: ApiResponse<typeof availableModels> = {
      success: true,
      data: availableModels,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao listar modelos: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

export default ai;
