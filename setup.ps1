#!/usr/bin/env pwsh
# ============================================================
#  Blockchain Credential Verification DApp - Setup Script
#  Run this once on a fresh machine to install all dependencies,
#  compile contracts, start the local blockchain, deploy, and
#  launch the frontend dev server.
# ============================================================

param(
    [switch]$SkipNodeCheck,
    [switch]$InstallOnly,       # Only install deps, don't start services
    [switch]$DeployOnly         # Only deploy contracts (assumes node is running)
)

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

# In PowerShell 7+, native command stderr can be promoted to terminating errors.
# We handle failures via explicit $LASTEXITCODE checks instead.
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

# -- Colours & helpers ----------------------------------------
function Write-Step {
    param([string]$msg)
    Write-Host "`n> $msg" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$msg)
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Warn {
    param([string]$msg)
    Write-Host "  [WARN] $msg" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$msg)
    Write-Host "  [ERROR] $msg" -ForegroundColor Red
}

function Invoke-NativeSafe {
    param(
        [ScriptBlock]$Command,
        [string]$FailureMessage
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $Command
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }

    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)"
    }
}

# -- 1. Pre-requisite checks ---------------------------------
Write-Step "Checking pre-requisites..."

# Node.js
if (-not $SkipNodeCheck) {
    try {
        $nodeVersion = (node --version) 2>&1
        Write-Ok "Node.js found: $nodeVersion"
        
        # Check minimum version (v18+)
        $major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($major -lt 18) {
            Write-Err "Node.js v18 or higher is required. Found: $nodeVersion"
            Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
    }
    catch {
        Write-Err "Node.js is not installed or not in PATH."
        Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# npm
try {
    $npmVersion = (npm --version) 2>&1
    Write-Ok "npm found: v$npmVersion"
}
catch {
    Write-Err "npm is not installed or not in PATH."
    exit 1
}

# Git (optional but nice to check)
try {
    $gitVersion = (git --version) 2>&1
    Write-Ok "Git found: $gitVersion"
}
catch {
    Write-Warn "Git not found - not critical but recommended."
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  DApp Certificate Verification - Setup"     -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

# -- 2. Install Smart-Contract dependencies -------------------
Write-Step "Installing smart-contract dependencies..."
Push-Location "$ROOT\smart-contracts"
try {
    Invoke-NativeSafe -FailureMessage "Failed to install smart-contract dependencies." -Command {
        npm install 2>&1 | Out-Null
    }
    Write-Ok "smart-contracts/node_modules installed."
}
catch {
    Write-Err "Failed to install smart-contract dependencies."
    Pop-Location
    exit 1
}
Pop-Location

# -- 3. Install Frontend dependencies -------------------------
Write-Step "Installing frontend dependencies..."
Push-Location "$ROOT\frontend"
try {
    Invoke-NativeSafe -FailureMessage "Failed to install frontend dependencies." -Command {
        npm install 2>&1 | Out-Null
    }
    Write-Ok "frontend/node_modules installed."
}
catch {
    Write-Err "Failed to install frontend dependencies."
    Pop-Location
    exit 1
}
Pop-Location

# -- 4. Compile Solidity contracts ----------------------------
Write-Step "Compiling Solidity smart contracts..."
Push-Location "$ROOT\smart-contracts"
try {
    Invoke-NativeSafe -FailureMessage "Contract compilation failed." -Command {
        npx hardhat compile 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    }
    Write-Ok "Contracts compiled successfully."
}
catch {
    Write-Err "Contract compilation failed. Check Solidity errors above."
    Pop-Location
    exit 1
}
Pop-Location

# -- 5. Copy ABI to frontend ---------------------------------
Write-Step "Copying contract ABI to frontend..."
$abiSource = "$ROOT\smart-contracts\artifacts\contracts\CredentialSBT.sol\CredentialSBT.json"
$abiDest   = "$ROOT\frontend\src\app\CredentialSBT.json"

if (Test-Path $abiSource) {
    Copy-Item -Path $abiSource -Destination $abiDest -Force
    Write-Ok "ABI copied to frontend/src/app/CredentialSBT.json"
}
else {
    Write-Warn "ABI file not found at expected path. You may need to copy it manually."
    Write-Host "  Expected: $abiSource" -ForegroundColor DarkGray
}

if ($InstallOnly) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  Dependencies installed successfully!"       -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Start local blockchain:  cd smart-contracts && npx hardhat node"
    Write-Host "  2. Deploy contracts:        cd smart-contracts && npx hardhat run scripts/deploy.js --network localhost"
    Write-Host "  3. Update CONTRACT_ADDRESS in frontend/src/app/issuer/page.tsx, portfolio/page.tsx, verify/page.tsx"
    Write-Host "  4. Start frontend:          cd frontend && npm run dev"
    Write-Host "  5. Open http://localhost:3000 in your browser"
    Write-Host ""
    exit 0
}

# -- 6. Start Hardhat local blockchain node -------------------
Write-Step "Starting Hardhat local blockchain node..."
$hardhatJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npx hardhat node 2>&1
} -ArgumentList "$ROOT\smart-contracts"

Write-Ok "Hardhat node starting in background (Job ID: $($hardhatJob.Id))..."
Write-Host "  Waiting 8 seconds for the node to initialise..." -ForegroundColor DarkGray
Start-Sleep -Seconds 8

# Verify the node is running
$jobState = $hardhatJob.State
if ($jobState -eq "Running") {
    Write-Ok "Hardhat node is running."
}
else {
    Write-Err "Hardhat node failed to start. Check output:"
    Receive-Job $hardhatJob | Write-Host
    exit 1
}

# -- 7. Deploy contracts --------------------------------------
Write-Step "Deploying CredentialSBT contract to local network..."
Push-Location "$ROOT\smart-contracts"
try {
    $deployOutput = Invoke-NativeSafe -FailureMessage "Deployment failed." -Command {
        npx hardhat run scripts/deploy.js --network localhost 2>&1
    }
    $deployOutput | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    
    # Try to extract the contract address from deploy output
    $addressMatch = $deployOutput | Select-String -Pattern '0x[a-fA-F0-9]{40}' | Select-Object -First 1
    if ($addressMatch) {
        $contractAddr = ($addressMatch.Matches[0].Value)
        Write-Ok "Contract deployed at: $contractAddr"
        Write-Host ""
        Write-Warn "ACTION REQUIRED: Update CONTRACT_ADDRESS in these frontend files:" 
        Write-Host "    - frontend/src/app/issuer/page.tsx"    -ForegroundColor Yellow
        Write-Host "    - frontend/src/app/portfolio/page.tsx"  -ForegroundColor Yellow
        Write-Host "    - frontend/src/app/verify/page.tsx"     -ForegroundColor Yellow
        Write-Host "  Replace the address with: $contractAddr"  -ForegroundColor Yellow
    }
}
catch {
    Write-Err "Deployment failed. Is the Hardhat node running?"
    Pop-Location
    exit 1
}
Pop-Location

# -- 8. Start Frontend dev server -----------------------------
Write-Step "Starting Next.js frontend dev server..."
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList "$ROOT\frontend"

Write-Ok "Frontend dev server starting in background (Job ID: $($frontendJob.Id))..."
Start-Sleep -Seconds 5

# -- 9. Summary -----------------------------------------------
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Setup Complete!"                         -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Services running:" -ForegroundColor White
Write-Host "    - Hardhat Node    -> http://127.0.0.1:8545  (Job $($hardhatJob.Id))" -ForegroundColor Cyan
Write-Host "    - Next.js Frontend -> http://localhost:3000  (Job $($frontendJob.Id))" -ForegroundColor Cyan
Write-Host ""
Write-Host "  MetaMask Setup:" -ForegroundColor White
Write-Host "    1. Add a custom network in MetaMask:" -ForegroundColor DarkGray
Write-Host "       - Network Name : Hardhat Local"    -ForegroundColor DarkGray
Write-Host "       - RPC URL      : http://127.0.0.1:8545" -ForegroundColor DarkGray
Write-Host "       - Chain ID     : 31337"             -ForegroundColor DarkGray
Write-Host "       - Currency     : ETH"               -ForegroundColor DarkGray
Write-Host "    2. Import Account #0 private key from the Hardhat node output" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  To stop services:" -ForegroundColor Yellow
Write-Host "    Stop-Job $($hardhatJob.Id),$($frontendJob.Id) | Remove-Job" -ForegroundColor Yellow
Write-Host ""
