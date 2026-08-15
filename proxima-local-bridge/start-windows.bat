@echo off
echo ====================================================
echo 🚀 STARTING PROXIMA LOCAL AI BRIDGE (WINDOWS)
echo ====================================================

echo Checking Ollama local status on http://127.0.0.1:11434 ...
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama local engine is not running. Starting Ollama serve...
    start /b ollama serve
    timeout /t 3 >nul
) else (
    echo ✅ Ollama local engine is running.
)

echo Starting Proxima Local Bridge service...
node index.mjs
pause
