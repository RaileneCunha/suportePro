# Configuração das Variáveis na Vercel - FINALIZAÇÃO

## ✅ O que já foi feito:

1. ✅ **Migrações aplicadas no Supabase**
   - Todas as 9 tabelas criadas com sucesso
   - Estrutura completa do banco de dados pronta

2. ✅ **Arquivo .env local atualizado**
   - `DATABASE_URL` configurada com Supabase
   - `SESSION_SECRET` atualizado

## 🔧 Configurar Variáveis na Vercel (IMPORTANTE):

Você precisa adicionar as variáveis de ambiente na Vercel manualmente:

### Opção 1: Via Dashboard da Vercel (Recomendado)

1. Acesse: https://vercel.com/railenes-projects/ticket-system/settings/environment-variables

2. Adicione as seguintes variáveis:

   **Variável 1:**
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://postgres:yG7eeC4ogXH8hNqB@db.dxrkltzccsxizhjxfwkb.supabase.co:5432/postgres`
   - **Environments**: Marque `Production`, `Preview` e `Development`
   - **Sensitive**: Sim (marque como sensível)
   - Clique em **Save**

   **Variável 2:**
   - **Key**: `SESSION_SECRET`
   - **Value**: `d44309871de9831aa40f4a0f478cf3ec9ae3fbcda43138662cc25f4844b2a203`
   - **Environments**: Marque `Production`, `Preview` e `Development`
   - **Sensitive**: Sim (marque como sensível)
   - Clique em **Save**

3. **Após adicionar**, faça um novo deploy:
   ```bash
   vercel --prod
   ```

### Opção 2: Via Script PowerShell (Automático)

Execute o script criado automaticamente:

```powershell
.\config_vercel_env.ps1
```

O script pedirá confirmação para marcar como sensíveis (responda `y` para ambos).

### Opção 3: Via CLI Manual

Execute os seguintes comandos no terminal:

```bash
# Adicionar DATABASE_URL (responda 'y' quando perguntar se é sensível)
echo postgresql://postgres:yG7eeC4ogXH8hNqB@db.dxrkltzccsxizhjxfwkb.supabase.co:5432/postgres | vercel env add DATABASE_URL production

# Adicionar SESSION_SECRET (responda 'y' quando perguntar se é sensível)
echo d44309871de9831aa40f4a0f478cf3ec9ae3fbcda43138662cc25f4844b2a203 | vercel env add SESSION_SECRET production
```

## ✅ Resumo da Configuração:

- **Project ID Supabase**: `dxrkltzccsxizhjxfwkb`
- **URL do Banco**: `postgresql://postgres:yG7eeC4ogXH8hNqB@db.dxrkltzccsxizhjxfwkb.supabase.co:5432/postgres`
- **SESSION_SECRET**: `d44309871de9831aa40f4a0f478cf3ec9ae3fbcda43138662cc25f4844b2a203`
- **Tabelas Criadas**: 9 tabelas (users, sessions, profiles, tickets, ticket_messages, articles, conversations, messages, contacts)

## 🎉 Próximos Passos:

1. Configure as variáveis na Vercel (acima)
2. Faça um novo deploy: `vercel --prod`
3. Teste a aplicação: https://ticket-system-blond.vercel.app
4. A aplicação agora está usando o Supabase! 🚀
