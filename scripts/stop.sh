#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🛑 Stopping D3 Dashboard services..."

# Kill Flask/Python server on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "✅ Stopped backend (port 8000)" || echo "ℹ️  Backend not running"

# Kill React on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✅ Stopped frontend (port 3000)" || echo "ℹ️  Frontend not running"

# Stop Redis
cd "$PROJECT_ROOT/backend"
if [ -f "docker-compose.yml" ]; then
    docker-compose down 2>/dev/null && echo "✅ Stopped Redis" || echo "ℹ️  Redis not running"
fi

echo "✅ All services stopped"
