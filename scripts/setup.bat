@echo off
REM Omegoo Development Setup Script for Windows
echo 🚀 Setting up Omegoo PWA development environment...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    exit /b 1
)

echo ✅ Prerequisites check passed

echo 📦 Installing dependencies...

REM Install workspace dependencies
call npm install
if %errorlevel% neq 0 goto :error

REM Install frontend dependencies
cd frontend
call npm install
if %errorlevel% neq 0 goto :error
cd ..

REM Install backend dependencies
cd backend
call npm install
if %errorlevel% neq 0 goto :error
cd ..

REM Install shared dependencies
cd shared
call npm install
if %errorlevel% neq 0 goto :error
cd ..

echo ✅ Dependencies installed

echo ⚙️ Setting up environment files...

REM Setup environment files
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo 📄 Created backend\.env from example
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo 📄 Created frontend\.env from example
)

echo ⚠️ Please configure your environment variables in .env files
echo ✅ Environment files setup complete

echo 🗄️ Setting up database...

REM Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis
if %errorlevel% neq 0 goto :error

echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak

echo ✅ Database setup complete

echo 🎯 Final setup steps...

REM Create logs directory
if not exist logs mkdir logs

echo ✅ Setup complete!
echo.
echo 🚀 Quick Start Commands:
echo   npm run dev           # Start development servers
echo   docker-compose up     # Start with Docker
echo   npm run build:all     # Build all projects
echo.
echo 📚 Documentation:
echo   README.md            # Project overview
echo   docs\               # Detailed documentation
echo.
echo 🔧 Configuration:
echo   backend\.env        # Backend configuration
echo   frontend\.env       # Frontend configuration

goto :end

:error
echo ❌ Setup failed with error %errorlevel%
exit /b %errorlevel%

:end