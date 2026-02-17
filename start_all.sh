#!/bin/bash

# ESG_Dashboard Integrated Startup Script
PROJECT_ROOT=$(pwd)

echo "🚀 ESG Dashboard 시스템 시작 중..."

# 1. 기존 프로세스 종료
echo "Stopping existing uvicorn/vite processes..."
pkill -f uvicorn
pkill -f vite

# 2. MySQL 상태 확인 (선택 사항)
if pgrep mysql >/dev/null; then
    echo "✅ MySQL is already running."
else
    echo "⚠️ MySQL might not be running. Attempting to start (may require sudo)..."
    sudo service mysql start || echo "❌ Failed to start MySQL automatically. Please check DB status."
fi

# 3. 백엔드 실행
echo "Starting Backend API (Port 8000)..."
cd $PROJECT_ROOT/backend
source ../.venv/bin/activate
nohup python main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started with PID $BACKEND_PID"

# 4. 프론트엔드 실행
echo "Starting Frontend Dev Server (Port 5173)..."
cd $PROJECT_ROOT/frontend
nohup npm run dev -- --host > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started with PID $FRONTEND_PID"

echo "------------------------------------------------"
echo "🎉 모든 서비스가 백그라운드에서 실행 중입니다!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend API: http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo "------------------------------------------------"
echo "로그 확인 방법:"
echo "- Backend: tail -f backend/backend.log"
echo "- Frontend: tail -f frontend/frontend.log"
