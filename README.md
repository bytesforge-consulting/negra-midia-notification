# 📱 Negra Mídia Notify API

API serverless para sistema de notificações com IA integrada, construída com Cloudflare Workers, D1 Database e Workers AI.

> **🔗 Repositórios do Ecossistema:**
> - **🎯 Este Projeto (API):** [negra-midia-notification](https://github.com/bytesforge-consulting/negra-midia-notification)
> - **🏠 Projeto Principal (Angular):** [NegraMidia](https://github.com/bytesforge-consulting/NegraMidia) - Plataforma completa de Marketing Digital

## 🎯 Visão Geral

Esta API oferece:
- **📊 Gerenciamento de notificações** com CRUD completo
- **🤖 IA integrada** para geração automática de conteúdo
- **⚡ Performance edge** com Cloudflare Workers
- **🗄️ Banco D1** distribuído globalmente
- **🔄 CORS dinâmico** configurável por ambiente

### 🏗️ Arquitetura do Ecossistema

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

## 🚀 Início Rápido

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
- `GET /notifications/:id` - Buscar notificação por ID (marca como lida)
- `POST /notifications` - Criar nova notificação
- `PUT /notifications/:id/read` - Marcar como lida manualmente

#### **🤖 IA (Workers AI)**
- `POST /ai/generate` - Geração livre de texto
- `POST /ai/generate-notification` - Gerar notificação automaticamente
- `POST /ai/summarize-notifications` - Resumir notificações por período
- `GET /ai/models` - Listar modelos disponíveis

### 🔧 Configuração

#### **Configuração CORS via Variáveis de Ambiente**

Todas as configurações de CORS vêm diretamente das variáveis de ambiente. Edite `wrangler.jsonc`:

```jsonc
{
  "vars": {
    // Origens permitidas (separadas por vírgula, * para todas, suporte a wildcards)
    "ALLOWED_ORIGINS": "http://localhost:4200,https://negramidia.com,https://*.negramidia.com",
    
    // Permitir credenciais (cookies, headers de auth)
    "CORS_CREDENTIALS": "true",
    
    // Cache do preflight em segundos
    "CORS_MAX_AGE": "86400",
    
    // Métodos HTTP permitidos
    "CORS_METHODS": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
    
    // Headers permitidos
    "CORS_HEADERS": "Content-Type,Authorization,X-Requested-With,X-API-Key,Accept",
    
    // Ambiente (para logs de debug)
    "ENVIRONMENT": "development"
  }
}
```

**Configurações por Ambiente:**

```jsonc
// 🏠 Desenvolvimento
{
  "ALLOWED_ORIGINS": "*",
  "CORS_CREDENTIALS": "false",
  "ENVIRONMENT": "development"
}

// 🚀 Produção  
{
  "ALLOWED_ORIGINS": "https://negramidia.com,https://app.negramidia.com,https://admin.negramidia.com",
  "CORS_CREDENTIALS": "true",
  "ENVIRONMENT": "production"
}

// 🧪 Staging
{
  "ALLOWED_ORIGINS": "https://staging.negramidia.com,http://localhost:4200",
  "CORS_CREDENTIALS": "true", 
  "ENVIRONMENT": "staging"
}
```

**Recursos Avançados:**

- ✅ **Wildcards**: `https://*.negramidia.com` permite todos os subdomínios
- ✅ **Debug logs**: Ativados em `ENVIRONMENT=development`
- ✅ **Fallbacks**: Configurações padrão se variáveis não estiverem definidas
- ✅ **Validação robusta**: Suporte a múltiplos formatos de origem

### 🏠 Desenvolvimento Local

#### **✅ Acesso Local a IA e D1 - Sim, funciona!**

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

# Aplicar schema no banco local
npm run d1:setup

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

### 🚀 Deploy para Produção

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
    "binding": "AI"  // Simples assim!
  }
}
```

**✅ Vantagens:**
- Sem chaves de API
- Billing integrado Cloudflare
- Latência baixa (edge)
- Setup zero

#### **Modelos Disponíveis**

| Modelo | Tipo | Uso Recomendado |
|--------|------|-----------------|
| `@cf/meta/llama-3.1-8b-instruct` | Chat | Conversação geral, conteúdo longo |
| `@cf/microsoft/phi-2` | Chat | Respostas rápidas, conteúdo curto |
| `@cf/mistral/mistral-7b-instruct-v0.1` | Chat | Multilíngue, ótimo para PT-BR |

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

### 🔧 Estrutura do Projeto

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
├── README.md                # 📖 Documentação completa (este arquivo)
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
      context, type, tone: 'friendly', language: 'pt-BR'
    });
  }

  summarizeNotifications(notifications: AppNotification[], timeframe: string = 'week'): Observable<any> {
    return this.http.post(`${this.apiUrl}/ai/summarize-notifications`, {
      notifications, timeframe
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

  ngOnInit() { this.loadNotifications(); }

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

## 🛠️ Scripts Disponíveis

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

## 🚀 Tecnologias

- **[Cloudflare Workers](https://workers.cloudflare.com/)**: Runtime serverless
- **[D1 Database](https://developers.cloudflare.com/d1/)**: SQLite distribuído
- **[Workers AI](https://developers.cloudflare.com/workers-ai/)**: IA nativa (sem chaves)
- **[Hono](https://hono.dev/)**: Framework web rápido e moderno
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Ver arquivo `LICENSE` no repositório.

## 🤝 Contribuição

1. Fork este repositório: [negra-midia-notification](https://github.com/bytesforge-consulting/negra-midia-notification)
2. Crie uma branch para sua feature: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -am 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📞 Suporte

- **Issues da API**: [GitHub Issues](https://github.com/bytesforge-consulting/negra-midia-notification/issues)
- **Projeto Principal**: [NegraMidia Issues](https://github.com/bytesforge-consulting/NegraMidia/issues)
- **Documentação**: [Cloudflare Docs](https://developers.cloudflare.com/)
- **Comunidade**: [Discord da Cloudflare](https://discord.gg/cloudflaredev)

---

> 💡 **Dica**: Esta API é parte de um ecossistema maior. Explore o [projeto principal Angular](https://github.com/bytesforge-consulting/NegraMidia) para ver como tudo se integra!