# Dhamini Deployment Script
# Builds the frontend and prepares for Render deployment
#
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== Dhamini Deployment Build ===" -ForegroundColor Cyan

$frontendDir = Join-Path $PSScriptRoot "frontend"

# 1. Verify frontend directory exists
if (!(Test-Path $frontendDir)) {
    Write-Host "ERROR: frontend/ directory not found" -ForegroundColor Red
    exit 1
}

# 2. Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd $frontendDir
npm install

# 3. Build the frontend
Write-Host "Building frontend (Vite)..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
    exit 1
}

# 4. Verify build output
$distDir = Join-Path $frontendDir "dist"
$indexHtml = Join-Path $distDir "index.html"
if (!(Test-Path $indexHtml)) {
    Write-Host "ERROR: Build output missing: $indexHtml" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green
Write-Host "Output: $distDir" -ForegroundColor Green

# 5. Verify backend can import
Write-Host "Verifying backend imports..." -ForegroundColor Yellow
cd $PSScriptRoot
python -c "from app.main import app; print('Backend imports OK')" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Backend import check failed (may be missing dependencies)" -ForegroundColor Yellow
}

Write-Host "" -ForegroundColor Cyan
Write-Host "=== Deployment Ready ===" -ForegroundColor Cyan
Write-Host "Commit and push to trigger Render deployment." -ForegroundColor Cyan
Write-Host "Render will: npm install -> npm run build -> uvicorn app.main:app" -ForegroundColor Cyan