# SupportPro - Sistema de Controle de Chamados

Sistema de Help Desk / Service Desk para gerenciamento de tickets de suporte.

## 📋 Pré-requisitos

- **Node.js** (versão 20 ou superior)
- **PostgreSQL** (versão 16 ou superior)
- **npm** ou **yarn**

## 🚀 Como Iniciar o Projeto

### 1. Instalar Dependências

```bash
cd Ticket-System
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (`Ticket-System/.env`) com as seguintes variáveis:

```env
# Obrigatório: URL de conexão com o banco de dados PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/nome_do_banco

# Obrigatório: Chave secreta para sessões (gere uma string aleatória)
SESSION_SECRET=sua_chave_secreta_aqui

# Nota: A autenticação agora é local (email/senha)
# Não é necessário configurar OAuth ou provedores externos
# Os usuários podem se registrar diretamente na aplicação

# Opcional: Chaves da API OpenAI (para funcionalidades de IA)
# AI_INTEGRATIONS_OPENAI_API_KEY=sua_chave_aqui
# AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

**Nota:** Para gerar um `SESSION_SECRET` seguro, você pode usar:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Configurar o Banco de Dados

Certifique-se de que o PostgreSQL está rodando e crie um banco de dados:

```sql
CREATE DATABASE nome_do_banco;
```

### 4. Executar Migrações do Banco de Dados

```bash
npm run db:push
```

Este comando criará todas as tabelas necessárias no banco de dados.

### 5. Iniciar o Servidor de Desenvolvimento

**No Windows (PowerShell):**
```powershell
$env:NODE_ENV="development"; npm run dev
```

**No Windows (CMD):**
```cmd
set NODE_ENV=development && npm run dev
```

**No Linux/Mac:**
```bash
npm run dev
```

O servidor será iniciado na porta **5000** (ou na porta definida pela variável `PORT`).

### 6. Acessar a Aplicação

Abra seu navegador e acesse:
```
http://localhost:3000
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Compila o projeto para produção
- `npm run start` - Inicia o servidor em modo produção (após build)
- `npm run check` - Verifica erros de TypeScript
- `npm run db:push` - Executa migrações do banco de dados

## 🏗️ Estrutura do Projeto

```
Ticket-System/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Código compartilhado (tipos, schemas)
└── script/          # Scripts de build
```

## 🔧 Solução de Problemas

### Erro: "DATABASE_URL must be set"
- Verifique se o arquivo `.env` existe e contém a variável `DATABASE_URL`
- Certifique-se de que o PostgreSQL está rodando

### Erro ao executar migrações
- Verifique se o banco de dados existe
- Confirme que as credenciais em `DATABASE_URL` estão corretas
- Verifique se o usuário tem permissões para criar tabelas

### Porta já em uso
- Altere a variável `PORT` no arquivo `.env` ou no sistema
- Ou pare o processo que está usando a porta 5000

## 📚 Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Banco de Dados:** PostgreSQL, Drizzle ORM
- **Autenticação:** Replit Auth (OpenID Connect)
- **IA:** OpenAI API (opcional)
