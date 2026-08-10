@echo off
REM ============================================================================
REM DOCKER COMPOSE STARTUP SCRIPT FOR WINDOWS
REM Usage: start.cmd [build|up|down|logs|clean]
REM ============================================================================

setlocal enabledelayedexpansion

if not exist .env (
    echo Error: .env file not found!
    echo Please copy .env.example to .env and configure it
    exit /b 1
)

set "command=%1"
if "%command%"=="" set "command=up"

if "%command%"=="build" (
    echo Building Docker images...
    docker compose build --no-cache
    echo Build complete!
    exit /b 0
)

if "%command%"=="up" (
    echo Starting services...
    docker compose up --pull always -d
    echo Services started!
    echo.
    echo Application is running:
    echo   Frontend: http://localhost
    echo   Backend API: http://localhost/api
    echo   Database: localhost:3306 ^(mysql^)
    echo.
    echo View logs with: docker compose logs -f
    exit /b 0
)

if "%command%"=="down" (
    echo Stopping services...
    docker compose down
    echo Services stopped!
    exit /b 0
)

if "%command%"=="logs" (
    docker compose logs -f %2
    exit /b 0
)

if "%command%"=="clean" (
    echo Removing containers and volumes...
    docker compose down -v
    echo Cleanup complete!
    exit /b 0
)

if "%command%"=="status" (
    echo Service Status:
    docker compose ps
    exit /b 0
)

if "%command%"=="restart" (
    echo Restarting services...
    docker compose restart
    echo Services restarted!
    exit /b 0
)

echo Usage: start.cmd [build^|up^|down^|logs^|clean^|status^|restart]
echo.
echo Commands:
echo   build    - Build Docker images
echo   up       - Start services in background
echo   down     - Stop services
echo   logs     - View service logs
echo   clean    - Remove containers and volumes
echo   status   - Show service status
echo   restart  - Restart all services
exit /b 1
