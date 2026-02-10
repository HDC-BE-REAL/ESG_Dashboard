#!/bin/bash
export PYTHONPATH=/mnt/c/Users/Admin/PycharmProjects/ESG_Dashboard

# Kill existing processes
echo "Killing existing uvicorn/vite processes..."
pkill -f uvicorn
pkill -f vite

# Start Backend
echo "Starting Backend..."
cd backend
source ../.venv/bin/activate
nohup uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
nohup npm run dev -- --host > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"

echo "Services are running!"
echo "Backend logs: tail -f backend/backend.log"
echo "Frontend logs: tail -f frontend/frontend.log"
