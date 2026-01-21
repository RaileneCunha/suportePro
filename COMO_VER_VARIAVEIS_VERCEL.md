# Como Ver as Variáveis de Ambiente no Vercel

## 📍 Localização Correta

As variáveis que configurei estão no **projeto específico**, não no time. Para visualizá-las:

### Opção 1: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/railenes-projects/ticket-system/settings/environment-variables
2. Você verá todas as 6 variáveis configuradas:
   - DATABASE_URL
   - SESSION_SECRET
   - GLPI_APP_TOKEN
   - GLPI_AUTH_TOKEN
   - GLPI_API_URL
   - GEMINI_API_KEY

**⚠️ Importante:** Não confunda com a página de variáveis compartilhadas do time!

### Opção 2: Via CLI

```bash
vercel env ls production
```

## 🔍 Status Atual

Todas as 6 variáveis estão configuradas para **Production**. 

Se você quer que estejam também disponíveis para Preview e Development, posso adicionar.
