#!/bin/bash
# Start Claude Code UI
# This script starts the backend server (which serves the built frontend)

cd "$(dirname "$0")"

# Check if already running
if [ -f .claudecodeui.pid ]; then
    PID=$(cat .claudecodeui.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Claude Code UI is already running (PID: $PID)"
        echo "Access it at: http://192.168.1.25:3001"
        exit 0
    else
        rm -f .claudecodeui.pid
    fi
fi

# Build first (in foreground to see any errors)
echo "Building frontend..."
npm run build

# Start server in background and save PID
echo "Starting server..."
nohup npm run server > .claudecodeui.log 2>&1 &
echo $! > .claudecodeui.pid

# Wait a bit for startup
sleep 3

# Check if it started successfully
if ps -p $(cat .claudecodeui.pid) > /dev/null 2>&1; then
    echo "Claude Code UI started successfully!"
    echo "Access at: http://localhost:3001"
    echo "Mobile: http://192.168.1.25:3001"
    echo "Logs: .claudecodeui.log"
    echo ""
    echo "To stop: ./stop-dev.sh"
else
    echo "Failed to start Claude Code UI. Check .claudecodeui.log"
    rm -f .claudecodeui.pid
    exit 1
fi
