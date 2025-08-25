# Negra Mídia Notify API

API serverless para sistema de notificações com IA integrada, construída com Cloudflare Workers, D1 Database e Workers AI.

## Objetivo

Esta API oferece uma solução completa de notificações com recursos avançados de IA para:

- **Gerenciar notificações** com CRUD completo e persistência em banco D1
- **Automatizar geração de conteúdo** usando IA nativa da Cloudflare (sem chaves API)
- **Processar análises inteligentes** de notificações não lidas
- **Executar tarefas agendadas** com cron jobs automáticos (diário, semanal, mensal)
- **Integrar com sistemas frontend** (especialmente Angular) via API REST

**Repositórios do Ecossistema:**

- **Este Projeto (API):** [negra-midia-notification](https://github.com/bytesforge-consulting/negra-midia-notification)
- **Projeto Principal (Angular):** [NegraMidia](https://github.com/bytesforge-consulting/NegraMidia) - Plataforma completa de Marketing Digital

## Funcionalidades Principais

### Sistema de Notificações

- **CRUD Completo**: Criar, buscar, listar com paginação e marcar como lidas
- **Timezone Brasil**: Horários automáticos em UTC-3 (considera horário de verão)
- **Paginação inteligente**: Busca com filtros por nome/email
- **Auto-marcação**: Notificações marcadas como lidas ao acessar detalhes
- **Telefone Opcional**: Campo `phone` é opcional em todas as operações

### Padronização de Respostas

- **ApiResponse Padronizado**: Todas as respostas seguem o formato `{ success: boolean, data?: T, error?: string }`
- **Type Safety**: TypeScript garante consistência em todos os endpoints
- **Middlewares Padronizados**: Rate limiting, CORS e autenticação usam o mesmo formato
- **Tratamento de Erros**: Erros padronizados com códigos HTTP apropriados

### Inteligência Artificial

- **Workers AI Nativo**: Sem necessidade de chaves API
- **AI Gateway**: Analytics, cache e rate limiting automáticos
- **Geração automática**: Notificações baseadas em contexto
- **Análise inteligente**: Detecta urgência e categoriza automaticamente
- **Integração D1+IA**: Busca, analisa e marca notificações automaticamente

### Cron Jobs Automáticos

- **Job Diário**: 0h Brasil - Digest + processamento urgentes
- **Job Semanal**: Segundas 0h Brasil - Análise semanal
- **Job Mensal**: Dia 1 0h Brasil - Relatórios mensais
- **Reutilização de código**: Mesma lógica dos endpoints HTTP

### Templates HTML para Emails

- **Templates dinâmicos**: Carregados via `CURRENT_URL` + `/public/templates/`
- **Digest inteligente**: Templates para emails de resumo diário/semanal/mensal
- **Personalização**: Templates com dados processados pela IA
- **Responsivo**: Templates otimizados para diferentes dispositivos

## Tecnologias

- **[Cloudflare Workers](https://workers.cloudflare.com/)**: Runtime serverless
- **[D1 Database](https://developers.cloudflare.com/d1/)**: SQLite distribuído
- **[Prisma ORM](https://prisma.io/)**: ORM type-safe
- **[Workers AI](https://developers.cloudflare.com/workers-ai/)**: IA nativa
- **[Hono](https://hono.dev/)**: Framework web
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática

## Estrutura do Projeto

```text
negra-midia-notify-api/
├── src/
│   ├── index.ts              # Entry point principal
│   ├── types.ts              # Interfaces TypeScript
│   ├── handlers/
│   │   └── scheduled.ts      # Handler de cron jobs
│   ├── middleware/
│   │   ├── cors.ts           # CORS dinâmico
│   │   └── logger.ts         # Logging middleware
│   ├── routes/
│   │   ├── notifications.ts  # Endpoints de notificações
│   │   └── ai.ts            # Endpoints de IA
│   └── services/
│       ├── database.ts       # Prisma Client factory
│       ├── scheduler.ts      # Serviço de cron jobs
│       └── digest.ts         # Serviço de digest IA
├── prisma/
│   └── schema.prisma         # Schema Prisma
├── wrangler.jsonc            # Configuração + cron triggers
├── package.json              # Scripts e dependências
└── .dev.vars                 # Variáveis locais
```

## Como Usar

### Pré-requisitos

- Node.js 18+
- Conta Cloudflare (Workers Paid para D1 e AI)
- Git

### Instalação Rápida

```bash
# 1. Clonar e instalar
git clone https://github.com/bytesforge-consulting/negra-midia-notification.git
cd negra-midia-notification
npm install

# 2. Autenticar Cloudflare
npx wrangler auth login

# 3. Configurar variáveis de ambiente
cp .dev.vars.example .dev.vars
# Edite .dev.vars com seus IDs reais (veja seção "Configuração de IDs")

# 4. Configurar banco e gerar tipos
npm run d1:setup
npm run cf-typegen
npm run prisma:generate

# 5. Iniciar desenvolvimento
npm run dev
```

### Configuração de IDs Obrigatórios

### Obter D1_DATABASE_ID

```bash
# Via CLI
wrangler d1 list
# Copie o UUID do banco "negra-midia-db"

# Via Dashboard: https://dash.cloudflare.com → Workers & Pages → D1 SQL Database
```

### Obter AI_GATEWAY_ID

```bash
# Via Dashboard: https://dash.cloudflare.com → AI → AI Gateway
# Clique no seu gateway e copie o "Gateway ID"
# Se não tiver: clique "Create gateway"
```

### Configurar CURRENT_URL

A variável `CURRENT_URL` é essencial para carregar os templates HTML dos emails de digest. Ela define a URL base onde os templates estão hospedados.

**Valores padrão:**

- **Desenvolvimento**: `http://localhost:8787`
- **Produção**: `https://negra-midia-api.hedgarbezerra35.workers.dev`

**Uso:**

- Os templates HTML são carregados dinamicamente via `fetch()` usando esta URL base
- Necessária para o funcionamento correto dos emails de digest com IA
- Deve apontar para o domínio onde a API está rodando

### Arquivo .dev.vars

```bash
D1_DATABASE_ID=sua-database-id-aqui
AI_GATEWAY_ID=seu-gateway-id-aqui
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
CORS_HEADERS=Content-Type,Authorization,X-Requested-With,X-API-Key,Accept

# URL base para carregar templates HTML (desenvolvimento)
CURRENT_URL=http://localhost:8787

# Configurações de Digest Email
DIGEST_EMAIL_FROM=digest@bytesforge.com.br
DIGEST_EMAIL_TO=seu-email@exemplo.com

# Autenticação da API
NEGRA_MIDIA_API_USER=dev_user
NEGRA_MIDIA_API_PASSWORD=dev_password

# API Key do Resend para envio de emails
RESEND_APIKEY=re_1234567890abcdef1234567890abcdef12345678
```

### Verificação da Instalação

```bash
# Health check
curl http://localhost:8787/api/__health

# Resposta esperada:
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0",
    "services": ["notifications", "ai", "database"]
  }
}

# Testar IA
curl -X POST http://localhost:8787/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Teste"}]}'

# Criar notificação (phone é opcional)
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@exemplo.com",
    "phone": "11999999999",
    "subject": "Teste da API",
    "body": "Primeira notificação"
  }'

# Ou sem telefone:
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@exemplo.com",
    "subject": "Teste da API",
    "body": "Primeira notificação"
  }'
```

## Scripts Disponíveis

### Desenvolvimento

- `npm run dev` - Servidor local (D1 local + IA remota)
- `npm run dev:remote` - Tudo remoto (comportamento de produção)
- `npm run dev:cron` - Local com suporte a teste de cron jobs

### Banco de Dados

- `npm run d1:setup` - Aplicar schema no banco local
- `npm run d1:local` - Executar comandos SQL diretos
- `npm run prisma:generate` - Gerar cliente Prisma
- `npm run prisma:push` - Sincronizar schema com D1
- `npm run prisma:studio` - Interface gráfica do banco

### Deploy e Tipos

- `npm run deploy` - Deploy para produção
- `npm run cf-typegen` - Regenerar tipos TypeScript

### Qualidade de Código

- `npm run lint` - Verificar problemas
- `npm run lint:fix` - Corrigir automaticamente
- `npm run format` - Formatar com Prettier
- `npm run check` - Lint + format completo

## Endpoints da API

### Formato de Resposta Padronizado

Todos os endpoints retornam respostas no formato `ApiResponse<T>`:

```typescript
// ✅ Resposta de Sucesso
{
  "success": true,
  "data": { /* dados da resposta */ }
}

// ✅ Resposta de Erro
{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

### Sistema

- `GET /api` - Informações da API e endpoints disponíveis
- `GET /api/__health` - Status dos serviços (notifications, ai, database) - **Sem CORS**
- `GET /api/__debug` - Endpoint de debug (desenvolvimento) - **Sem CORS**

### Notificações

- `GET /notifications` - Listar todas as notificações
- `GET /notifications/paginate` - Buscar com paginação e filtro por nome/email
- `GET /notifications/:id` - Buscar notificação por ID (marca como lida automaticamente)
- `POST /notifications` - Criar nova notificação
- `PUT /notifications/:id/read` - Marcar como lida manualmente

### IA

- `POST /ai/generate` - Geração livre de texto
- `POST /ai/generate-notification` - Gerar notificação automaticamente
- `POST /ai/summarize-notifications` - Resumir notificações
- `GET /ai/models` - Modelos disponíveis

### IA + D1 Integração

- `POST /ai/process-unread` - Processar não lidas e marcar como lidas
- `POST /ai/analyze-unread` - Analisar sem marcar como lidas
- `GET /ai/daily-digest` - Resumo diário inteligente

## Exemplos de Uso

### Criar Notificação

```bash
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@empresa.com",
    "phone": "11999999999",
    "subject": "Pedido Confirmado",
    "body": "Seu pedido foi confirmado e será entregue em 3 dias."
  }'

# Resposta:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@empresa.com",
    "phone": "11999999999",
    "subject": "Pedido Confirmado",
    "body": "Seu pedido foi confirmado e será entregue em 3 dias.",
    "sent_at": "2024-01-15T10:30:00.000Z",
    "read_at": null
  }
}

# Nota: O campo "phone" é opcional e pode ser omitido
```

### Gerar Conteúdo com IA

```bash
curl -X POST http://localhost:8787/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Gere um email amigável para confirmar um pedido de R$ 299,90"
      }
    ]
  }'

# Resposta:
{
  "success": true,
  "data": {
    "response": "Olá! Confirmamos o recebimento do seu pedido no valor de R$ 299,90...",
    "usage": {
      "prompt_tokens": 25,
      "completion_tokens": 150,
      "total_tokens": 175
    }
  }
}
```

### Processar Notificações com IA

```bash
curl -X POST http://localhost:8787/api/ai/process-unread \
  -H "Content-Type: application/json" \
  -d '{
    "mark_as_read": true,
    "max_notifications": 20
  }'

# Resposta:
{
  "success": true,
  "data": {
    "summary": "Processadas 5 notificações não lidas. Principais temas: pedidos (3), suporte (2)...",
    "notifications_processed": [
      {
        "id": 1,
        "name": "João Silva",
        "email": "joao@empresa.com",
        "phone": "11999999999",
        "subject": "Pedido Confirmado",
        "body": "Seu pedido foi confirmado...",
        "sent_at": "2024-01-15T10:30:00.000Z",
        "read_at": "2024-01-15T11:00:00.000Z"
      }
    ],
    "total_unread": 5,
    "marked_as_read": 5,
    "insights": {
      "most_common_senders": ["joao@empresa.com", "maria@empresa.com"],
      "urgent_count": 1,
      "categories": {
        "pedidos": 3,
        "suporte": 2
      }
    }
  }
}
```

## Cron Jobs

### Configuração

Os cron jobs são configurados automaticamente no `wrangler.jsonc`:

```jsonc
{
  "triggers": {
    "crons": [
      "0 3 * * *", // Diário às 0h Brasil (3h UTC)
      "0 3 * * 1", // Semanal às segundas 0h Brasil (3h UTC)
      "0 3 1 * *" // Mensal no dia 1 às 0h Brasil (3h UTC)
    ]
  }
}
```

### Jobs Disponíveis

- **Diário**: Digest diário + processamento de urgentes
- **Semanal**: Análise semanal + tendências
- **Mensal**: Relatórios mensais + auditoria

### Como Testar Localmente

### Método 1: Endpoint especial

```bash
# Iniciar com suporte a cron
npm run dev:cron

# Testar jobs via HTTP
curl "http://localhost:8787/__scheduled?cron=0+3+*+*+*"    # Diário
curl "http://localhost:8787/__scheduled?cron=0+3+*+*+1"    # Semanal
curl "http://localhost:8787/__scheduled?cron=0+3+1+*+*"    # Mensal
```

### Método 2: Endpoints equivalentes

```bash
# O endpoint /ai/daily-digest usa a mesma lógica do job diário
curl http://localhost:8787/api/ai/daily-digest

# Testar processamento (mesma lógica dos jobs)
curl -X POST http://localhost:8787/api/ai/process-unread \
  -H "Content-Type: application/json" \
  -d '{"mark_as_read": true, "max_notifications": 10}'
```

**Documentação oficial:** [Cloudflare Workers - Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)

## Deploy para Produção

### Passo a Passo Completo

#### 1. Criar Banco D1 de Produção

```bash
# Criar banco D1 remoto
npx wrangler d1 create negra-midia-db-prod

# Exemplo de saída:
# ✅ Successfully created DB 'negra-midia-db-prod' in region ENAM
# {
#   "d1_databases": [
#     {
#       "binding": "DB",
#       "database_id": "28d63604-2c9e-4fef-a4f9-a6753d55dc5a"
#     }
#   ]
# }

# IMPORTANTE: Copie o database_id retornado!
```

#### 2. Configurar wrangler.jsonc com ID Real

Atualize o `wrangler.jsonc` com o `database_id` real:

```jsonc
{
  "name": "negra-midia-notify-api",
  "main": "src/index.ts",
  "compatibility_date": "2025-08-16",
  "compatibility_flags": ["nodejs_compat"],

  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "negra-midia-db-prod",
      "database_id": "" // SEU ID AQUI
    }
  ],

  "ai": {
    "binding": "AI"
  },

  "triggers": {
    "crons": [
      "0 3 * * *", // Diário às 0h Brasil
      "0 3 * * 1", // Semanal às segundas 0h Brasil
      "0 3 1 * *" // Mensal dia 1 às 0h Brasil
    ]
  }
}
```

#### 3. Aplicar Schema ao Banco Remoto

```bash
# Aplicar schema no banco local (desenvolvimento)
npx wrangler d1 execute negra-midia-db-prod --file=schema.sql

# Aplicar schema no banco remoto (produção)
npx wrangler d1 execute negra-midia-db-prod --file=schema.sql --remote

# Verificar se tabelas foram criadas
npx wrangler d1 execute negra-midia-db-prod --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

#### 4. Configurar Variáveis de Ambiente

```bash
# Método 1: Via CLI (Secrets para dados sensíveis)
npx wrangler secret put AI_GATEWAY_ID
# Digite: seu-gateway-id-aqui

# Environment variables (não sensíveis)
npx wrangler env put ENVIRONMENT production
npx wrangler env put ALLOWED_ORIGINS "https://negramidia.com,https://app.negramidia.com"
npx wrangler env put CORS_CREDENTIALS "true"

# Método 2: Via Dashboard Cloudflare
# https://dash.cloudflare.com → Workers & Pages → seu-worker → Settings → Environment Variables
```

#### 5. Deploy Final

```bash
# Deploy para produção
npm run deploy

# Ou manualmente:
npx wrangler deploy --minify

# Verificar deploy
curl https://negra-midia-notify-api.workers.dev/api/__health
```

#### 6. Verificações Pós-Deploy

```bash
# 1. Health check
curl https://negra-midia-notify-api.workers.dev/api/__health

# 2. Testar criação de notificação
curl -X POST https://negra-midia-notify-api.workers.dev/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Produção",
    "email": "teste@producao.com",
    "phone": "11999999999",
    "subject": "Deploy realizado",
    "body": "API funcionando em produção!"
  }'

# 3. Testar IA
curl -X POST https://negra-midia-notify-api.workers.dev/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "API em produção!"}]}'

# 4. Verificar cron jobs nos logs
npx wrangler tail | grep CRON
```

## Configuração de Ambientes

### Desenvolvimento (.dev.vars)

```bash
ENVIRONMENT=development
ALLOWED_ORIGINS=*
CORS_CREDENTIALS=false
CURRENT_URL=http://localhost:8787
```

### Produção (Cloudflare Secrets)

```bash
ENVIRONMENT=production
ALLOWED_ORIGINS=https://negramidia.com,https://app.negramidia.com
CORS_CREDENTIALS=true
CURRENT_URL=https://negra-midia-api.hedgarbezerra35.workers.dev
```

## Códigos de Status HTTP

A API retorna códigos de status HTTP apropriados junto com o formato `ApiResponse`:

- **200 OK**: Operação bem-sucedida
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos na requisição
- **401 Unauthorized**: Autenticação necessária
- **403 Forbidden**: Origem não permitida (CORS)
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: notificação já lida)
- **429 Too Many Requests**: Rate limit excedido
- **500 Internal Server Error**: Erro interno do servidor

## Troubleshooting

### Problemas de Deploy

**"You must use a real database in the database_id configuration"**

```bash
# Problema: wrangler.jsonc está usando placeholders
# Solução: Criar banco real e atualizar configuração

# 1. Criar banco de produção
npx wrangler d1 create negra-midia-db-prod

# 2. Copiar database_id retornado e atualizar wrangler.jsonc
# 3. Aplicar schema
npx wrangler d1 execute negra-midia-db-prod --file=schema.sql --remote
```

**"node_compat field is no longer supported"**

```bash
# Problema: Wrangler v4 mudou configuração
# Solução: Atualizar wrangler.jsonc

# Trocar:
# "node_compat": true

# Por:
# "compatibility_flags": ["nodejs_compat"]
```

**"Database not found during deploy"**

```bash
# Verificar se o banco existe
npx wrangler d1 list

# Se não existir, criar:
npx wrangler d1 create negra-midia-db-prod

# Aplicar schema:
npx wrangler d1 execute negra-midia-db-prod --file=schema.sql --remote

# Verificar tabelas criadas:
npx wrangler d1 execute negra-midia-db-prod --command="SELECT name FROM sqlite_master WHERE type='table';" --remote
```

**"Deploy fails with binding errors"**

```bash
# Limpar cache e regenerar tipos
rm -rf .wrangler/
npm run cf-typegen

# Verificar configuração
npx wrangler whoami
npx wrangler d1 list

# Deploy com verbose para debug
npx wrangler deploy --minify --verbose
```

### Problemas de Desenvolvimento

**"Binding DB not found"**

```bash
rm -rf .wrangler/
npm run cf-typegen
npm run d1:setup
npm run dev
```

**"AI requests failing"**

```bash
npx wrangler auth login
npx wrangler whoami
```

**"Port 8787 already in use"**

```bash
npx wrangler dev --local --port=3000
```

**"Variáveis não carregam"**

```bash
# Verificar se .dev.vars está na raiz
ls -la .dev.vars

# Verificar conteúdo
cat .dev.vars

# Para desenvolvimento local, usar .dev.vars
# Para produção, usar Dashboard ou wrangler secrets
```

**"Templates HTML não carregam"**

```bash
# Verificar se CURRENT_URL está configurada
echo $CURRENT_URL

# Verificar se templates estão acessíveis
curl http://localhost:8787/public/templates/digest/base.html

# Para produção, verificar se CURRENT_URL aponta para o domínio correto
curl https://negra-midia-api.hedgarbezerra35.workers.dev/public/templates/digest/base.html
```

### Comandos de Debug

**Verificar configuração atual:**

```bash
# Ver databases configurados
npx wrangler d1 list

# Ver workers deployados
npx wrangler deployments list

# Ver logs em tempo real
npx wrangler tail

# Ver variáveis configuradas
npx wrangler secret list
npx wrangler env list
```

**Limpar e resetar ambiente:**

```bash
# Limpar cache completo
rm -rf .wrangler/
rm -rf node_modules/.cache/

# Reinstalar e reconfigurar
npm install
npm run cf-typegen
npm run prisma:generate

# Para desenvolvimento
npm run d1:setup
npm run dev

# Para produção
npx wrangler deploy --minify
```

**Rollback em caso de problema:**

```bash
# Listar deployments
npx wrangler deployments list

# Fazer rollback para deployment anterior
npx wrangler rollback [DEPLOYMENT_ID]

# Exemplo:
npx wrangler rollback a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
```

### Comandos de Monitoramento

**Verificar saúde da aplicação:**

```bash
# Health check local
curl http://localhost:8787/api/__health

# Health check produção
curl https://negra-midia-notify-api.workers.dev/api/__health

# Teste completo local
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"11999999999","subject":"Test","body":"Test"}'

# Teste completo produção
curl -X POST https://negra-midia-notify-api.workers.dev/api/notifications \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","phone":"11999999999","subject":"Test","body":"Test"}'
```

**Monitorar logs:**

```bash
# Logs gerais
npx wrangler tail

# Logs apenas de erros
npx wrangler tail --format=pretty --status=error

# Logs de cron jobs
npx wrangler tail | grep CRON

# Logs com timestamp
npx wrangler tail --format=pretty
```

## Integração com Frontend

### Serviço Angular

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = environment.notifyApiUrl;

  constructor(private http: HttpClient) {}

  // Interface para tipagem das respostas
  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }

  interface Notification {
    id?: number;
    name: string;
    email: string;
    phone?: string; // Opcional
    body: string;
    subject: string;
    sent_at: Date;
    read_at: Date | null;
  }

  getNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.apiUrl}/notifications`);
  }

  createNotification(notification: Omit<Notification, 'id' | 'sent_at' | 'read_at'>): Observable<ApiResponse<Notification>> {
    return this.http.post<ApiResponse<Notification>>(`${this.apiUrl}/notifications`, notification);
  }

  generateWithAI(messages: Array<{role: string, content: string}>): Observable<ApiResponse<{response: string, usage?: any}>> {
    return this.http.post<ApiResponse<{response: string, usage?: any}>>(`${this.apiUrl}/ai/generate`, {
      messages
    });
  }

  getDailyDigest(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/ai/daily-digest`);
  }

  // Tratamento de erros padronizado
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => new Error(error.error?.error || 'Erro desconhecido'));
  }
}
```

### Configuração de Ambiente

```typescript
// environment.ts
export const environment = {
  production: false,
  notifyApiUrl: 'http://localhost:8787'
};

// environment.prod.ts
export const environment = {
  production: true,
  notifyApiUrl: 'https://negra-midia-notify-api.workers.dev'
};
```

## Monitoramento

### Logs

```bash
# Desenvolvimento
npm run dev

# Produção
npx wrangler tail
npx wrangler tail | grep CRON  # Logs de cron jobs
```

### Métricas

- **Dashboard**: Workers Analytics no painel Cloudflare
- **D1**: Reads/writes no analytics
- **AI**: Tokens e custos no AI Gateway
- **Cron**: Execuções e falhas

## Licença

MIT License

## Suporte

- **Issues**: [GitHub Issues](https://github.com/bytesforge-consulting/negra-midia-notification/issues)
- **Projeto Principal**: [NegraMidia](https://github.com/bytesforge-consulting/NegraMidia)
- **Documentação**: [Cloudflare Docs](https://developers.cloudflare.com/)

---

Esta API integra perfeitamente com o [projeto Angular principal](https://github.com/bytesforge-consulting/NegraMidia)!
