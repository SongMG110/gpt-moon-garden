param([Parameter(Mandatory=$true)][string]$RuntimeRoot)
$ErrorActionPreference = 'Stop'
$desktop = [Environment]::GetFolderPath('DesktopDirectory')
if (-not $desktop) { Write-Output 'Desktop folder unavailable; use Launch-installed.cmd.'; exit 0 }
$linkPath = Join-Path $desktop 'GPT Moon Garden.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($linkPath)
if ((Test-Path -LiteralPath $linkPath) -and $shortcut.Description -ne 'GPT Moon Garden theme launcher') {
    Write-Output 'An unrelated shortcut already has this name; left unchanged.'
    exit 0
}
$shortcut.TargetPath = $env:ComSpec
$shortcut.Arguments = '/c ""' + (Join-Path $RuntimeRoot 'Enable.cmd') + '""'
$shortcut.WorkingDirectory = $RuntimeRoot
$shortcut.Description = 'GPT Moon Garden theme launcher'
$shortcut.WindowStyle = 1
$shortcut.Save()
Write-Output $linkPath
