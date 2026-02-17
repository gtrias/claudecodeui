# AGENTS.md - AI Coding Assistant Context

> **Purpose**: This file provides context and guidelines for AI coding assistants (Claude Code, Cursor, Codex, Pi, etc.) working on this codebase.

---

## 🎯 Project Overview

**Cloud CLI (Claude Code UI)** is a full-stack web application that provides a desktop and mobile UI for Claude Code, Cursor CLI, and Codex. It allows users to view and manage their AI-assisted coding sessions from anywhere.

- **Repository**: https://github.com/siteboon/claudecodeui
- **Website**: https://cloudcli.ai
- **NPM Package**: `@siteboon/claude-code-ui`
- **Current Version**: 1.16.3

---

## 🏗️ Architecture

### Stack
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Terminal**: xterm.js with node-pty
- **Editor**: CodeMirror 6
- **AI SDKs**: 
  - `@anthropic-ai/claude-agent-sdk` (Claude Code)
  - `@openai/codex-sdk` (Codex)
  - Custom integration for Cursor CLI
- **Database**: Convex (cloud database)
- **i18n**: i18next (English + Chinese)

### Key Directories
```
claudecodeui/
├── src/                    # Frontend React + TypeScript
│   ├── components/         # React components (mostly .tsx, some .jsx)
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React Context providers
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── i18n/               # Internationalization
│   └── App.tsx             # Main app component
├── server/                 # Backend Node.js (mixed .js and .ts)
│   ├── index.js            # Main Express server
│   ├── middleware/         # Authentication middleware
│   ├── claude-sdk.ts       # Claude Code integration
│   ├── cursor-cli.ts       # Cursor CLI integration
│   └── cli.js              # CLI entry point
├── shared/                 # Shared code between frontend/backend
├── dist/                   # Build output (generated)
└── docs/                   # Documentation
```

---

## 📋 Current Migration Status

### TypeScript Migration: ~96% Complete (133/138 files)
We have successfully migrated almost all code from JavaScript to TypeScript for improved type safety.

**✅ Completed**: All core components, hooks, utilities, and 133 TypeScript files
**🎯 Remaining**: 5 configuration/utility files intentionally kept as JavaScript:
- `src/i18n/languages.js` - Language configuration (data-only)
- `src/i18n/config.js` - i18next configuration (third-party setup)
- `src/utils/whisper.js` - Whisper transcription utility
- `src/utils/api.js` - API endpoint definitions
- `shared/modelConstants.js` - Model constants (data-only)

**Note**: These remaining JavaScript files are either configuration files for third-party libraries or simple data files. They can be migrated to TypeScript if needed, but are functionally complete.

### Strict TypeScript Configuration
We use strict TypeScript settings (see `tsconfig.json`):
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `exactOptionalPropertyTypes: true`

**Important**: All new code MUST be TypeScript (.tsx/.ts), not JavaScript.

---

## 🎨 Code Style & Patterns

### Component Patterns
1. **Functional Components Only** - Use React hooks, no class components
2. **TypeScript Interfaces** - Define props and state types explicitly
3. **Context for State** - Use React Context for global state management
4. **Custom Hooks** - Extract reusable logic into hooks (see `src/hooks/`)

### Example Component Structure
```tsx
import React from 'react';

interface MyComponentProps {
  title: string;
  onClose?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onClose }) => {
  const [state, setState] = React.useState<string>('');
  
  return (
    <div className="flex flex-col gap-4">
      {/* Component content */}
    </div>
  );
};
```

### Styling
- **TailwindCSS** for all styling
- Use `clsx` or `cn` utility for conditional classes
- Responsive design: mobile-first approach
- Dark mode support via `DarkModeToggle` component

### File Naming
- Components: PascalCase (e.g., `ChatInterface.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useWebSocket.ts`)
- Utils: camelCase (e.g., `formatMessage.ts`)
- Types: PascalCase (e.g., `Message.ts`)

---

## 🔑 Key Features & Components

### 1. Chat Interface (`ChatInterface.tsx`)
- Main interface for AI conversation
- Supports Claude Code, Cursor CLI, and Codex
- Message rendering with markdown, code blocks, syntax highlighting
- File attachments and image viewing

### 2. File Explorer (`FileTree.tsx`)
- Interactive file tree navigation
- Syntax-highlighted file viewing
- Live file editing with CodeMirror

### 3. Git Explorer
- View git status, diffs, and history
- Stage and commit changes
- Branch switching

### 4. Shell Terminal (`Shell.tsx`)
- Full terminal emulator using xterm.js
- Direct access to CLI tools
- WebSocket-based PTY connection

### 5. Settings Panel (`Settings.tsx`)
- API key management
- MCP server configuration
- Permissions management
- Language selection (i18n)

---

## 🔐 Security & Authentication

- JWT-based authentication
- bcrypt for password hashing
- Convex for user data and settings
- API keys stored securely in database
- File access permissions system

---

## 🚀 Build & Development

### Commands
```bash
# Development (runs both frontend and backend)
npm run dev

# Frontend only (Vite dev server)
npm run client

# Backend only (Express server)
npm run server

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Full validation (typecheck + lint)
npm run validate

# Start production server
npm start
```

### Port Configuration
- Frontend Dev: Usually `5173` (Vite default)
- Backend: `3000` (configurable via env)

---

## 📝 Important Files to Review

Before making changes, review these files:

1. **PRD.md** - Product requirements and TypeScript migration plan
2. **CHATINTERFACE_INTEGRATION_GUIDE.md** - Chat interface patterns
3. **README.md** - User-facing documentation
4. **package.json** - Dependencies and scripts
5. **tsconfig.json** - TypeScript configuration

---

## ✅ When Making Changes

### DO:
- ✅ Write new code in **TypeScript** (.tsx/.ts)
- ✅ Add proper **type definitions** for all props, state, and functions
- ✅ Use **functional components** and React hooks
- ✅ Follow **TailwindCSS** patterns for styling
- ✅ Add **responsive design** considerations (mobile + desktop)
- ✅ Support **dark mode** when applicable
- ✅ Include **i18n** for user-facing text (use `useTranslation`)
- ✅ Run `npm run validate` before committing
- ✅ Update relevant `.md` documentation files

### DON'T:
- ❌ Create new `.jsx` or `.js` files in `src/` (TypeScript migration in progress)
- ❌ Use `any` type (prefer proper TypeScript types)
- ❌ Create class components (use functional components)
- ❌ Hardcode strings that should be translated
- ❌ Commit without running type checking
- ❌ Break existing API contracts without updating documentation

---

## 🐛 Common Issues & Solutions

### TypeScript Errors
- If you see "Cannot find module" errors, check `src/types/` for type definitions
- Use `npm run typecheck` to see all type errors before building

### Import Errors
- Use relative imports for local files: `import { X } from './X'`
- Use `@/` path alias is NOT configured - use relative paths

### ESLint Issues
- Run `npm run lint:fix` to auto-fix many issues
- Check `eslint.config.js` for current rules
- See `ESLINT_SETUP.md` for configuration details

### Build Failures
- Clear `dist/` and rebuild: `rm -rf dist && npm run build`
- Check for circular dependencies
- Ensure all imports are correctly typed

---

## 🧪 Testing Strategy

Currently, testing is primarily:
1. **Type checking** with TypeScript compiler
2. **Linting** with ESLint
3. **Manual testing** in dev environment
4. **Build verification** (ensures production builds work)

**Note**: Formal unit/integration test suite is not yet implemented. Consider adding tests when implementing major new features.

---

## 📚 Related Documentation

- **CHATINTERFACE_REFACTOR_PLAN.md** - Chat interface refactoring strategy
- **ERROR_BOUNDARY_PLAN.md** - Error handling approach
- **TYPESCRIPT_MIGRATION_PROGRESS.md** - Detailed migration status
- **US-036-*.md** - User story completion reports
- **FINAL_SUMMARY.md** - Recent major changes summary

---

## 🔄 Git Workflow

### Branches
- `main` - Production-ready code
- Feature branches - For new features/fixes

### Commit Messages
Use conventional commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `chore:` - Build/tooling changes
- `style:` - Code style changes (formatting)

---

## 🎯 Current Priorities

1. **Maintain type safety** across the codebase
2. **Keep documentation updated** as code changes
3. **Maintain mobile responsiveness** for all new features
4. **Support all three CLI tools** (Claude Code, Cursor, Codex) equally
5. **Optional**: Migrate remaining 5 JavaScript files to TypeScript if needed

---

## 💡 Tips for AI Assistants

### When Asked to Add Features:
1. Check existing patterns in similar components
2. Use TypeScript from the start
3. Consider mobile + desktop layouts
4. Add translations to `src/i18n/` if adding UI text
5. Update this or related .md files if architecture changes

### When Debugging:
1. Check browser console for React errors
2. Run `npm run typecheck` for type issues
3. Check `server/` logs for backend issues
4. Use `npm run lint` to catch code quality issues

### When Refactoring:
1. Read relevant docs first (e.g., CHATINTERFACE_INTEGRATION_GUIDE.md)
2. Preserve existing functionality
3. Update type definitions
4. Test both mobile and desktop views
5. Document significant changes

---

## 🤝 Integration Points

### Frontend ↔️ Backend Communication
- **WebSocket** for real-time updates (terminal, file changes)
- **REST API** for CRUD operations (files, settings, sessions)
- **Express routes** in `server/index.js`

### AI CLI Integration
- **Claude Code SDK**: `server/claude-sdk.ts`
- **Cursor CLI**: `server/cursor-cli.ts`
- **Codex SDK**: `@openai/codex-sdk`

### State Management
- **React Context**: Used for global state (settings, user, theme)
- **Local State**: useState for component-level state
- **No Redux/MobX**: Keep it simple with Context + hooks

---

## 📞 Questions?

When unsure:
1. Check existing code patterns
2. Review the documentation files mentioned above
3. Look at similar implemented features
4. Run `npm run validate` to ensure code quality

---

**Last Updated**: February 2026  
**Maintained By**: Development team  
**For**: AI coding assistants (Claude Code, Cursor, Codex, Pi, etc.)

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>brainstorming</name>
<description>"You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."</description>
<location>project</location>
</skill>

<skill>
<name>dispatching-parallel-agents</name>
<description>Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies</description>
<location>project</location>
</skill>

<skill>
<name>executing-plans</name>
<description>Use when you have a written implementation plan to execute in a separate session with review checkpoints</description>
<location>project</location>
</skill>

<skill>
<name>finishing-a-development-branch</name>
<description>Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup</description>
<location>project</location>
</skill>

<skill>
<name>receiving-code-review</name>
<description>Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation</description>
<location>project</location>
</skill>

<skill>
<name>requesting-code-review</name>
<description>Use when completing tasks, implementing major features, or before merging to verify work meets requirements</description>
<location>project</location>
</skill>

<skill>
<name>subagent-driven-development</name>
<description>Use when executing implementation plans with independent tasks in the current session</description>
<location>project</location>
</skill>

<skill>
<name>superdesign</name>
<description>></description>
<location>project</location>
</skill>

<skill>
<name>systematic-debugging</name>
<description>Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes</description>
<location>project</location>
</skill>

<skill>
<name>test-driven-development</name>
<description>Use when implementing any feature or bugfix, before writing implementation code</description>
<location>project</location>
</skill>

<skill>
<name>using-git-worktrees</name>
<description>Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification</description>
<location>project</location>
</skill>

<skill>
<name>using-superpowers</name>
<description>Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions</description>
<location>project</location>
</skill>

<skill>
<name>verification-before-completion</name>
<description>Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always</description>
<location>project</location>
</skill>

<skill>
<name>writing-plans</name>
<description>Use when you have a spec or requirements for a multi-step task, before touching code</description>
<location>project</location>
</skill>

<skill>
<name>writing-skills</name>
<description>Use when creating new skills, editing existing skills, or verifying skills work before deployment</description>
<location>project</location>
</skill>

<skill>
<name>agent-browser</name>
<description>Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction.</description>
<location>global</location>
</skill>

<skill>
<name>skill-creator</name>
<description>Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.</description>
<location>global</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
