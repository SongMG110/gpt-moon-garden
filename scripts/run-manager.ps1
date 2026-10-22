param([Parameter(Mandatory=$true)][string]$NodePath)
$ErrorActionPreference = 'Stop'
$runtimeRoot = Split-Path -Parent $PSScriptRoot
$dataRoot = if ($env:MOON_GARDEN_DATA_DIR) { $env:MOON_GARDEN_DATA_DIR } else { Join-Path $env:LOCALAPPDATA 'GPTMoonGarden' }
New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null
Set-Location -LiteralPath $runtimeRoot
$env:MOON_GARDEN_SERVICE = 'windows-task'
& $NodePath (Join-Path $PSScriptRoot 'controller.mjs') --foreground 1>> (Join-Path $dataRoot 'controller.log') 2>> (Join-Path $dataRoot 'controller-error.log')
exit $LASTEXITCODE
