# Resumo da Migração para Supabase

## Status da Preparação ✅

Todos os arquivos necessários foram criados e estão prontos:

1. ✅ **SQL Schema**: `supabase_schema.sql` - SQL completo para criar todas as tabelas
2. ✅ **SESSION_SECRET**: Gerado: `d44309871de9831aa40f4a0f478cf3ec9ae3fbcda43138662cc25f4844b2a203`
3. ✅ **Configuração .env**: Pronta para ser atualizada
4. ✅ **Estrutura do Banco**: Todas as 9 tabelas preparadas

## ⚠️ Limitação da API

A API do MCP do Supabase requer que o projeto já exista para aplicar migrações. Portanto, você precisa:

### Criar o Projeto Manualmente (1 minuto):

1. Acesse: https://supabase.com/dashboard/projects/new
2. Configure:
   - **Name**: `ticket-system`
   - **Database Password**: (escolha uma senha segura e anote!)
   - **Region**: `South America (São Paulo)` ou `sa-east-1`
   - **Pricing Plan**: Free
3. Clique em "Create new project"
4. Aguarde a criação (2-3 minutos)

### Depois que o projeto estiver criado:

**Me informe o PROJECT_ID ou PROJECT_REF** e eu aplicarei:
- ✅ SQL das migrações automaticamente
- ✅ Obter URL de conexão
- ✅ Atualizar arquivo .env local
- ✅ Configurar variáveis na Vercel

## O que já está pronto:

### Arquivo `.env` será atualizado com:
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@db.PROJECT_REF.supabase.co:5432/postgres
SESSION_SECRET=d44309871de9831aa40f4a0f478cf3ec9ae3fbcda43138662cc25f4844b2a203
```

### SQL completo está em:
- `supabase_schema.sql` - 9 tabelas completas

### Tabelas que serão criadas:
1. `users` - Usuários do sistema
2. `sessions` - Sessões de autenticação
3. `profiles` - Perfis (customer, agent, admin)
4. `tickets` - Chamados/tickets
5. `ticket_messages` - Mensagens dos tickets
6. `articles` - Base de conhecimento
7. `conversations` - Conversas (chat)
8. `messages` - Mensagens (chat)
9. `contacts` - Contatos

## Próximos Passos:

1. **Crie o projeto no Supabase** (manual - 1 minuto)
2. **Me envie o PROJECT_REF** (está na URL do projeto: `db.XXXXXXXXX.supabase.co`)
3. **Eu aplico tudo automaticamente** (SQL, .env, Vercel)

OU

Se preferir fazer manualmente:
1. Copie o conteúdo de `supabase_schema.sql`
2. Cole no SQL Editor do Supabase
3. Execute
4. Copie a DATABASE_URL do Settings → Database
5. Atualize o `.env` com a URL e o SESSION_SECRET acima
