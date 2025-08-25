# Changelog

## [1.2.0] - 2024-01-15

### ✅ Adicionado

- **Prefix `/api` obrigatório** para todos os endpoints (compatibilidade com redirecionamento Cloudflare)
- **Endpoints de depuração** agora em `/api/__health` e `/api/__debug`
- **Bypass automático** de CORS e autenticação para endpoints de depuração
- **Variável `CURRENT_URL`** para carregamento de templates HTML
- **Documentação de templates** e configuração de ambiente

### 🔧 Alterado

- **Todos os endpoints** agora requerem prefix `/api`
- **Middleware CORS** pula validação para endpoints `/api/__*`
- **Middleware Auth** pula autenticação para endpoints `/api/__*`
- **Documentação atualizada** com novos caminhos de endpoints
- **Configuração de ambiente** inclui `CURRENT_URL` para templates

### 📝 Detalhes Técnicos

#### Estrutura de Endpoints Atualizada

```typescript
// Antes: Endpoints mistos
GET / __health;
GET / __debug;
GET / api / notifications;
POST / api / ai / generate;

// Depois: Todos com prefix /api
GET / api / __health;
GET / api / __debug;
GET / api / notifications;
POST / api / ai / generate;
```

#### Middleware Bypass

```typescript
// CORS e Auth pulam endpoints de depuração
const isDebugEndpoint = c.req.path.startsWith('/api/__');
if (isDebugEndpoint) {
  return next(); // Pula validação
}
```

### 🔄 Migração

Para clientes existentes, atualizar URLs:

```bash
# Antes
curl http://localhost:8787/__health
curl http://localhost:8787/notifications

# Depois
curl http://localhost:8787/api/__health
curl http://localhost:8787/api/notifications
```

### 📋 Configuração de Templates

Adicionar variável `CURRENT_URL` ao ambiente:

```bash
# Desenvolvimento
CURRENT_URL=http://localhost:8787

# Produção
CURRENT_URL=https://negra-midia-api.hedgarbezerra35.workers.dev
```

---

## [1.1.0] - 2024-01-15

### ✅ Adicionado

- **Padronização completa das respostas da API** com formato `ApiResponse<T>`
- **Campo telefone opcional** em todas as operações de notificação
- **Type Safety** para todas as respostas da API
- **Middlewares padronizados** (CORS, Rate Limiting, Auth)
- **Tratamento de erros consistente** em todos os endpoints

### 🔧 Alterado

- **Schema do banco**: Campo `phone` agora é `NULL` (opcional)
- **Tipos TypeScript**: Todos os tipos de resposta agora herdam de `ApiResponse`
- **Middlewares**: Rate limiting e CORS agora retornam `ApiResponse<never>`
- **Validação**: Telefone não é mais obrigatório na criação de notificações

### 🗑️ Removido

- **Campos obrigatórios**: Telefone não é mais obrigatório
- **Respostas inconsistentes**: Todas as respostas agora seguem o mesmo padrão

### 📝 Detalhes Técnicos

#### Padronização de Respostas

```typescript
// Antes: Respostas inconsistentes
{ "id": 1, "name": "João" }
{ "error": "Erro" }
{ "success": true, "data": {...} }

// Depois: Todas as respostas padronizadas
{
  "success": true,
  "data": { "id": 1, "name": "João" }
}

{
  "success": false,
  "error": "Mensagem de erro descritiva"
}
```

#### Campo Telefone Opcional

```typescript
// Antes: Telefone obrigatório
interface CreateNotificationRequest {
  name: string;
  email: string;
  phone: string; // Obrigatório
  body: string;
  subject: string;
}

// Depois: Telefone opcional
interface CreateNotificationRequest {
  name: string;
  email: string;
  phone?: string; // Opcional
  body: string;
  subject: string;
}
```

#### Tipos Padronizados

- `AIGenerateResponse` → `ApiResponse<AIGenerateData>`
- `ProcessUnreadResponse` → `ApiResponse<ProcessUnreadData>`
- `DailyDigestResponse` → `ApiResponse<DailyDigestData>`
- `DigestResult` → `ApiResponse<DigestData>`
- `EmailResponse` → `ApiResponse<EmailData>`

### 🔄 Migração do Banco de Dados

Para aplicar as mudanças no banco de dados existente:

```bash
# Executar script de migração
wrangler d1 execute DB --file=alter_phone_nullable.sql --remote
```

### 🧪 Testes

```bash
# Testar criação sem telefone
curl -X POST http://localhost:8787/api/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@exemplo.com",
    "subject": "Teste",
    "body": "Teste sem telefone"
  }'

# Verificar formato de resposta
curl http://localhost:8787/api/__health
```

### 📚 Documentação Atualizada

- README.md atualizado com exemplos de respostas padronizadas
- Documentação de integração com frontend atualizada
- Exemplos de uso com campo telefone opcional
- Códigos de status HTTP documentados

---

## [1.0.0] - 2024-01-10

### ✅ Adicionado

- Sistema completo de notificações com CRUD
- Integração com Workers AI
- Cron jobs automáticos (diário, semanal, mensal)
- Middleware de CORS configurável
- Rate limiting para endpoints de IA
- Autenticação básica
- Logging adaptativo
- Timezone Brasil (UTC-3)
- Paginação e busca de notificações
- Digest inteligente com IA

### 🔧 Configuração

- Cloudflare Workers + D1 Database
- Prisma ORM para type safety
- Hono framework para roteamento
- TypeScript para tipagem estática
