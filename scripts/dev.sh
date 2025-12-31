#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting D3 Dashboard Development Environment"
echo "================================================"

cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    
    # Gracefully stop backend
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID 2>/dev/null
        wait $BACKEND_PID 2>/dev/null
    fi
    
    # Stop frontend
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
    fi
    
    # Stop Redis
    cd "$PROJECT_ROOT/backend" && docker-compose down 2>/dev/null
    
    echo "✅ Stopped all services"
    exit 0
}

trap cleanup SIGINT SIGTERM

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed. Install Docker Desktop first."
    exit 1
fi

echo "📦 Starting Redis..."
cd "$PROJECT_ROOT/backend"
docker-compose up -d redis
sleep 2

if docker-compose ps | grep -q "kelly-redis"; then
    echo "✅ Redis running on localhost:6379"
else
    echo "❌ Redis failed to start"
    docker-compose logs redis
    exit 1
fi

echo ""
echo "📦 Setting up Backend..."
cd "$PROJECT_ROOT/backend"

if [ -z "$VIRTUAL_ENV" ]; then
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    elif [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "   Creating virtual environment..."
        python3 -m venv .venv
        source .venv/bin/activate
    fi
fi

pip install -q -r requirements.txt

export FLASK_ENV=development
export REDIS_URL=redis://127.0.0.1:6379/0
export PYTHONWARNINGS="ignore::UserWarning"

if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

echo "   Starting Flask on http://localhost:8000"
PORT=8000 python server.py 2>&1 &
BACKEND_PID=$!
sleep 2

if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Backend failed to start"
    exit 1
fi
echo "✅ Backend running (PID: $BACKEND_PID)"

echo ""
echo "📦 Setting up Frontend..."
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
fi

echo "   Starting React on http://localhost:3000"
PORT=3000 npm start &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "🎉 Development environment ready!"
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Redis:    localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"
echo "================================================"

wait $FRONTEND_PID $BACKEND_PID
