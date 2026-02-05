#!/bin/bash
# ESG Dashboard Backend - Start Script

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment if exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start FastAPI server with hot reload
echo "🚀 Starting ESG Dashboard API Server..."
echo "📍 API Docs: http://localhost:8000/docs"
echo "📍 Health Check: http://localhost:8000/api/health"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000
