import React, { useEffect, useRef } from 'react';

export interface Command {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
}

export interface CommandMenuProps {
  commands: Command[];
  selectedIndex: number;
  onSelect: (command: Command) => void;
  onClose: () => void;
  position: { top?: number; left?: number; bottom?: number };
  isOpen: boolean;
  frequentCommands: Command[];
}

const CommandMenu: React.FC<CommandMenuProps> = ({ commands = [], selectedIndex = -1, onSelect, onClose, position = { top: 0, left: 0 }, isOpen = false, frequentCommands = [] }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Calculate responsive positioning
  const getMenuPosition = (): React.CSSProperties => {
    const isMobile = window.innerWidth < 640;
    const viewportHeight = window.innerHeight;
    const menuHeight = 300; // Max height of menu

    if (isMobile) {
      // On mobile, calculate bottom position dynamically to appear above the input
      // Use the bottom value which is calculated as: window.innerHeight - textarea.top + spacing
      const inputBottom = position.bottom || 90; // Use provided bottom or default

      return {
        position: 'fixed',
        bottom: `${inputBottom}px`, // Position above the input with spacing already included
        left: '16px',
        right: '16px',
        width: 'auto',
        maxWidth: 'calc(100vw - 32px)',
        maxHeight: 'min(50vh, 300px)', // Limit to smaller of 50vh or 300px
      };
    }

    // On desktop, use provided position but ensure it stays on screen
    return {
      position: 'fixed',
      top: `${Math.max(16, Math.min(position.top || 0, viewportHeight - 316))}px`,
      left: `${position.left || 0}px`,
      width: 'min(400px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '300px',
    };
  };

  useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, selectedIndex]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={getMenuPosition()}
    >
      <div className="max-h-96 overflow-y-auto">
        {frequentCommands.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Frequent Commands
            </h3>
          </div>
        )}

        {frequentCommands.map((command, index) => (
          <div
            key={command.id}
            ref={index === selectedIndex ? selectedItemRef : null}
            className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
              index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
            onClick={() => onSelect(command)}
          >
            {command.icon}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{command.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{command.description}</p>
            </div>
          </div>
        ))}

        {commands.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              All Commands
            </h3>
          </div>
        )}

        {commands.map((command, index) => {
          const absoluteIndex = frequentCommands.length + index;
          return (
            <div
              key={command.id}
              ref={absoluteIndex === selectedIndex ? selectedItemRef : null}
              className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                absoluteIndex === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onClick={() => onSelect(command)}
            >
              {command.icon}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{command.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{command.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommandMenu;