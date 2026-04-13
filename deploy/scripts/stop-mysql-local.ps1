$processes = Get-Process mysqld -ErrorAction SilentlyContinue

if (-not $processes) {
  Write-Host "MySQL is not running."
  exit 0
}

$processes | Stop-Process -Force
Write-Host "MySQL stopped."
