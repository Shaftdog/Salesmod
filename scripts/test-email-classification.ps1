# PowerShell script to run Email Classification Learning System tests
# This script handles server startup, test execution, and result reporting

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Email Classification Learning System Tests" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if development server is running
Write-Host "[1/5] Checking development server..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    $serverRunning = $true
    Write-Host "  ✓ Server is running at http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Server is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start the development server in another terminal:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Create test-results directory
Write-Host ""
Write-Host "[2/5] Preparing test environment..." -ForegroundColor Yellow
if (-not (Test-Path "test-results")) {
    New-Item -ItemType Directory -Path "test-results" | Out-Null
    Write-Host "  ✓ Created test-results directory" -ForegroundColor Green
} else {
    Write-Host "  ✓ test-results directory exists" -ForegroundColor Green
}

# Check Playwright installation
Write-Host ""
Write-Host "[3/5] Checking Playwright installation..." -ForegroundColor Yellow
try {
    $playwrightVersion = npx playwright --version
    Write-Host "  ✓ Playwright $playwrightVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Playwright not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Playwright browsers..." -ForegroundColor Yellow
    npx playwright install --with-deps
}

# Prompt for test mode
Write-Host ""
Write-Host "[4/5] Select test mode:" -ForegroundColor Yellow
Write-Host "  1. Full test suite (all scenarios)" -ForegroundColor Cyan
Write-Host "  2. Quick test (Scenario 1 only)" -ForegroundColor Cyan
Write-Host "  3. Security tests (Scenarios 2-3)" -ForegroundColor Cyan
Write-Host "  4. Performance and console tests" -ForegroundColor Cyan
Write-Host "  5. Headed mode (watch browser)" -ForegroundColor Cyan
Write-Host "  6. Debug mode" -ForegroundColor Cyan
Write-Host ""
$choice = Read-Host "Enter choice (1-6)"

# Run tests based on choice
Write-Host ""
Write-Host "[5/5] Running tests..." -ForegroundColor Yellow
Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "Running full test suite..." -ForegroundColor Cyan
        npx playwright test e2e/email-classification-learning-system.spec.ts
    }
    "2" {
        Write-Host "Running quick test (Scenario 1)..." -ForegroundColor Cyan
        npx playwright test e2e/email-classification-learning-system.spec.ts -g "Scenario 1"
    }
    "3" {
        Write-Host "Running security tests..." -ForegroundColor Cyan
        npx playwright test e2e/email-classification-learning-system.spec.ts -g "Security"
    }
    "4" {
        Write-Host "Running performance and console tests..." -ForegroundColor Cyan
        npx playwright test e2e/email-classification-learning-system.spec.ts -g "Performance|Console"
    }
    "5" {
        Write-Host "Running in headed mode (browser visible)..." -ForegroundColor Cyan
        npx playwright test e2e/email-classification-learning-system.spec.ts --headed
    }
    "6" {
        Write-Host "Running in debug mode..." -ForegroundColor Cyan
        npx playwright test e2e/email-classification-learning-system.spec.ts --debug
    }
    default {
        Write-Host "Invalid choice. Running full test suite..." -ForegroundColor Yellow
        npx playwright test e2e/email-classification-learning-system.spec.ts
    }
}

# Show results
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Test Execution Complete" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "View results:" -ForegroundColor Yellow
Write-Host "  - Screenshots: test-results/*.png" -ForegroundColor Cyan
Write-Host "  - HTML Report: npx playwright show-report" -ForegroundColor Cyan
Write-Host "  - Test Details: See RUN-EMAIL-CLASSIFICATION-TESTS.md" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to view report
$viewReport = Read-Host "Open HTML test report? (y/n)"
if ($viewReport -eq "y" -or $viewReport -eq "Y") {
    npx playwright show-report
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Green
