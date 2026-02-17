# Layout Components

This file contains the shared layout components that define the overall structure of the Claude Code UI application.

## App Structure

The app uses a **fixed layout** with:
- Left sidebar (desktop: 320px wide, mobile: overlay)
- Main content area (flexible)
- Bottom navigation (mobile only)

---

## App Shell (`src/App.tsx`)

The root layout structure:

```tsx
<div className="fixed inset-0 flex bg-background">
  {/* Fixed Desktop Sidebar */}
  {!isMobile && (
    <div
      className={`h-full flex-shrink-0 border-r border-border bg-card transition-all duration-300 ${
        sidebarVisible ? 'w-80' : 'w-14'
      }`}
    >
      <Sidebar {...props} />
    </div>
  )}

  {/* Mobile Sidebar Overlay */}
  {isMobile && sidebarOpen && (
    <div className="fixed inset-0 z-50 flex">
      <button className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative w-[85vw] max-w-sm sm:w-80 h-full bg-card border-r border-border transform transition-transform">
        <Sidebar {...props} />
      </div>
    </div>
  )}

  {/* Main Content Area */}
  <div className={`flex-1 flex flex-col min-w-0 ${isMobile && !isInputFocused ? 'pb-mobile-nav' : ''}`}>
    <MainContent {...props} />
  </div>

  {/* Mobile Bottom Navigation */}
  {isMobile && <MobileNav {...props} />}
</div>
```

---

## MobileNav (`src/components/MobileNav.tsx`)

Bottom navigation bar for mobile devices.

```tsx
import React from 'react';
import { MessageSquare, Folder, Terminal, GitBranch, CheckSquare, LucideIcon } from 'lucide-react';
import { useTasksSettings } from '../contexts/TasksSettingsContext';

type TabId = 'chat' | 'shell' | 'files' | 'git' | 'tasks';

interface NavItem {
  id: TabId;
  icon: LucideIcon;
  onClick: () => void;
}

interface MobileNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  isInputFocused: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, isInputFocused }) => {
  const { tasksEnabled } = useTasksSettings();
  
  const navItems: NavItem[] = [
    { id: 'chat', icon: MessageSquare, onClick: () => setActiveTab('chat') },
    { id: 'shell', icon: Terminal, onClick: () => setActiveTab('shell') },
    { id: 'files', icon: Folder, onClick: () => setActiveTab('files') },
    { id: 'git', icon: GitBranch, onClick: () => setActiveTab('git') },
    ...(tasksEnabled ? [{
      id: 'tasks' as TabId,
      icon: CheckSquare,
      onClick: () => setActiveTab('tasks' as TabId)
    }] : [])
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 ios-bottom-safe transform transition-transform duration-300 ease-in-out shadow-lg ${
        isInputFocused ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              onTouchStart={(e) => {
                e.preventDefault();
                item.onClick();
              }}
              className={`flex items-center justify-center p-2 rounded-lg min-h-[40px] min-w-[40px] relative touch-manipulation ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              aria-label={item.id}
            >
              <Icon className="w-5 h-5" />
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MobileNav;
```

**Key Features**:
- Fixed at bottom with `ios-bottom-safe` padding
- Hides when input is focused (`translate-y-full`)
- Active tab indicator with top line
- Touch-optimized with 40px min touch targets

---

## Sidebar Header Pattern

Common header pattern in sidebar:

```tsx
<div className="p-4 border-b border-border pwa-header-safe">
  <div className="flex items-center justify-between mb-4">
    <h1 className="text-lg font-semibold truncate flex items-center gap-2">
      <Logo className="w-6 h-6" />
      App Title
    </h1>
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon">
        <RefreshCw className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  </div>
</div>
```

---

## Content Area Pattern

Main content area structure:

```tsx
<div className="flex-1 flex flex-col min-w-0 overflow-hidden">
  {/* Header/Toolbar */}
  <div className="flex items-center justify-between p-2 border-b border-border bg-card">
    {/* Hamburger menu (mobile) */}
    {isMobile && (
      <button onClick={onMenuClick} className="p-2 rounded-lg">
        <Menu className="w-5 h-5" />
      </button>
    )}
    {/* Tabs or title */}
    <div className="flex items-center gap-2">
      {/* Tab buttons */}
    </div>
  </div>
  
  {/* Content */}
  <div className="flex-1 overflow-hidden">
    {activeTab === 'chat' && <ChatInterface />}
    {activeTab === 'files' && <FileTree />}
    {/* etc */}
  </div>
</div>
```

---

## Modal/Dialog Pattern

Standard modal overlay pattern:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div 
    className="fixed inset-0 bg-background/80 backdrop-blur-sm"
    onClick={onClose}
  />
  
  {/* Modal */}
  <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between p-4 border-b border-border">
      <h2 className="text-lg font-semibold">Modal Title</h2>
      <button onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
    </div>
    
    {/* Content */}
    <div className="p-4 overflow-y-auto">
      {/* Modal content */}
    </div>
    
    {/* Footer */}
    <div className="flex justify-end gap-2 p-4 border-t border-border">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button>Confirm</Button>
    </div>
  </div>
</div>
```

---

## Key Layout CSS Variables

From `src/index.css`:

```css
:root {
  /* Mobile navigation dimensions */
  --mobile-nav-height: 60px;
  --mobile-nav-padding: 12px;
  --mobile-nav-total: calc(var(--mobile-nav-height) + max(env(safe-area-inset-bottom, 0px), var(--mobile-nav-padding)));

  /* Header safe area dimensions */
  --header-safe-area-top: env(safe-area-inset-top, 0px);
  --header-base-padding: 8px;
  --header-total-padding: calc(var(--header-safe-area-top) + var(--header-base-padding));
}
```

**Utility Classes**:
- `.ios-bottom-safe` - Adds bottom padding for iOS safe area
- `.pwa-header-safe` - Adds top padding for PWA status bar
- `.pb-mobile-nav` - Bottom padding for mobile nav height
