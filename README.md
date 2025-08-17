# Negra Mídia Notify API

API serverless para sistema de notificações com IA integrada, construída com Cloudflare Workers, D1 Database e Workers AI.

> **Repositórios do Ecossistema:**
>
> - **Este Projeto (API):** [negra-midia-notification](https://github.com/bytesforge-consulting/negra-midia-notification)
> - **Projeto Principal (Angular):** [NegraMidia](https://github.com/bytesforge-consulting/NegraMidia) - Plataforma completa de Marketing Digital

## Visão Geral

Esta API oferece:

- **Gerenciamento de notificações** com CRUD completo
- **IA integrada** para geração automática de conteúdo
- **Performance edge** com Cloudflare Workers
- **Banco D1** distribuído globalmente
- **CORS dinâmico** configurável por ambiente

### Arquitetura do Ecossistema

```
┌─────────────────────────┐    ┌─────────────────────────┐
│   Frontend Angular      │────│   Notify API            │
│   github.com/../        │    │   github.com/../        │
│   NegraMidia            │    │   negra-midia-          │
│                         │    │   notification          │
│ • Dashboard             │    │ • Endpoints REST        │
│ • Gerenciamento         │    │ • IA para conteúdo      │
│ • Interface usuário     │    │ • Banco D1 global       │
└─────────────────────────┘    └─────────────────────────┘
```

## Início Rápido

### Pré-requisitos

- Node.js 18+
- Conta Cloudflare (Workers Paid para D1 e AI)
- Git

### Instalação

```bash
# 1. Clonar o repositório da API
git clone https://github.com/bytesforge-consulting/negra-midia-notification.git
cd negra-midia-notification

# 2. Instalar dependências
npm install

# 3. Autenticar no Cloudflare
npx wrangler auth login

# 4. Configurar banco local
npm run d1:setup

# 5. Gerar tipos TypeScript
npm run cf-typegen

# 6. Iniciar desenvolvimento
npm run dev
```

### Verificar Funcionamento

```bash
# Health check
curl http://localhost:8787/health

# Testar IA
curl -X POST http://localhost:8787/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Olá!"}]}'
```

## 📚 Documentação Completa

### 📋 Endpoints da API

#### **Sistema**

- `GET /` - Informações da API e endpoints disponíveis
- `GET /health` - Status dos serviços (notifications, ai, database)

#### **📧 Notificações**

- `GET /notifications` - Listar todas as notificações
- `GET /notifications/paginate` - **🆕 Buscar com paginação e filtro por nome/email**
- `GET /notifications/:id` - Buscar notificação por ID (marca como lida)
- `POST /notifications` - Criar nova notificação
- `PUT /notifications/:id/read` - Marcar como lida manualmente

#### **IA (Workers AI + Integração D1)**

- `POST /ai/generate` - Geração livre de texto
- `POST /ai/generate-notification` - Gerar notificação automaticamente
- `POST /ai/summarize-notifications` - Resumir notificações por período
- `GET /ai/models` - Listar modelos disponíveis

**Novos - IA + D1 Integração:**

- `POST /ai/process-unread` - **Processar notificações não lidas com IA e marcar como lidas**
- `POST /ai/analyze-unread` - Analisar notificações não lidas SEM marcar como lidas
- `GET /ai/daily-digest` - Resumo diário inteligente (marca urgentes como lidas)

**Configuração de Gateway:**

- Todas as chamadas de IA passam pelo Gateway configurado via `AI_GATEWAY_NAME`
- Oferece analytics avançados, cache e controle de rate limiting
- Logs detalhados de uso e performance da IA

### Configuração

#### **Diferença: .env vs .dev.vars**

**ATENÇÃO**: O Wrangler tem uma diferença importante na leitura de variáveis:

```bash
# ❌ .env - NÃO é lido automaticamente pelo Wrangler
# ✅ .dev.vars - Lido automaticamente pelo "wrangler dev"
# ✅ Environment Variables - Configuração de produção no dashboard
```

#### **Configuração de IDs Sensíveis (OBRIGATÓRIO)**

Para segurança, os IDs sensíveis são configurados via variáveis de ambiente:

**Variáveis obrigatórias:**

```bash
# Arquivo: .dev.vars (desenvolvimento local)
D1_DATABASE_ID=sua-database-id-aqui
AI_GATEWAY_NAME=seu-gateway-name-aqui
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,https://negramidia.com
CORS_CREDENTIALS=true
```

**Como obter os valores:**

##### **1. Obter D1_DATABASE_ID:**

```bash
# Método 1: Via Wrangler CLI
wrangler d1 list

# Exemplo de saída:
# ┌──────────────────────────────────────┬─────────────────┬─────────────┐
# │ uuid                                 │ name            │ created_at  │
# ├──────────────────────────────────────┼─────────────────┼─────────────┤
# │ b0cf9329-4048-473c-bebe-d7f8248b4ebd │ negra-midia-db  │ 2024-01-15  │
# └──────────────────────────────────────┴─────────────────┴─────────────┘

# Copie o UUID da linha do banco "negra-midia-db"

# Método 2: Via Dashboard Cloudflare
# 1. Acesse: https://dash.cloudflare.com
# 2. Vá em: Workers & Pages → D1 SQL Database
# 3. Clique no banco "negra-midia-db"
# 4. Copie o "Database ID" que aparece na página
```

##### **2. Obter AI_GATEWAY_NAME:**

```bash
# Via Dashboard Cloudflare (único método)
# 1. Acesse: https://dash.cloudflare.com
# 2. No menu lateral: AI → AI Gateway
# 3. Clique no gateway que você criou (ex: "negra-midia")
# 4. Copie o "Gateway ID" que aparece no topo da página
#
# Formato: 76dc5dcedb556fcf4f6a675feb112339
#
# Se você não tem um gateway ainda:
# 1. Clique em "Create gateway"
# 2. Nome: negra-midia (ou outro de sua escolha)
# 3. Após criar, copie o ID gerado
```

##### **3. Criar arquivo .dev.vars para desenvolvimento local:**

```bash
# Passo 1: Vá para a raiz do projeto
cd C:/Users/hedga/RiderProjects/negramidia-notify-api

# Passo 2: Crie o arquivo .dev.vars com seus IDs reais
# IMPORTANTE: Wrangler lê .dev.vars automaticamente no desenvolvimento
# SUBSTITUA pelos IDs que você obteve nos passos anteriores!

# Exemplo do conteúdo esperado:
#D1_DATABASE_ID=
#AI_GATEWAY_NAME=
#ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,https://negramidia.com,https://*.negramidia.com
#CORS_CREDENTIALS=true
#CORS_MAX_AGE=86400
#CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
#CORS_HEADERS=Content-Type,Authorization,X-Requested-With,X-API-Key,Accept
```

##### **4. Resolução de problemas comuns:**

```bash
# Problema: "wrangler d1 list" retorna vazio
# Solução: Verificar se está autenticado
wrangler whoami
# Se não estiver logado:
wrangler auth login

# Problema: Banco "negra-midia-db" não aparece na lista
# Solução: Verificar se o banco existe ou criar um novo
wrangler d1 create negra-midia-db

# Problema: Não encontro o AI Gateway no dashboard
# Solução: Verificar se está na conta/zona correta
# 1. https://dash.cloudflare.com
# 2. Verificar se está na conta correta (seletor no topo)
# 3. Se não existir: AI → AI Gateway → "Create gateway"

# Problema: Arquivo .dev.vars não funciona no Windows
# Solução: Usar PowerShell ou Git Bash
# PowerShell:
Set-Content .dev.vars "D1_DATABASE_ID=seu-id`nAI_GATEWAY_NAME=seu-gateway-name"

# Problema: Variáveis não carregam no wrangler dev
# Solução: Verificar se o arquivo .dev.vars está na raiz correta
ls -la .dev.vars
# Deve estar em: C:/Users/hedga/RiderProjects/negramidia-notify-api/.dev.vars

# Problema: AI Gateway não está funcionando
# Solução: Verificar se AI_GATEWAY_NAME está correto no .dev.vars
# Testar com: node test-ai-gateway-debug.mjs
```

**Configuração Produção (Cloudflare):**

```bash
# Via CLI (Secrets - mais seguro)
wrangler secret put D1_DATABASE_ID
wrangler secret put AI_GATEWAY_NAME

# Via Dashboard
# Workers & Pages → Seu Worker → Settings → Environment Variables
# Adicione as variáveis D1_DATABASE_ID e AI_GATEWAY_NAME
```

#### **Configuração CORS via Variáveis de Ambiente**

As configurações de CORS seguem **ordem de precedência** (maior para menor):

1. **Secrets** (Plataforma Cloudflare) - **MAIOR PRIORIDADE**
2. **Environment Variables** (Plataforma Cloudflare)
3. **vars** (wrangler.jsonc) - **MENOR PRIORIDADE**

##### **Configuração na Plataforma (Recomendado para Produção)**

```bash
# Via Dashboard Cloudflare:
# https://dash.cloudflare.com → Workers & Pages → Seu Worker → Settings → Environment Variables

# Adicionar variáveis:
ALLOWED_ORIGINS = "https://negramidia.com,https://app.negramidia.com,https://admin.negramidia.com"
CORS_CREDENTIALS = "true"
CORS_MAX_AGE = "86400"
ENVIRONMENT = "production"
```

```bash
# Via Wrangler CLI (Secrets - para dados sensíveis):
wrangler secret put ALLOWED_ORIGINS
# Digite: https://negramidia.com,https://app.negramidia.com

wrangler secret put CORS_CREDENTIALS
# Digite: true

# Via Wrangler CLI (Environment Variables):
wrangler env put ENVIRONMENT production
```

##### **Configuração Local (wrangler.jsonc)**

```jsonc
{
  "vars": {
    // AVISO: Estas são configurações FALLBACK - sobrescritas pela plataforma
    "ALLOWED_ORIGINS": "http://localhost:4200,http://localhost:3000",
    "CORS_CREDENTIALS": "true",
    "CORS_MAX_AGE": "86400",
    "CORS_METHODS": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    "CORS_HEADERS": "Content-Type,Authorization,X-Requested-With,X-API-Key,Accept",
    "ENVIRONMENT": "development"
  }
}
```

##### **Configurações por Ambiente**

```bash
# DESENVOLVIMENTO (wrangler.jsonc)
ALLOWED_ORIGINS = "*"
CORS_CREDENTIALS = "false"
ENVIRONMENT = "development"

# STAGING (Plataforma Cloudflare)
ALLOWED_ORIGINS = "https://staging.negramidia.com,http://localhost:4200"
CORS_CREDENTIALS = "true"
ENVIRONMENT = "staging"

# PRODUÇÃO (Plataforma Cloudflare - Secrets)
ALLOWED_ORIGINS = "https://negramidia.com,https://app.negramidia.com,https://admin.negramidia.com"
CORS_CREDENTIALS = "true"
ENVIRONMENT = "production"
```

##### **Como Verificar qual Configuração está Ativa**

```bash
# 1. Ver logs do worker (desenvolvimento)
npm run dev
# Procure por: "CORS Sources: ALLOWED_ORIGINS: Plataforma"

# 2. Ver variáveis via CLI
wrangler secret list  # Lista secrets
wrangler env list     # Lista environment vars

# 3. Testar CORS
curl -H "Origin: https://negramidia.com" https://seu-worker.workers.dev/health
```

##### **Comandos Úteis para Gerenciar Variáveis**

```bash
# Ver configurações atuais
wrangler secret list
wrangler env list

# Definir para produção
wrangler secret put ALLOWED_ORIGINS --env production
wrangler env put ENVIRONMENT production --env production

# Remover variável
wrangler secret delete ALLOWED_ORIGINS
wrangler env delete ENVIRONMENT

# Deploy com environment específico
wrangler deploy --env production
```

**Recursos Avançados:**

- **Wildcards**: `https://*.negramidia.com` permite todos os subdomínios
- **Debug logs**: Mostram origem das configurações em desenvolvimento
- **Fallbacks**: Configurações padrão se variáveis não estiverem definidas
- **Precedência**: Plataforma sempre sobrescreve wrangler.jsonc
- **Secrets**: Para dados sensíveis (não aparecem em logs)

### Desenvolvimento Local

#### **Configuração Inicial (.dev.vars)**

ANTES de iniciar o desenvolvimento, configure as variáveis:

```bash
# 1. Copie o arquivo de exemplo
cp .dev.vars.example .dev.vars

# 2. Edite o .dev.vars com seus IDs reais
# D1_DATABASE_ID: obtido com "wrangler d1 list"
# AI_GATEWAY_NAME: obtido no dashboard do Cloudflare

# 3. Verificar configuração
cat .dev.vars

# 4. Configurar qualidade de código (hooks Git)
npm run prepare

# 5. Iniciar desenvolvimento
npm run dev
```

#### **Acesso Local a IA e D1 - Sim, funciona!**

O Wrangler oferece excelente suporte local:

**D1 Local:**

- SQLite local em `.wrangler/state/d1/DB.sqlite3`
- Schema aplicado automaticamente
- Dados persistem entre reinicializações
- Mesma API que produção

**Workers AI Local:**

- Proxy para API Cloudflare (requests reais)
- Autenticação automática via `wrangler auth`
- Rate limits de desenvolvimento
- Todos os modelos disponíveis

#### **Comandos de Desenvolvimento**

```bash
# Desenvolvimento com D1 local + IA remota (recomendado)
npm run dev

# Desenvolvimento com tudo remoto
npm run dev:remote

# PRISMA ORM - Comandos principais
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:push      # Sincronizar schema com banco
npm run prisma:studio    # Interface gráfica do banco

# SQL direto (método antigo)
npm run d1:setup  # Aplicar schema.sql no banco local

# Executar SQL no banco local
npm run d1:local --command="SELECT * FROM notifications;"

# Regenerar tipos após mudanças
npm run cf-typegen
```

#### **Testes Locais**

```bash
# 1. Testar notificações
curl -X POST http://localhost:8787/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Local",
    "email": "teste@local.dev",
    "phone": "11999999999",
    "body": "Testando D1 local",
    "subject": "D1 Local Test"
  }'

# 2. Listar notificações
curl http://localhost:8787/notifications

# 2.1. Buscar notificações com paginação
curl "http://localhost:8787/notifications/paginate?page=1&limit=5&search=joão"

# 3. Gerar conteúdo com IA
curl -X POST http://localhost:8787/ai/generate-notification \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Cliente fez pedido de R$ 100",
    "type": "email",
    "tone": "friendly",
    "language": "pt-BR"
  }'
```

### AI Gateway Cloudflare

A API está configurada para usar o **AI Gateway da Cloudflare** para todas as chamadas de IA:

#### **Configuração Atual:**

```jsonc
// wrangler.jsonc
"ai": {
  "binding": "AI",
  "gateway": {
    "id": "${AI_GATEWAY_NAME}"  // Carregado de variável de ambiente
  }
}
```

#### **Benefícios do AI Gateway:**

- **Analytics Avançados**: Métricas detalhadas de uso, latência e custos
- **Cache Inteligente**: Respostas similares são cacheadas automaticamente
- **Rate Limiting**: Controle de quota e limite de requests por período
- **Logs Detalhados**: Histórico completo de requests e responses
- **Fallback**: Tolerância a falhas e retry automático
- **Cost Control**: Monitoramento e alertas de gastos com IA

#### **Monitoramento:**

```bash
# Acesse o dashboard do AI Gateway em:
# https://dash.cloudflare.com → AI → AI Gateway → [seu-gateway]

# Métricas disponíveis:
# - Total de requests por período
# - Latência média das respostas
# - Cache hit ratio
# - Custos por modelo
# - Tokens consumidos
# - Erros e fallbacks
```

#### **Comandos Úteis:**

```bash
# Ver logs do gateway localmente
npm run dev
# As requests passarão pelo gateway automaticamente

# Deploy com gateway configurado
npm run deploy
# Gateway funciona tanto local quanto em produção
```

### Deploy para Produção

#### **1. Configuração Inicial**

```bash
# Criar banco D1 remoto
npx wrangler d1 create negra-midia-db

# Aplicar schema
npx wrangler d1 execute negra-midia-db --file=./schema.sql

# Atualizar wrangler.jsonc com database_id retornado
```

#### **2. Deploy**

```bash
# Deploy staging
npx wrangler deploy --config wrangler.staging.jsonc

# Deploy produção
npx wrangler deploy --minify

# Ver logs em tempo real
npx wrangler tail
```

#### **3. Verificação Pós-Deploy**

```bash
# Health check
curl https://seu-worker.workers.dev/health

# Teste completo
curl -X POST https://seu-worker.workers.dev/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "API funcionando!"}]}'
```

### 🤖 IA - Workers AI

#### **Configuração (Sem chaves necessárias!)**

```jsonc
// wrangler.jsonc
{
  "ai": {
    "binding": "AI" // Simples assim!
  }
}
```

**✅ Vantagens:**

- Sem chaves de API
- Billing integrado Cloudflare
- Latência baixa (edge)
- Setup zero

#### **Modelos Disponíveis**

| Modelo                                 | Tipo | Uso Recomendado                   |
| -------------------------------------- | ---- | --------------------------------- |
| `@cf/meta/llama-3.1-8b-instruct`       | Chat | Conversação geral, conteúdo longo |
| `@cf/microsoft/phi-2`                  | Chat | Respostas rápidas, conteúdo curto |
| `@cf/mistral/mistral-7b-instruct-v0.1` | Chat | Multilíngue, ótimo para PT-BR     |

#### **Exemplos de Uso**

```bash
# Gerar email de boas-vindas
curl -X POST /ai/generate-notification \
  -d '{
    "context": "Novo usuário se cadastrou na plataforma",
    "type": "email",
    "tone": "friendly"
  }'

# Resumo semanal de notificações
curl -X POST /ai/summarize-notifications \
  -d '{
    "notifications": [...],
    "timeframe": "week"
  }'
```

### Estrutura do Projeto

```
negra-midia-notify-api/
├── src/
│   ├── index.ts              # Entry point, rotas principais
│   ├── types.ts              # Interfaces TypeScript
│   ├── middleware/
│   │   └── cors.ts           # CORS dinâmico
│   ├── routes/
│   │   ├── notifications.ts  # Endpoints de notificações
│   │   └── ai.ts            # Endpoints de IA
│   └── services/            # Para futuras expansões
├── public/
│   └── index.html           # Página estática
├── README.md                # Documentação completa (este arquivo)
├── schema.sql               # Schema do banco D1
├── wrangler.jsonc           # Configuração principal
├── package.json             # Scripts e dependências
├── tsconfig.json            # Configuração TypeScript
└── worker-configuration.d.ts # Tipos gerados automaticamente
```

> 📝 **Documentação Única**: Toda documentação está consolidada neste README.md para facilitar manutenção e acesso.

### 📊 Monitoramento

#### **Dashboard Cloudflare**

- Workers Analytics (requests, errors, CPU)
- D1 Analytics (reads, writes, storage)
- AI Usage (tokens, models, costs)

#### **Logs**

```bash
# Logs em tempo real
npx wrangler tail

# Logs com filtro
npx wrangler tail --format=pretty --status=error
```

### 🔒 Segurança

- **CORS configurável** por ambiente
- **Rate limiting** via Cloudflare
- **Validação de entrada** em todos endpoints
- **Tratamento de erros** padronizado

### 💰 Custos

- **Workers**: Incluído em planos paid
- **D1**: 25M reads, 50k writes/mês grátis
- **Workers AI**: Por neuron usage, barato para uso normal

## 🔧 Qualidade de Código

### **ESLint + Prettier + lint-staged**

**Scripts Disponíveis:**

```bash
# Verificar problemas de linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código com Prettier
npm run format

# Verificar formatação sem alterar
npm run format:check

# Executar lint + formatação
npm run check
```

**Automação Git:**

- ✅ **pre-commit**: Executa lint-staged (formata apenas arquivos staged)
- ✅ **pre-push**: Executa lint + format check completo
- ✅ **VS Code**: Formatação automática ao salvar

**Configurações:**

- ✅ **TypeScript** suporte completo
- ✅ **Cloudflare Workers** ambiente configurado
- ✅ **Prettier** integrado com ESLint
- ✅ **Ignorar arquivos** gerados (.wrangler, migrations)

## 🤖 Exemplos Práticos de IA

### **Geração de Notificações Automáticas**

```bash
# Gerar email promocional
curl -X POST http://localhost:8787/ai/generate-notification \
  -H "Content-Type: application/json" \
  -d '{
    "context": "Cliente Maria fez pedido de R$ 299,90 com camiseta, calça jeans e tênis. Entrega em 5 dias.",
    "type": "email",
    "tone": "friendly",
    "language": "pt-BR"
  }'

# Resposta:
{
  "success": true,
  "data": {
    "subject": "Confirmação do seu pedido - Negra Mídia",
    "body": "Olá Maria! Seu pedido foi confirmado! 🎉\n\nDetalhes:\n• Valor: R$ 299,90\n• Produtos: Camiseta, Calça Jeans, Tênis\n• Entrega: 5 dias úteis"
  }
}
```

```bash
# Gerar SMS promocional
curl -X POST http://localhost:8787/ai/generate-notification \
  -H "Content-Type: application/json" \
  -d '{
    "context": "iPhone 15 com 20% de desconto por tempo limitado",
    "type": "sms",
    "tone": "urgent"
  }'

# Resposta:
{
  "success": true,
  "data": {
    "subject": "",
    "body": "🔥 OFERTA! iPhone 15 com 20% OFF por tempo limitado. Aproveite!"
  }
}
```

### **🔥 Novos: IA + D1 Integração**

```bash
# Processar notificações não lidas (busca no D1 + marca como lidas)
curl -X POST http://localhost:8787/ai/process-unread \
  -H "Content-Type: application/json" \
  -d '{
    "mark_as_read": true,
    "max_notifications": 20
  }'

# Resposta:
{
  "success": true,
  "data": {
    "summary": "Análise: 15 notificações não lidas. 3 urgentes detectadas...",
    "notifications_processed": [...],
    "total_unread": 15,
    "marked_as_read": 15,
    "insights": {
      "most_common_senders": ["João Silva", "Maria Santos"],
      "urgent_count": 3,
      "categories": {"Vendas": 8, "Suporte": 4, "Geral": 3}
    }
  }
}
```

```bash
# Apenas analisar SEM marcar como lidas
curl -X POST http://localhost:8787/ai/analyze-unread \
  -H "Content-Type: application/json" \
  -d '{}'

# Digest diário (busca do dia + marca urgentes como lidas)
curl http://localhost:8787/ai/daily-digest
```

### **Resumos Inteligentes**

```bash
# Resumir notificações da semana
curl -X POST http://localhost:8787/ai/summarize-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [...],
    "timeframe": "week"
  }'
```

## 🔗 Integração com Projeto Angular

Esta API integra perfeitamente com o [projeto Angular principal](https://github.com/bytesforge-consulting/NegraMidia):

### **Serviço Angular Completo**

```typescript
// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AppNotification {
  name: string;
  email: string;
  phone: string;
  body: string;
  subject: string;
  sent_at: Date;
  read_at: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = environment.notifyApiUrl;

  constructor(private http: HttpClient) {}

  // CRUD Notificações
  getNotifications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/notifications`);
  }

  createNotification(notification: Partial<AppNotification>): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications`, notification);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  // IA Features
  generateWithAI(context: string, type: 'email' | 'sms' | 'push' = 'email'): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/generate-notification`, {
      context,
      type,
      tone: 'friendly',
      language: 'pt-BR'
    });
  }

  summarizeNotifications(
    notifications: AppNotification[],
    timeframe: string = 'week'
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/summarize-notifications`, {
      notifications,
      timeframe
    });
  }
}
```

### **Componente Dashboard**

```typescript
// Dashboard com IA integrada
@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h1>📊 Dashboard Negra Mídia</h1>

      <!-- Métricas -->
      <div class="metrics">
        <div class="metric-card">
          <h3>Total: {{ notifications.length }}</h3>
          <h3>Não Lidas: {{ unreadCount }}</h3>
        </div>
      </div>

      <!-- Gerador IA -->
      <div class="ai-generator">
        <h2>🤖 Gerar com IA</h2>
        <textarea [(ngModel)]="context" placeholder="Contexto..."></textarea>
        <button (click)="generateContent()" [disabled]="loading">
          {{ loading ? 'Gerando...' : 'Gerar' }}
        </button>
        <div *ngIf="generatedContent">
          <h4>{{ generatedContent.subject }}</h4>
          <p>{{ generatedContent.body }}</p>
          <button (click)="saveGenerated()">Salvar</button>
        </div>
      </div>

      <!-- Lista -->
      <div *ngFor="let n of notifications" class="notification-item">
        <h4>{{ n.subject }}</h4>
        <p>{{ n.name }} - {{ n.email }}</p>
        <button *ngIf="!n.read_at" (click)="markAsRead(n)">Marcar como lida</button>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  notifications: AppNotification[] = [];
  context = '';
  generatedContent: any = null;
  loading = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read_at).length;
  }

  loadNotifications() {
    this.notificationService.getNotifications().subscribe(response => {
      if (response.success) this.notifications = response.data;
    });
  }

  generateContent() {
    if (!this.context.trim()) return;

    this.loading = true;
    this.notificationService.generateWithAI(this.context).subscribe(response => {
      this.loading = false;
      if (response.success) this.generatedContent = response.data;
    });
  }

  saveGenerated() {
    const notification = {
      name: 'Sistema IA',
      email: 'ia@negramidia.com',
      phone: '11999999999',
      subject: this.generatedContent.subject,
      body: this.generatedContent.body
    };

    this.notificationService.createNotification(notification).subscribe(response => {
      if (response.success) {
        this.loadNotifications();
        this.generatedContent = null;
        this.context = '';
      }
    });
  }

  markAsRead(notification: any) {
    this.notificationService.markAsRead(notification.id).subscribe(() => {
      this.loadNotifications();
    });
  }
}
```

### **Configuração de Ambiente Angular**

```typescript
// src/environments/environment.ts (no projeto Angular principal)
export const environment = {
  production: false,
  notifyApiUrl: 'http://localhost:8787' // Esta API local
};

// src/environments/environment.prod.ts (no projeto Angular principal)
export const environment = {
  production: true,
  notifyApiUrl: 'https://negra-midia-notify-api.workers.dev' // Esta API em produção
};
```

### **Casos de Uso Avançados**

1. **Dashboard Admin**: Métricas em tempo real de notificações
2. **Campanhas Automáticas**: IA gera conteúdo baseado em dados de produto
3. **Relatórios Inteligentes**: Resumos automáticos por período
4. **Automação de Marketing**: Notificações baseadas em eventos do sistema
5. **Analytics Personalizados**: Insights de engajamento e performance

## Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento local (D1 local + IA remota)
npm run dev:remote   # Desenvolvimento remoto (tudo na nuvem)
npm run deploy       # Deploy para produção
npm run cf-typegen   # Regenerar tipos TypeScript
npm run d1:setup     # Aplicar schema no banco local
npm run d1:local     # Executar SQL no banco local
```

## 🐛 Troubleshooting

### **Problemas Comuns**

#### **"Binding DB not found"**

```bash
rm -rf .wrangler/
npm run cf-typegen
npm run dev
```

#### **"AI requests failing"**

```bash
npx wrangler auth login
npx wrangler whoami  # Verificar autenticação
```

#### **"Port 8787 already in use"**

```bash
npx wrangler dev --local --port=3000
# Ou matar processo: lsof -ti:8787 | xargs kill -9
```

#### **Schema não aplicado**

```bash
npm run d1:setup
# Verificar: npm run d1:local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Prisma ORM

Esta API foi **migrada de SQL cru para Prisma ORM** para oferecer:

### **Vantagens do Prisma:**

- **Type Safety**: Tipos automáticos baseados no schema
- **IntelliSense**: Autocompletar em todas as queries
- **Prevenção de SQL Injection**: Queries seguras por padrão
- **Migrações**: Controle de versão do schema
- **Studio**: Interface gráfica para dados
- **Relacionamentos**: Queries relacionais simplificadas

### **Configuração Prisma:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Notification {
  id      Int       @id @default(autoincrement())
  name    String
  email   String
  phone   String
  body    String
  subject String
  sent_at DateTime  @default(now())
  read_at DateTime?

  @@index([sent_at], name: "idx_notifications_sent_at")
  @@index([email], name: "idx_notifications_email")
  @@index([read_at], name: "idx_notifications_read_at")
  @@map("notifications")
}
```

### **Exemplos de Uso:**

**Antes (SQL cru):**

```typescript
const { results } = await db
  .prepare(
    `
  SELECT * FROM notifications 
  WHERE read_at IS NULL 
  ORDER BY sent_at DESC 
  LIMIT ?
`
  )
  .bind(10)
  .all();
```

**Depois (Prisma):**

```typescript
const notifications = await prisma.notification.findMany({
  where: { read_at: null },
  orderBy: { sent_at: 'desc' },
  take: 10
});
```

### **Comandos Principais:**

```bash
# Gerar cliente após mudanças no schema
npm run prisma:generate

# Sincronizar schema com D1 (desenvolvimento)
npm run prisma:push

# Abrir interface gráfica
npm run prisma:studio

# Validar schema
npx prisma validate

# Formatar schema
npx prisma format
```

## Timezone do Brasil (Implementação Robusta)

A API usa **`date-fns-tz`** para gerenciamento automático e seguro de timezone do Brasil:

### **Implementação Robusta Ativa:**

- **Horário de Verão**: Considerado automaticamente
- **America/Sao_Paulo**: Timezone oficial do Brasil
- **Transições DST**: Calculadas automaticamente
- **Schema sem Default**: Controle total manual

### **Funções Principais (CORRIGIDAS):**

```typescript
// src/types.ts
import { utcToZonedTime } from 'date-fns-tz';

// Para obter hora atual do Brasil (simples e confiável)
export const getBrazilTime = (): Date => {
  const now = new Date();
  const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brazilTime;
};

// Para salvar no banco (robusta com date-fns-tz)
export const getBrazilTimeAsUTC = (): Date => {
  const timeZone = 'America/Sao_Paulo';
  const now = new Date();
  const brazilTime = utcToZonedTime(now, timeZone);

  // Criar data UTC com componentes da hora do Brasil
  const adjustedDate = new Date(
    Date.UTC(
      brazilTime.getFullYear(),
      brazilTime.getMonth(),
      brazilTime.getDate(),
      brazilTime.getHours(),
      brazilTime.getMinutes(),
      brazilTime.getSeconds(),
      brazilTime.getMilliseconds()
    )
  );

  return adjustedDate;
};

// Para formatação brasileira
export const formatBrazilTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};
```

### **Segurança e Precisão:**

- **Sem Cálculos Manuais**: Zero chance de erro em offsets
- **IANA Timezone**: `America/Sao_Paulo` é mantido oficialmente
- **Horário de Verão**: UTC-2 e UTC-3 automaticamente
- **Transições**: Mudanças de DST calculadas precisamente

### **Onde é Usado:**

- **POST /notifications** - Criação de notificações
- **GET /notifications/:id** - Auto-marcação como lida
- **PUT /notifications/:id/read** - Marcação manual
- **POST /ai/process-unread** - Marcação em lote pela IA
- **GET /ai/daily-digest** - Processamento de urgentes

### **Configuração Atual:**

Schema configurado para controle total de timezone:

- **Sem `@default(now())`** no campo `sent_at`
- **Definição manual** em todas as operações
- **Controle total** sobre quando e como as datas são definidas

### **Fluxo de Armazenamento:**

1. **Entrada**: Hora atual do Brasil (`getBrazilTime()`)
2. **Conversão**: Brasil → UTC (`getBrazilTimeAsUTC()`)
3. **Armazenamento**: UTC no banco D1
4. **Recuperação**: UTC → Brasil para exibição (`convertUTCToBrazilTime()`)

## Tecnologias

- **[Cloudflare Workers](https://workers.cloudflare.com/)**: Runtime serverless
- **[D1 Database](https://developers.cloudflare.com/d1/)**: SQLite distribuído
- **[Prisma ORM](https://prisma.io/)**: ORM type-safe para D1
- **[Workers AI](https://developers.cloudflare.com/workers-ai/)**: IA nativa (sem chaves)
- **[Hono](https://hono.dev/)**: Framework web rápido e moderno
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática

## Licença

Este projeto está licenciado sob a licença MIT. Ver arquivo `LICENSE` no repositório.

## Contribuição

1. Fork este repositório: [negra-midia-notification](https://github.com/bytesforge-consulting/negra-midia-notification)
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -am 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## Suporte

- **Issues da API**: [GitHub Issues](https://github.com/bytesforge-consulting/negra-midia-notification/issues)
- **Projeto Principal**: [NegraMidia Issues](https://github.com/bytesforge-consulting/NegraMidia/issues)
- **Documentação**: [Cloudflare Docs](https://developers.cloudflare.com/)
- **Comunidade**: [Discord da Cloudflare](https://discord.gg/cloudflaredev)

---

> **Dica**: Esta API é parte de um ecossistema maior. Explore o [projeto principal Angular](https://github.com/bytesforge-consulting/NegraMidia) para ver como tudo se integra!
