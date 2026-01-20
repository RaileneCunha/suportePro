# Relatório de Análise de Inconsistências - Banco de Dados

**Data da Análise:** 14 de Janeiro de 2026

## Resumo Executivo

A análise do banco de dados identificou **1 inconsistência crítica** e **3 problemas potenciais** que devem ser corrigidos para garantir a integridade dos dados.

---

## 🔴 INCONSISTÊNCIAS CRÍTICAS

### 1. **Profile Duplicado - CRÍTICO**

**Problema:** O usuário `2fb0c6e6-b01a-496f-a83e-7fa3a02ad4f4` possui **2 perfis** na tabela `profiles`:
- Profile ID: 8
- Profile ID: 9

Ambos os perfis têm:
- Role: `customer`
- Preferences: `{}`

**Impacto:** Isso viola a regra de negócio de que cada usuário deve ter apenas um perfil. Pode causar:
- Confusão ao buscar dados do usuário
- Comportamento inesperado na aplicação
- Problemas de integridade referencial

**Solução Recomendada:**
1. Adicionar constraint UNIQUE no campo `user_id` da tabela `profiles`
2. Mesclar os dois perfis ou remover um deles (mantendo apenas o mais recente)

**Query para identificar:**
```sql
SELECT user_id, COUNT(*) as total_profiles, 
       ARRAY_AGG(id) as profile_ids,
       ARRAY_AGG(role) as roles
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;
```

**Query para corrigir:**
```sql
-- Primeiro, adicionar constraint UNIQUE
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Depois, remover duplicatas (manter apenas o ID mais recente)
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id DESC) as rn
    FROM profiles
  ) WHERE rn > 1
);
```

---

## ⚠️ PROBLEMAS POTENCIAIS

### 2. **Falta de Constraint UNIQUE em `profiles.user_id`**

**Problema:** A tabela `profiles` não possui uma constraint UNIQUE no campo `user_id`, permitindo a criação de múltiplos perfis para o mesmo usuário.

**Impacto:** Permite a duplicação de perfis, como visto no problema crítico acima.

**Solução:**
```sql
ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
```

---

### 3. **Tickets sem Mensagens**

**Problema:** Existem **4 tickets** sem nenhuma mensagem associada na tabela `ticket_messages`:

| Ticket ID | Título | Status | Customer ID | Data de Criação |
|-----------|--------|--------|-------------|-----------------|
| 7 | Resetar senha SFC | open | b2eaf3bf-4856-4b3-9177-fc62087c7385 | 2026-01-14 01:03:48 |
| 6 | Erro no sistema | open | b2eaf3bf-4856-4b3-9177-fc62087c7385 | 2026-01-14 00:47:39 |
| 2 | Troca de senha | open | b2eaf3bf-4856-4b3-9177-fc62087c7385 | 2026-01-14 00:00:43 |
| 1 | nann bndnk bd | closed | b2eaf3bf-4856-4b3-9177-fc62087c7385 | 2026-01-13 23:30:03 |

**Impacto:** Dependendo da regra de negócio, isso pode ser normal (tickets recém-criados) ou um problema (tickets sem histórico de comunicação).

**Solução:** Verificar se isso está de acordo com a regra de negócio. Se tickets devem sempre ter mensagens:
```sql
-- Adicionar mensagem inicial ao criar ticket (via aplicação)
-- Ou criar uma mensagem automática do sistema quando o ticket é criado
```

---

### 4. **Usuário sem Perfil**

**Problema:** Existe pelo menos **1 usuário** sem perfil associado na tabela `profiles`:
- User ID: `ef048139-dfdc-4190-9faf-73b9faa9cd97`
- Email: `mail@mail.com`
- Criado em: 2026-01-13 22:15:13

**Impacto:** Se a aplicação sempre espera um perfil para cada usuário, isso pode causar erros em runtime.

**Solução:** Criar perfis automaticamente para usuários existentes ou criar perfil para este usuário específico:
```sql
-- Criar perfil para usuário existente
INSERT INTO profiles (user_id, role, preferences)
VALUES ('ef048139-dfdc-4190-9faf-73b9faa9cd97', 'customer', '{}');
```

---

## ✅ VERIFICAÇÕES REALIZADAS (Sem Problemas Encontrados)

As seguintes verificações foram realizadas e **não apresentaram problemas**:

1. ✅ **Chaves Estrangeiras Órfãs:** Todas as foreign keys estão válidas
   - Profiles → Users: OK
   - Tickets → Users (customer_id, assigned_to_id): OK
   - Ticket Messages → Tickets: OK
   - Ticket Messages → Users: OK
   - Articles → Users: OK
   - Messages → Conversations: OK

2. ✅ **Valores NULL em Campos Obrigatórios:** Todos os campos obrigatórios têm valores válidos

3. ✅ **Valores Inválidos em Campos Enum:** Todos os valores estão dentro dos permitidos
   - Status: open, in_progress, resolved, closed
   - Priority: low, medium, high, critical
   - Role: customer, agent, admin
   - Type (ticket_messages): text, system, internal_note

4. ✅ **Duplicação de Emails:** Não há emails duplicados (constraint UNIQUE funcionando)

5. ✅ **Emails Inválidos:** Todos os emails estão em formato válido

6. ✅ **Inconsistências de Datas:** Não há registros onde `created_at > updated_at`

7. ✅ **Strings Vazias:** Não há campos obrigatórios com strings vazias

8. ✅ **Tickets Atribuídos Incorretamente:** Todos os tickets atribuídos são para agentes ou admins

---

## 📊 Estatísticas do Banco de Dados

### Distribuição de Status de Tickets
- `open`: 3 tickets
- `closed`: 2 tickets
- `resolved`: 2 tickets

### Distribuição de Prioridades
- `medium`: 3 tickets
- `critical`: 2 tickets
- `high`: 1 ticket
- `low`: 1 ticket

### Distribuição de Roles
- `agent`: 6 perfis
- `customer`: 2 perfis (mas 1 usuário tem 2 perfis duplicados)
- `admin`: 1 perfil

---

## 🔧 Recomendações de Correção

### Prioridade ALTA (Fazer Imediatamente)
1. ✅ Adicionar constraint UNIQUE em `profiles.user_id`
2. ✅ Remover o perfil duplicado (manter apenas 1 por usuário)
3. ✅ Criar perfil para usuário sem perfil (se aplicável)

### Prioridade MÉDIA (Revisar Regras de Negócio)
1. ⚠️ Decidir se tickets devem sempre ter mensagens
2. ⚠️ Implementar criação automática de perfil ao criar usuário (se necessário)

### Prioridade BAIXA (Melhorias)
1. 💡 Considerar adicionar trigger para criar perfil automaticamente ao criar usuário
2. 💡 Adicionar validações na aplicação para prevenir duplicações

---

## 📝 Queries de Verificação

Para verificar novamente no futuro, execute:

```sql
-- Verificar profiles duplicados
SELECT user_id, COUNT(*) as total
FROM profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Verificar tickets sem mensagens
SELECT t.id, t.title, t.status, t.created_at
FROM tickets t
LEFT JOIN ticket_messages tm ON t.id = tm.ticket_id
WHERE tm.id IS NULL;

-- Verificar usuários sem perfil
SELECT u.id, u.email, u.created_at
FROM users u
LEFT JOIN profiles p ON u.id = p.user_id
WHERE p.id IS NULL;
```

---

**Fim do Relatório**
