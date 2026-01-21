# Script para configurar variáveis de ambiente na Vercel
# Execute: .\config_vercel_env.ps1

$databaseUrl = "postgresql://postgres:yG7eeC4ogXH8hNqB@db.dxrkltzccsxizhjxfwkb.supabase.co:5432/postgres"
$sessionSecret = "d44309871de9831aa40f4a0f478cf3ec9ae3fbcda43138662cc25f4844b2a203"

Write-Host "Configurando variáveis de ambiente na Vercel..." -ForegroundColor Green
Write-Host ""

Write-Host "1. Adicionando DATABASE_URL..." -ForegroundColor Yellow
$databaseUrl | vercel env add DATABASE_URL production

Write-Host ""
Write-Host "2. Adicionando SESSION_SECRET..." -ForegroundColor Yellow  
$sessionSecret | vercel env add SESSION_SECRET production

Write-Host ""
Write-Host "✅ Variáveis de ambiente configuradas!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximo passo: Faça um novo deploy:" -ForegroundColor Cyan
Write-Host "  vercel --prod" -ForegroundColor White
