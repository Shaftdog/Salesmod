@echo off
REM Quick test runner for Email Classification Learning System
REM This batch file runs the automated tests

echo =============================================
echo Email Classification Learning System Tests
echo =============================================
echo.

REM Check if server is running
echo [Checking server...]
curl -s -o NUL -w "%%{http_code}" http://localhost:3000 | findstr "200" >NUL
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Development server is not running
    echo.
    echo Please start the server first:
    echo   npm run dev
    echo.
    pause
    exit /b 1
)

echo Server is running - OK
echo.

REM Run tests
echo [Running tests...]
echo.
npx playwright test e2e\email-classification-learning-system.spec.ts

echo.
echo =============================================
echo Test Complete
echo =============================================
echo.
echo View screenshots in: test-results\
echo View HTML report: npx playwright show-report
echo.
pause
