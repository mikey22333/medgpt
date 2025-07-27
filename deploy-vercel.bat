@echo off
echo 🏥 CliniSynth - Vercel Deployment Setup
echo ======================================
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Vercel CLI...
    npm install -g vercel
) else (
    echo ✅ Vercel CLI already installed
)

REM Check if user is logged in
echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Vercel:
    vercel login
) else (
    echo ✅ Already logged in to Vercel
)

REM Check if this is the first deployment
if not exist ".vercel\project.json" (
    echo 🚀 First time deployment - setting up project...
    echo Please answer the following questions:
    echo - Set up and deploy? → Y
    echo - Which scope? → Select your account
    echo - Link to existing project? → N
    echo - Project name → clinisynth ^(or your preferred name^)
    echo - Directory → ./
    echo.
    vercel
) else (
    echo 🔄 Deploying to existing project...
    vercel --prod
)

echo.
echo 🎉 Deployment initiated!
echo.
echo 📋 Next Steps:
echo 1. Set up environment variables in Vercel dashboard
echo 2. Configure your custom domain ^(if needed^)
echo 3. Test the deployed application
echo 4. Monitor deployment logs
echo.
echo 📖 Environment variables template: .env.vercel
echo ⚙️  Vercel configuration: vercel.json

pause
