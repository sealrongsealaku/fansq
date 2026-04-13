$base = "C:\Program Files\MySQL\MySQL Server 8.4"
$config = "C:\ProgramData\MySQL\MySQL Server 8.4\my.ini"
$stdout = "D:\FanSQ\mysql-stdout.log"
$stderr = "D:\FanSQ\mysql-stderr.log"

if (Get-Process mysqld -ErrorAction SilentlyContinue) {
  Write-Host "MySQL is already running."
  exit 0
}

Start-Process `
  -FilePath "$base\bin\mysqld.exe" `
  -ArgumentList @("--defaults-file=`"$config`"", "--console") `
  -RedirectStandardOutput $stdout `
  -RedirectStandardError $stderr `
  -WindowStyle Hidden

Start-Sleep -Seconds 3

if (Get-Process mysqld -ErrorAction SilentlyContinue) {
  Write-Host "MySQL started successfully."
} else {
  Write-Host "MySQL failed to start. Check mysql-stderr.log"
  exit 1
}

