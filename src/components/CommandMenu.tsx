import React, { useEffect, useRef } from 'react';

export interface Command {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface CommandMenuProps {
  commands?: Command[];
  selectedIndex?: number;
  onSelect?: (command: Command) => void;
  onClose?: () => void;
  position?: { top?: number; left?: number; bottom?: number };
  isOpen?: boolean;
  frequentCommands?: Command[];
}

const CommandMenu: React.FC<CommandMenuProps> = ({
  commands = [],
  selectedIndex = -1,
  onSelect,
  onClose,
  position = { top: 0, left: 0 },
  isOpen = false,
  frequentCommands = []
}) => {
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
        maxHeight: 'min(50vh, 300px)' // Limit to smaller of 50vh or 300px
      };
    }

    // On desktop, use provided position but ensure it stays on screen
    return {
      position: 'fixed',
      top: `${Math.max(16, Math.min(position.top || 0, viewportHeight - 316))}px`,
      left: `${position.left || 0}px`,
      width: 'min(400px, calc(100vw - 32px))',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '300px'
    };
  };

  const menuPosition = getMenuPosition();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const itemRect = selectedItemRef.current.getBoundingClientRect();

      if (itemRect.bottom > menuRect.bottom) {
        selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (itemRect.top < menuRect.top) {
        selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);