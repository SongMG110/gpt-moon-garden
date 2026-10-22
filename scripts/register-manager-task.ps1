param(
    [Parameter(Mandatory=$true)][string]$RuntimeRoot,
    [Parameter(Mandatory=$true)][string]$NodePath
)
$ErrorActionPreference = 'Stop'
$taskName = 'GPTMoonGarden.Manager'
if (-not (Test-Path -LiteralPath $NodePath)) { throw 'Node runtime not found.' }
$runner = Join-Path $RuntimeRoot 'scripts/run-manager.ps1'
if (-not (Test-Path -LiteralPath $runner)) { throw 'Manager runner not found.' }
$userId = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$powershell = Join-Path $env:WINDIR 'System32/WindowsPowerShell/v1.0/powershell.exe'
$arguments = '-NoProfile -WindowStyle Hidden -File "' + $runner + '" -NodePath "' + $NodePath + '"'
$action = New-ScheduledTaskAction -Execute $powershell -Argument $arguments -WorkingDirectory $RuntimeRoot
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
# This is an on-demand task: no logon, timer or boot trigger is registered.
$previous = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($previous -and $previous.State -eq 'Running') { Stop-ScheduledTask -TaskName $taskName }
Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Settings $settings -Description 'GPT Moon Garden local manager. On-demand only; loopback access; no host restart.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output $taskName
