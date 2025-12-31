#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🏥 D3 Dashboard Health Check"
echo "============================"

echo -n "Redis:    "
if redis-cli ping &> /dev/null; then
    MEM=$(redis-cli INFO memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
    KEYS=$(redis-cli DBSIZE 2>/dev/null | awk '{print $2}' | tr -d '\r')
    echo "✅ Running (Memory: ${MEM:-?}, Keys: ${KEYS:-?})"
else
    echo "❌ Not running"
fi

echo -n "Backend:  "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs 2>/dev/null | grep -q "200"; then
    echo "✅ Running on :8000"
else
    echo "❌ Not responding"
fi

echo -n "Frontend: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200"; then
    echo "✅ Running on :3000"
else
    echo "❌ Not responding"
fi

echo -n "API Auth: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/batting 2>/dev/null)
if [ "$RESPONSE" = "401" ]; then
    echo "✅ Protected (401 without auth)"
elif [ "$RESPONSE" = "200" ]; then
    echo "⚠️  Open (200 without auth)"
else
    echo "❓ Status: $RESPONSE"
fi

echo ""

