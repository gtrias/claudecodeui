# Claude Code UI - Quick Start

Web-based UI for Claude Code CLI. Perfect for mobile development sessions.

## Quick Commands

```bash
./start-dev.sh    # Start both backend and frontend
./stop-dev.sh     # Stop the services
```

## Access URLs

- **Frontend (UI):** http://localhost:5173
- **Mobile Access:** http://192.168.1.25:5173 (or any other network IP shown on startup)
- **Backend API:** http://localhost:3001

## Manual Start

```bash
npm run dev      # Start both server (3001) + client (5173)
npm run server   # Backend only
npm run client   # Frontend only
```

## Configuration

Environment variables in `.env`:
- `PORT=3001` - Backend server port
- `VITE_PORT=5173` - Frontend dev server port

## Troubleshooting

**Service won't start?**
```bash
# Check logs
cat .claudecodeui.log

# Force stop
rm .claudecodeui.pid
pkill -f "npm run dev" || pkill -f "tsx.*server/index.ts"
```

**Port already in use?**
```bash
# Find what's using the port
lsof -i :3001   # Backend
lsof -i :5173   # Frontend

# Or change ports in .env
```

## Files

- `.env` - Environment configuration
- `.claudecodeui.pid` - Running process PID
- `.claudecodeui.log` - Runtime logs
- `start-dev.sh` - Start script
- `stop-dev.sh` - Stop script

## Development

```bash
npm run build       # Build for production
npm run preview     # Preview production build
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint
npm run lint:fix    # Auto-fix linting issues
```
