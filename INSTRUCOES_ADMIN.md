# Como Tornar Seu Perfil Administrador

## Método 1: Via Console do Navegador (Mais Rápido)

1. Certifique-se de estar logado na aplicação
2. Abra o Console do Desenvolvedor (pressione F12)
3. Cole e execute este código:

```javascript
fetch('/api/profile/make-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('✅ Sucesso!', data);
  alert('Perfil atualizado para administrador! Recarregue a página.');
  location.reload();
})
.catch(err => {
  console.error('❌ Erro:', err);
  alert('Erro ao atualizar perfil. Verifique o console.');
});
```

4. Recarregue a página (F5) após ver a mensagem de sucesso

## Método 2: Via Script (Se você souber seu email)

Execute no terminal:

```bash
tsx script/make-admin.ts seu@email.com
```

## Método 3: Via API PATCH

```bash
curl -X PATCH http://localhost:5000/api/profile \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}' \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

## Verificação

Após atualizar, você deve:
- Ver o link "Técnicos" na sidebar
- Poder acessar `/technicians`
- Poder cadastrar e gerenciar técnicos
