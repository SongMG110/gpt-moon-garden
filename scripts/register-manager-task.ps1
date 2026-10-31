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
# Stop only an old copy of THIS manager; Task Scheduler can leave its Node child alive.
# Never stop Codex/ChatGPT or unrelated Node processes.
$controller = Join-Path $RuntimeRoot 'scripts/controller.mjs'
$controller = $controller.Replace('/', '\')
$ownedManagers = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.ExecutablePath -ieq $NodePath -and $_.CommandLine -match [regex]::Escape($controller) -and $_.CommandLine -match '--foreground\s*$'
}
foreach ($manager in $ownedManagers) { Stop-Process -Id $manager.ProcessId -ErrorAction Stop }
Register-ScheduledTask -TaskName $taskName -Action $action -Principal $principal -Settings $settings -Description 'GPT Moon Garden local manager. On-demand only; loopback access; no host restart.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Output $taskName
