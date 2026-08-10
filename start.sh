#!/bin/bash

# ============================================================================
# DOCKER COMPOSE STARTUP SCRIPT
# Usage: ./start.sh [build|up|down|logs|clean]
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    exit 1
fi

case "${1:-up}" in
  build)
    echo -e "${YELLOW}🔨 Building Docker images...${NC}"
    docker compose build --no-cache
    echo -e "${GREEN}✅ Build complete!${NC}"
    ;;
  up)
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker compose up --pull always -d
    echo -e "${GREEN}✅ Services started!${NC}"
    echo ""
    echo -e "${GREEN}📱 Application is running:${NC}"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost/api"
    echo "  Database: localhost:3306 (mysql)"
    echo ""
    echo "View logs with: docker compose logs -f"
    ;;
  down)
    echo -e "${YELLOW}⬇️  Stopping services...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Services stopped!${NC}"
    ;;
  logs)
    docker compose logs -f "${2:-}"
    ;;
  clean)
    echo -e "${RED}🗑️  Removing containers and volumes...${NC}"
    docker compose down -v
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
    ;;
  status)
    echo -e "${YELLOW}📊 Service Status:${NC}"
    docker compose ps
    ;;
  restart)
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    docker compose restart
    echo -e "${GREEN}✅ Services restarted!${NC}"
    ;;
  *)
    echo "Usage: $0 {build|up|down|logs|clean|status|restart}"
    echo ""
    echo "Commands:"
    echo "  build    - Build Docker images"
    echo "  up       - Start services in background"
    echo "  down     - Stop services"
    echo "  logs     - View service logs (add service name: logs backend)"
    echo "  clean    - Remove containers and volumes"
    echo "  status   - Show service status"
    echo "  restart  - Restart all services"
    exit 1
    ;;
esac
