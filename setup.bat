@echo off
echo 🧠 MedGPT Scholar Setup Script
echo ==============================
echo.

REM Check if Ollama is installed
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ollama is not installed.
    echo Please install Ollama from https://ollama.ai
    echo.
    echo After installing, run this script again.
    pause
    exit /b 1
)

echo ✅ Ollama is installed

REM Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama is not running. 
    echo Please run 'ollama serve' in another terminal first.
    echo.
    pause
    exit /b 1
)

echo ✅ Ollama is running

REM Check for Node.js dependencies
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    npm install
    echo ✅ Dependencies installed
)

REM Create environment file if it doesn't exist
if not exist ".env.local" (
    echo ⚙️  Creating environment configuration...
    copy .env.example .env.local
    echo ✅ Environment file created
)

echo.
echo 🎉 Setup complete!
echo.
echo To start MedGPT Scholar:
echo 1. Make sure Ollama is running: ollama serve
echo 2. Start the development server: npm run dev
echo 3. Open http://localhost:3000 in your browser
echo.
echo For production builds:
echo • Build: npm run build
echo • Start: npm start
echo.
echo ⚠️  Medical Disclaimer: This tool is for educational purposes only.
echo    Always consult healthcare professionals for medical advice.
echo.
pause
