param([string]$AppPath, [ValidateRange(1024,65535)][int]$Port = 9335)
$ErrorActionPreference='Stop'
if (Get-Process -Name ChatGPT -ErrorAction SilentlyContinue) {
    Write-Output 'Codex/ChatGPT is already running. No process was stopped or restarted.'
    Write-Output 'Finish the current task and close the app normally. Then run this launcher.'
    exit 2
}
if (-not $AppPath) {
    $package = Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1
    if ($package) { $AppPath = Join-Path $package.InstallLocation 'app/ChatGPT.exe' }
}
if (-not $AppPath -or -not (Test-Path -LiteralPath $AppPath)) { throw 'App not found. Supply -AppPath with the installed ChatGPT.exe path.' }
Start-Process -FilePath $AppPath -ArgumentList @('--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$Port") -WindowStyle Normal
Write-Output "Started the app with a local debugging port ($Port). No installation files were changed."
