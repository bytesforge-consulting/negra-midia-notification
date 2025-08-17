import { Hono } from "hono";
import { 
  AppNotification, 
  CreateNotificationRequest, 
  ApiResponse,
  PaginationRequest,
  PaginationMeta,
  NotificationSearchResponse,
  mapPrismaToApi,
  mapPrismaArrayToApi,
  mapCreateRequestToPrisma,
  getBrazilReadTime
} from "../types";
import { getPrismaFromContext } from "../services/database";

const notifications = new Hono<{ Bindings: CloudflareBindings }>();

// GET /notifications/paginate - Buscar notificações com paginação e filtro
notifications.get("/paginate", async (c) => {
  try {
    const prisma = getPrismaFromContext(c);
    
    // Parse query parameters
    const page = Math.max(1, parseInt(c.req.query("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") || "10")));
    const search = c.req.query("search")?.trim() || undefined;
    
    // Calcular offset para paginação
    const offset = (page - 1) * limit;
    
    // Buscar notificações com filtros e paginação
    // Para D1/SQLite, implementamos busca case-insensitive usando SQL raw
    let notifications, total;
    
    if (search) {
      // Query com busca (case-sensitive, compatível com D1/SQLite)
      notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        },
        orderBy: { sent_at: 'desc' },
        skip: offset,
        take: limit
      });
      
      // Count com mesma lógica
      total = await prisma.notification.count({
        where: {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } }
          ]
        }
      });
    } else {
      // Sem filtro - busca normal
      [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          orderBy: { sent_at: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.notification.count()
      ]);
    }

    // Converter para formato da API
    const notificationsList: AppNotification[] = mapPrismaArrayToApi(notifications);
    
    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_prev: page > 1
    };

    const response: NotificationSearchResponse = {
      success: true,
      data: {
        notifications: notificationsList,
        pagination,
        ...(search && { search_term: search })
      },
    };

    return c.json(response);
  } catch (error) {
    const response: NotificationSearchResponse = {
      success: false,
      error: `Erro ao buscar notificações: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

// GET /notifications - Listar todas as notificações (usando Prisma)
notifications.get("/", async (c) => {
  try {
    const prisma = getPrismaFromContext(c);
    
    // Buscar todas as notificações ordenadas por data de envio (mais recentes primeiro)
    const notifications = await prisma.notification.findMany({
      orderBy: {
        sent_at: 'desc'
      }
    });

    // Converter para formato da API
    const notificationsList: AppNotification[] = mapPrismaArrayToApi(notifications);

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

// GET /notifications/:id - Buscar notificação por ID (usando Prisma)
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

    const prisma = getPrismaFromContext(c);
    
    // Buscar notificação por ID
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      const response: ApiResponse<never> = {
        success: false,
        error: "Notificação não encontrada",
      };
      return c.json(response, 404);
    }

    // Marcar como lida se ainda não foi lida (hora do Brasil 🇧🇷)
    let updatedNotification = notification;
    if (!notification.read_at) {
      updatedNotification = await prisma.notification.update({
        where: { id },
        data: { read_at: getBrazilReadTime() }
      });
    }

    const response: ApiResponse<AppNotification> = {
      success: true,
      data: mapPrismaToApi(updatedNotification),
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

// POST /notifications - Criar nova notificação (usando Prisma)
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

    const prisma = getPrismaFromContext(c);
    
    // Criar nova notificação
    const notification = await prisma.notification.create({
      data: mapCreateRequestToPrisma(body)
    });

    const response: ApiResponse<AppNotification> = {
      success: true,
      data: mapPrismaToApi(notification),
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

// PUT /notifications/:id/read - Marcar notificação como lida (usando Prisma)
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

    const prisma = getPrismaFromContext(c);
    
    try {
      // Tentar marcar como lida apenas se ainda não foi lida (hora do Brasil 🇧🇷)
      const updatedNotification = await prisma.notification.update({
        where: { 
          id,
          read_at: null // Só atualiza se read_at for null
        },
        data: { read_at: getBrazilReadTime() }
      });

      const response: ApiResponse<{ message: string; notification: AppNotification }> = {
        success: true,
        data: { 
          message: "Notificação marcada como lida",
          notification: mapPrismaToApi(updatedNotification)
        },
      };

      return c.json(response);
    } catch (prismaError) {
      // Se falhou, pode ser porque não encontrou ou já estava lida
      const notification = await prisma.notification.findUnique({ where: { id } });
      
      if (!notification) {
        const response: ApiResponse<never> = {
          success: false,
          error: "Notificação não encontrada",
        };
        return c.json(response, 404);
      }

      if (notification.read_at) {
        const response: ApiResponse<never> = {
          success: false,
          error: "Notificação já foi lida",
        };
        return c.json(response, 409); // Conflict
      }

      throw prismaError; // Re-throw se for outro erro
    }
  } catch (error) {
    const response: ApiResponse<never> = {
      success: false,
      error: `Erro ao marcar notificação como lida: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
    };
    return c.json(response, 500);
  }
});

export default notifications;
