# Arranca la API de VictoriaX al iniciar sesión en Windows.
# Espera a que MySQL (Docker, puerto 3307) acepte conexiones y luego ejecuta `npm start`.
# Lo usa la tarea programada "VictoriaX API".
$Host.UI.RawUI.WindowTitle = "VictoriaX API"
Set-Location (Split-Path $PSScriptRoot -Parent)

$deadline = (Get-Date).AddMinutes(5)
while ((Get-Date) -lt $deadline) {
  $mysql = Test-NetConnection 127.0.0.1 -Port 3307 -InformationLevel Quiet -WarningAction SilentlyContinue
  if ($mysql) { break }
  Write-Host "Esperando a MySQL en 127.0.0.1:3307..."
  Start-Sleep -Seconds 5
}

$inUse = Get-NetTCPConnection -State Listen -LocalPort 3001 -ErrorAction SilentlyContinue
if ($inUse) {
  Write-Host "Ya hay algo escuchando en el puerto 3001; no se inicia otra API."
  exit 0
}

npm start
