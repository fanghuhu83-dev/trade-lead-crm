param(
    [switch]$Hidden
)

$PROJECT_ROOT = "D:\CodexProjects\市场分析项目"
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$LOG_FILE = Join-Path $PROJECT_ROOT "app.log"

$backendProcess = $null
$frontendProcess = $null
$running = $true

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] $Message"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line -ErrorAction SilentlyContinue
}

function Start-Backend {
    param()
    $pythonCmd = "python"
    # Try common Python paths
    $pythonPaths = @(
        "python",
        "python3",
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python314\python.exe",
        "C:\Program Files\Python312\python.exe"
    )
    foreach ($p in $pythonPaths) {
        try {
            $ver = & $p --version 2>&1
            if ($LASTEXITCODE -eq 0 -and $ver -match "Python") {
                $pythonCmd = $p
                break
            }
        } catch { continue }
    }

    Write-Log "Starting backend with: $pythonCmd"
    $script:backendProcess = Start-Process -FilePath $pythonCmd -ArgumentList "app.py" -WorkingDirectory $BACKEND_DIR -NoNewWindow -PassThru
    Write-Log "Backend started (PID: $($script:backendProcess.Id))"
}

function Start-Frontend {
    param()
    $nodeCmd = "C:\Program Files\nodejs\node.exe"
    $vitePath = Join-Path $FRONTEND_DIR "node_modules\vite\bin\vite.js"
    if (-not (Test-Path $vitePath)) {
        Write-Log "Vite not found at $vitePath, running npm install..."
        Set-Location $FRONTEND_DIR
        & $nodeCmd (Join-Path $FRONTEND_DIR "node_modules\npm\bin\npm-cli.js") install 2>&1 | Out-Null
    }
    Write-Log "Starting frontend with: $nodeCmd $vitePath"
    $script:frontendProcess = Start-Process -FilePath $nodeCmd -ArgumentList $vitePath -WorkingDirectory $FRONTEND_DIR -NoNewWindow -PassThru
    Write-Log "Frontend started (PID: $($script:frontendProcess.Id))"
}

function Cleanup {
    Write-Log "Shutting down services..."
    if ($script:frontendProcess -and -not $script:frontendProcess.HasExited) {
        Stop-Process -Id $script:frontendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Log "Frontend process stopped"
    }
    if ($script:backendProcess -and -not $script:backendProcess.HasExited) {
        Stop-Process -Id $script:backendProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Log "Backend process stopped"
    }
    # Also kill any orphaned processes on our ports
    Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    $script:running = $false
    Write-Log "All services stopped"
}

# Register Ctrl+C handler
[Console]::TreatControlCAsInput = $true
$consoleEvent = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Cleanup }

# Main loop
Write-Log "=== Trade Lead System Starting ==="
Write-Log "Project root: $PROJECT_ROOT"

Start-Backend
Start-Frontend

# Monitor loop - auto-restart on crash
while ($script:running) {
    if ($script:backendProcess -and $script:backendProcess.HasExited) {
        Write-Log "Backend crashed (exit code: $($script:backendProcess.ExitCode)), restarting in 3s..."
        Start-Sleep -Seconds 3
        Start-Backend
    }
    if ($script:frontendProcess -and $script:frontendProcess.HasExited) {
        Write-Log "Frontend crashed (exit code: $($script:frontendProcess.ExitCode)), restarting in 3s..."
        Start-Sleep -Seconds 3
        Start-Frontend
    }
    Start-Sleep -Milliseconds 500

    # Check for Ctrl+C
    if ([Console]::KeyAvailable) {
        $key = [Console]::ReadKey($true)
        if ($key.Modifiers -band [ConsoleModifiers]"Control" -and $key.Key -eq "C") {
            Cleanup
            break
        }
    }
}

# If we exit, ensure cleanup
Cleanup
Unregister-Event -SourceIdentifier PowerShell.Exiting -ErrorAction SilentlyContinue
