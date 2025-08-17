import { Hono } from "hono";
import { 
  AppNotification, 
  CreateNotificationRequest, 
  NotificationRow, 
  ApiResponse 
} from "../types";

const notifications = new Hono<{ Bindings: CloudflareBindings }>();

// Função auxiliar para converter row do DB para AppNotification
const mapRowToNotification = (row: NotificationRow): AppNotification => ({
  name: row.name,
  email: row.email,
  phone: row.phone,
  body: row.body,
  subject: row.subject,
  sent_at: new Date(row.sent_at),
  read_at: row.read_at ? new Date(row.read_at) : new Date(),
});

// GET /notifications - Listar todas as notificações
notifications.get("/", async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT * FROM notifications 
      ORDER BY sent_at DESC
    `).all<NotificationRow>();

    const notificationsList: AppNotification[] = results.map(mapRowToNotification);

    const response: ApiResponse<AppNotification[]> = {
      success: true,
      data: notificationsList,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao buscar notificações: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// GET /notifications/:id - Buscar notificação por ID
notifications.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    if (isNaN(id)) {
      const response: ApiResponse<never> = {
        success: false,
        error: "ID inválido",
      };
      return c.json(response, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      SELECT * FROM notifications WHERE id = ?
    `).bind(id).first<NotificationRow>();

    if (!result) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Notificação não encontrada",
      };
      return c.json(response, 404);
    }

    // Marcar como lida se ainda não foi lida
    if (!result.read_at) {
      await db.prepare(`
        UPDATE notifications 
        SET read_at = datetime('now') 
        WHERE id = ?
      `).bind(id).run();
      
      result.read_at = new Date().toISOString();
    }

    const notification = mapRowToNotification(result);

    const response: ApiResponse<AppNotification> = {
      success: true,
      data: notification,
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao buscar notificação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// POST /notifications - Criar nova notificação
notifications.post("/", async (c) => {
  try {
    const body = await c.req.json<CreateNotificationRequest>();

    // Validação básica
    if (!body.name || !body.email || !body.phone || !body.body || !body.subject) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Todos os campos são obrigatórios: name, email, phone, body, subject",
      };
      return c.json(response, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      INSERT INTO notifications (name, email, phone, body, subject, sent_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      body.name,
      body.email,
      body.phone,
      body.body,
      body.subject
    ).run();

    if (!result.success) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Erro ao criar notificação",
      };
      return c.json(response, 500);
    }

    // Buscar a notificação criada
    const createdNotification = await db.prepare(`
      SELECT * FROM notifications WHERE id = ?
    `).bind(result.meta.last_row_id).first<NotificationRow>();

    if (!createdNotification) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Erro ao recuperar notificação criada",
      };
      return c.json(response, 500);
    }

    const notification = mapRowToNotification(createdNotification);

    const response: ApiResponse<AppNotification> = {
      success: true,
      data: notification,
    };

    return c.json(response, 201);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao criar notificação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// PUT /notifications/:id/read - Marcar notificação como lida
notifications.put("/:id/read", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    
    if (isNaN(id)) {
      const response: ApiResponse<never> = {
        success: false,
        error: "ID inválido",
      };
      return c.json(response, 400);
    }

    const db = c.env.DB;
    const result = await db.prepare(`
      UPDATE notifications 
      SET read_at = datetime('now') 
      WHERE id = ? AND read_at IS NULL
    `).bind(id).run();

    if (result.meta.changes === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Notificação não encontrada ou já foi lida",
      };
      return c.json(response, 404);
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: "Notificação marcada como lida" },
    };

    return c.json(response);
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao marcar notificação como lida: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

export default notifications;
