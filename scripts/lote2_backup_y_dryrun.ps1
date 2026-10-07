<#
.SYNOPSIS
  Fase 0 del runbook de lote 2 (issue #100): backup de produccion + dry-run
  del reindexado a multilingual-e5-small. Solo lectura salvo el backup.

.DESCRIPTION
  Este script SOLO hace dos cosas:
    1. Backup completo de la base de produccion (pg_dump -F c), verificando
       que el archivo resultante no quede vacio -- el intento anterior
       (2026-10-06) fallo en silencio porque pg_dump no estaba en el PATH
       de esta maquina y nadie verifico el tamano del archivo resultante.
    2. Dry-run de scripts/reindexar_embeddings.js contra esa misma base,
       para dimensionar cuantas filas habria que reindexar (no escribe nada).

  Las Fases 1-3 (reindexado real, verificacion funcional, flip de
  EMBEDDING_MODEL en Railway) son deliberadamente manuales, comando por
  comando -- ver el runbook completo en el issue #100. Este script NUNCA
  las ejecuta.

  Regla dura de RAG-00 (#79), nunca se salta: "los reindexados los ejecuta
  solo Alejandro, nunca un agente" -- este script esta pensado para que lo
  corras VOS, desde tu propia terminal, no para que lo ejecute un agente.

.PARAMETER ProductionDatabaseUrl
  La DATABASE_URL de produccion (Railway). Nunca se guarda en ningun archivo
  ni se hardcodea -- la pasas vos, explicito, cada vez que corres el script.

.PARAMETER Modelo
  Modelo de embeddings objetivo. Default: Xenova/multilingual-e5-small
  (la configuracion confirmada en #121).

.EXAMPLE
  .\scripts\lote2_backup_y_dryrun.ps1 -ProductionDatabaseUrl "postgresql://usuario:pass@host.railway.internal:5432/railway"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ProductionDatabaseUrl,

    [string]$Modelo = "Xenova/multilingual-e5-small",

    [string]$BackupDir = "."
)

$ErrorActionPreference = "Stop"

function Write-Paso($texto) {
    Write-Host ""
    Write-Host "=== $texto ===" -ForegroundColor Cyan
}

# ── Guard: nunca contra localhost -- este script es para produccion ─────────
$uri = [uri]$ProductionDatabaseUrl
$hostsLocales = @("localhost", "127.0.0.1")
if ($hostsLocales -contains $uri.Host) {
    Write-Host "[lote2] La URL apunta a '$($uri.Host)' -- eso es local, no produccion." -ForegroundColor Red
    Write-Host "[lote2] Este script es para el backup/dry-run de PRODUCCION. Para probar el reindexado localmente, usa scripts/reindexar_embeddings.js directo (sin este wrapper)." -ForegroundColor Red
    exit 1
}

Write-Host "[lote2] Host objetivo: $($uri.Host)" -ForegroundColor Yellow
Write-Host "[lote2] Esto va a leer la base de PRODUCCION de Enel. Confirma explicitamente." -ForegroundColor Yellow
$confirmacion = Read-Host "Escribe 'si, es produccion' para continuar"
if ($confirmacion -ne "si, es produccion") {
    Write-Host "[lote2] Cancelado -- no se escribio ni se leyo nada." -ForegroundColor Yellow
    exit 0
}

# ── Fase 0.1: Backup ─────────────────────────────────────────────────────────
Write-Paso "Backup completo de produccion (pg_dump -F c, via Docker)"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "backup_pre_lote2_rag_$timestamp.dump"
$backupFileAbs = (Resolve-Path -Path $BackupDir).Path + "\backup_pre_lote2_rag_$timestamp.dump"

Write-Host "[lote2] Backup -> $backupFile"
Write-Host "[lote2] Usando el binario pg_dump 18.x empaquetado en la imagen postgres:18-alpine (via Docker) -- evita depender de que pg_dump este instalado en esta maquina (la corrida anterior fallo exactamente por esto, en silencio). El servidor de produccion corre Postgres 18.6, asi que pg_dump debe ser >= esa version (pg_dump 15 aborta por 'server version mismatch')."

# docker run con --network host no aplica en Windows -- se conecta por URL
# completa (host:puerto publico de Railway), no por red local.
docker run --rm -v "${BackupDir}:/backup" postgres:18-alpine `
    pg_dump "$ProductionDatabaseUrl" -F c -f "/backup/backup_pre_lote2_rag_$timestamp.dump"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[lote2] pg_dump devolvio un error (codigo $LASTEXITCODE). ABORTANDO -- no sigas a la Fase 1 sin un backup valido." -ForegroundColor Red
    exit 1
}

# ── Verificacion explicita: el fallo anterior fue un archivo de 0 bytes ─────
if (-not (Test-Path $backupFile)) {
    Write-Host "[lote2] El archivo de backup no se creo. ABORTANDO." -ForegroundColor Red
    exit 1
}
$tamano = (Get-Item $backupFile).Length
if ($tamano -eq 0) {
    Write-Host "[lote2] El backup se creo pero pesa 0 bytes -- exactamente el fallo silencioso del intento anterior (2026-10-06). ABORTANDO, no hay backup valido." -ForegroundColor Red
    Remove-Item $backupFile
    exit 1
}
Write-Host "[lote2] Backup verificado: $backupFile ($([math]::Round($tamano / 1MB, 2)) MB)" -ForegroundColor Green

# ── Fase 0.2: Dry-run del reindexado (solo lectura) ─────────────────────────
Write-Paso "Dry-run de reindexar_embeddings.js contra produccion (solo lectura)"

$env:DATABASE_URL_BACKUP_TEMPORAL = $env:DATABASE_URL
$env:DATABASE_URL = $ProductionDatabaseUrl
try {
    node scripts/reindexar_embeddings.js --modelo $Modelo --dry-run --permitir-host-remoto
}
finally {
    # Restaura la DATABASE_URL local original, incluso si el dry-run falla.
    $env:DATABASE_URL = $env:DATABASE_URL_BACKUP_TEMPORAL
    if (Test-Path Env:\DATABASE_URL_BACKUP_TEMPORAL) {
        Remove-Item Env:\DATABASE_URL_BACKUP_TEMPORAL
    }
}

Write-Paso "Fase 0 completa"
Write-Host "[lote2] Backup: $backupFile" -ForegroundColor Green
Write-Host "[lote2] Revisa el conteo de filas pendientes arriba antes de decidir si reindexar todo de una vez o por categoria." -ForegroundColor Green
Write-Host "[lote2] Siguiente paso: Fase 1 del runbook (issue #100) -- reindexado real, manual, por categoria, comando por comando. Este script no la ejecuta." -ForegroundColor Yellow
