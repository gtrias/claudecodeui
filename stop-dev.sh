#!/bin/bash
# Stop Claude Code UI development server

cd "$(dirname "$0")"

if [ ! -f .claudecodeui.pid ]; then
    echo "Claude Code UI is not running (no PID file found)"
    exit 0
fi

PID=$(cat .claudecodeui.pid)

if ps -p $PID > /dev/null 2>&1; then
    echo "Stopping Claude Code UI (PID: $PID)..."
    kill $PID
    sleep 2

    # Force kill if still running
    if ps -p $PID > /dev/null 2>&1; then
        echo "Force stopping..."
        kill -9 $PID
    fi

    echo "Claude Code UI stopped"
else
    echo "Claude Code UI process not found (stale PID file)"
fi

rm -f .claudecodeui.pid
