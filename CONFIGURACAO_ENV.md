# Configuração do Arquivo .env para Supabase

## Como obter as informações do Supabase

### 1. Acesse o Painel do Supabase

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto `ticket-system`

### 2. Obter DATABASE_URL

1. Vá para **Settings** → **Database**
2. Na seção **Connection string**, copie a **Connection string** (URI)
3. A URL terá o formato:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
   ```
4. **OU** use a string de conexão direta (sem pooler):
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 3. Substituir a senha

- Substitua `[PASSWORD]` pela senha do banco de dados que você definiu ao criar o projeto
- Se esqueceu a senha, você pode redefini-la em **Settings** → **Database** → **Reset Database Password**

### 4. Exemplo de DATABASE_URL final

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## Arquivo .env completo

Crie ou atualize o arquivo `.env` na raiz do projeto com:

```env
# URL de conexão com o banco de dados Supabase
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@db.abcdefghijklmnop.supabase.co:5432/postgres

# Chave secreta para sessões (gere uma string aleatória segura)
SESSION_SECRET=sua_chave_secreta_aqui_gere_uma_string_aleatoria_segura

# Opcional: Chaves da API Gemini (para funcionalidades de IA)
# GEMINI_API_KEY=sua_chave_aqui

# Opcional: Chaves da API OpenAI (se usar)
# AI_INTEGRATIONS_OPENAI_API_KEY=sua_chave_aqui
# AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

## Gerar SESSION_SECRET seguro

Execute no terminal:

```bash
# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Linux/Mac
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Configurar na Vercel (Produção)

Se você fez deploy na Vercel:

1. Acesse: https://vercel.com/railenes-projects/ticket-system/settings/environment-variables
2. Adicione as seguintes variáveis:

   - **Key**: `DATABASE_URL`
   - **Value**: A mesma URL do Supabase (da seção acima)

   - **Key**: `SESSION_SECRET`
   - **Value**: A mesma chave secreta que você gerou

   - **Key**: `NODE_ENV`
   - **Value**: `production` (já deve estar configurado)

3. Clique em **Save** para cada variável
4. **Importante**: Após adicionar as variáveis, você precisa fazer um novo deploy:
   ```bash
   vercel --prod
   ```

## Verificar se está funcionando

1. Após configurar o `.env`, execute localmente:
   ```bash
   npm run dev
   ```

2. Tente fazer login ou criar uma conta
3. Se funcionar, o banco está configurado corretamente!

## Troubleshooting

### Erro: "DATABASE_URL must be set"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Verifique se a variável `DATABASE_URL` está escrita corretamente
- Certifique-se de que não há espaços extras antes ou depois do `=`

### Erro: "password authentication failed"
- Verifique se a senha no `DATABASE_URL` está correta
- Certifique-se de que não há caracteres especiais que precisem ser codificados (URL encode)
- Tente redefinir a senha do banco no Supabase

### Erro: "connection refused" ou "timeout"
- Verifique se o projeto do Supabase está ativo (não pausado)
- Verifique se a URL está correta
- Tente usar a URL do pooler ao invés da direta (ou vice-versa)

### Erro: "relation does not exist"
- As tabelas ainda não foram criadas
- Execute o SQL do arquivo `supabase_schema.sql` no SQL Editor do Supabase
