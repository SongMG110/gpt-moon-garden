param([string]$AppPath, [ValidateRange(1024,65535)][int]$Port = 9335)
$ErrorActionPreference = 'Continue'

# Moon Garden - Store (Appx) Codex adapter
# Direct Start-Process hits ACL on protected WindowsApps, and explorer/shell:AppsFolder
# activation does not forward debug arguments to the Store sandbox.
# The working method is the COM ApplicationActivationManager (IApplicationActivationManager
# ActivateApplication), which starts the registered Store package WITH command-line arguments.
# This is the same approach used by Codex-Dream-Skin.

$appRunning = Get-Process -Name 'ChatGPT','Codex' -ErrorAction SilentlyContinue
if ($appRunning) {
    Write-Output 'Codex/ChatGPT is already running. No process was stopped or restarted.'
    Write-Output 'Finish the current task and close the app normally. Then run this launcher.'
    exit 2
}

$pkg = Get-AppxPackage -Name 'OpenAI.Codex' -ErrorAction SilentlyContinue | Sort-Object Version -Descending | Select-Object -First 1

function Initialize-MoonPackageLauncher {
    if ('MoonGarden.PackageLauncher' -as [type]) { return }
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
namespace MoonGarden {
  [Flags]
  internal enum ActivateOptions : uint {
    None = 0
  }
  [ComImport]
  [Guid("2e941141-7f97-4756-ba1d-9decde894a3d")]
  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  internal interface IApplicationActivationManager {
    [PreserveSig]
    int ActivateApplication(
      [MarshalAs(UnmanagedType.LPWStr)] string appUserModelId,
      [MarshalAs(UnmanagedType.LPWStr)] string arguments,
      ActivateOptions options,
      out uint processId);
  }
  [ComImport]
  [Guid("45ba127d-10a8-46ea-8ab7-56ea9078943c")]
  internal class ApplicationActivationManager {}
  public static class PackageLauncher {
    public static uint Launch(string appUserModelId, string arguments) {
      var manager = (IApplicationActivationManager)new ApplicationActivationManager();
      try {
        uint processId;
        int result = manager.ActivateApplication(
          appUserModelId,
          arguments ?? string.Empty,
          ActivateOptions.None,
          out processId);
        Marshal.ThrowExceptionForHR(result);
        return processId;
      } finally {
        if (Marshal.IsComObject(manager)) Marshal.FinalReleaseComObject(manager);
      }
    }
  }
}
'@
}

# 1) Store version path: COM package activation with debug arguments
if ($pkg) {
    $pfn = $pkg.PackageFamilyName
    $aumid = "$pfn!App"
    $debugArgs = "--remote-debugging-address=127.0.0.1 --remote-debugging-port=$Port"

    $launched = $false
    try {
        Initialize-MoonPackageLauncher
        $procId = [MoonGarden.PackageLauncher]::Launch($aumid, $debugArgs)
        Write-Output "Store Codex launched via COM activation (PID $procId) with debug port $Port."
        $launched = $true
    } catch {
        # Fallback: plain shell:AppsFolder activation (no args) as a last resort.
        Write-Output "COM activation failed: $($_.Exception.Message)"
        try {
            Start-Process explorer.exe -ArgumentList "shell:AppsFolder\$aumid" -ErrorAction SilentlyContinue | Out-Null
            $launched = $true
        } catch {
            Write-Output "Store launch fallback failed: $($_.Exception.Message)"
        }
    }

    if (-not $launched) {
        Write-Output 'Unable to start the Store Codex package.'
        exit 3
    }
    Write-Output "Started the app with a local debugging port ($Port). No installation files were changed."
    exit 0
}

# 2) Non-Store version path (original logic)
if (-not $AppPath) {
    $package = Get-AppxPackage -Name OpenAI.Codex | Sort-Object Version -Descending | Select-Object -First 1
    if ($package) { $AppPath = Join-Path $package.InstallLocation 'app/ChatGPT.exe' }
}
if (-not $AppPath -or -not (Test-Path -LiteralPath $AppPath)) { throw 'App not found. Supply -AppPath with the installed ChatGPT.exe path.' }
Start-Process -FilePath $AppPath -ArgumentList @('--remote-debugging-address=127.0.0.1', "--remote-debugging-port=$Port") -WindowStyle Normal
Write-Output "Started the app with a local debugging port ($Port). No installation files were changed."
