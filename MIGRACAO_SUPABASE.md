# Guia de Migração para Supabase

## Passos para migrar o banco de dados para Supabase

### 1. Criar Projeto no Supabase

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Clique em "New Project"
4. Configure:
   - **Name**: `ticket-system`
   - **Database Password**: (anote esta senha!)
   - **Region**: `South America (São Paulo)`
   - **Pricing Plan**: Free
5. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Obter URL de Conexão

Após criar o projeto:
1. Vá para **Settings** → **Database**
2. Na seção **Connection string**, copie a **Connection string** (URI)
   - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
3. Substitua `[PASSWORD]` pela senha que você criou

### 3. Aplicar Migrações

Use o arquivo SQL criado especialmente para o Supabase:

1. Vá para **SQL Editor** → **New Query**
2. Abra o arquivo `supabase_schema.sql` do projeto
3. Cole todo o conteúdo no editor
4. Execute a query (Run ou Ctrl+Enter)

**OU** você pode usar o MCP do Supabase diretamente (já está preparado)

### 4. Configurar Variáveis de Ambiente

Atualize seu arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres:[SUA_SENHA]@db.[PROJECT-REF].supabase.co:5432/postgres
SESSION_SECRET=sua_chave_secreta_aqui
```

### 5. Para Vercel (Produção)

1. Vá para o painel do Vercel: https://vercel.com/railenes-projects/ticket-system/settings/environment-variables
2. Adicione as variáveis:
   - `DATABASE_URL`: URL completa do Supabase
   - `SESSION_SECRET`: Mesma chave secreta (gere uma nova se necessário)

## Estrutura do Banco de Dados

O banco contém as seguintes tabelas:

- `users` - Usuários do sistema
- `sessions` - Sessões de autenticação
- `profiles` - Perfis de usuários (roles: customer, agent, admin)
- `tickets` - Chamados/tickets
- `ticket_messages` - Mensagens dos tickets
- `articles` - Artigos da base de conhecimento
- `conversations` - Conversas (chat)
- `messages` - Mensagens (chat)
- `contacts` - Contatos
