import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Eye,
  Settings2,
  Moon,
  Sun,
  ArrowDown,
  Mic,
  Brain,
  Sparkles,
  FileText,
  Languages,
  GripVertical
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import DarkModeToggle from './DarkModeToggle';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSelector from './LanguageSelector';

export interface QuickSettingsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  autoExpandTools: boolean;
  onAutoExpandChange: (value: boolean) => void;
  showRawParameters: boolean;
  onShowRawParametersChange: (value: boolean) => void;
  showThinking: boolean;
  onShowThinkingChange: (value: boolean) => void;
  autoScrollToBottom: boolean;
  onAutoScrollChange: (value: boolean) => void;
  sendByCtrlEnter: boolean;
  onSendByCtrlEnterChange: (value: boolean) => void;
  isMobile: boolean;
}

const QuickSettingsPanel: React.FC<QuickSettingsPanelProps> = ({
  isOpen,
  onToggle,
  autoExpandTools,
  onAutoExpandChange,
  showRawParameters,
  onShowRawParametersChange,
  showThinking,
  onShowThinkingChange,
  autoScrollToBottom,
  onAutoScrollChange,
  sendByCtrlEnter,
  onSendByCtrlEnterChange,
  isMobile
}) => {
  const { t } = useTranslation('settings');
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const [whisperMode, setWhisperMode] = useState(() => {
    return localStorage.getItem('whisperMode') || 'default';
  });
  const { isDarkMode } = useTheme();

  // Draggable handle state
  const [handlePosition, setHandlePosition] = useState(() => {
    const saved = localStorage.getItem('quickSettingsHandlePosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.y ?? 50;
      } catch {
        // Remove corrupted data
        localStorage.removeItem('quickSettingsHandlePosition');
        return 50;
      }
    }
    return 50; // Default to 50% (middle of screen)
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartPosition, setDragStartPosition] = useState(0);
  const [hasMoved, setHasMoved] = useState(false); // Track if user has moved during drag
  const handleRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef({ min: 10, max: 90 }); // Percentage constraints
  const dragThreshold = 5; // Pixels to move before it's considered a drag

  useEffect(() => {
    setLocalIsOpen(isOpen);
  }, [isOpen]);

  // Save handle position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('quickSettingsHandlePosition', JSON.stringify({ y: handlePosition }));
  }, [handlePosition]);

  // Calculate position from percentage
  const getPositionStyle = useCallback(() => {
    if (isMobile) {
      return {
        bottom: `${handlePosition}%`,
        top: 'auto'
      };
    }
    return {
      top: `${handlePosition}%`,
      bottom: 'auto'
    };
  }, [handlePosition, isMobile]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent): void => {
    setIsDragging(true);
    setHasMoved(false);

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStartY(clientY);
    setDragStartPosition(handlePosition);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    if (!isDragging) return;

    const deltaY = e.clientY - dragStartY;
    const containerHeight = window.innerHeight;
    const percentageChange = (deltaY / containerHeight) * 100;
    const newPosition = Math.max(
      constraintsRef.current.min,
      Math.min(constraintsRef.current.max, dragStartPosition - percentageChange)
    );

    if (Math.abs(newPosition - handlePosition) > dragThreshold) {
      setHasMoved(true);
    }
    setHandlePosition(newPosition);
  }, [isDragging, dragStartY, dragStartPosition, handlePosition]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  }, [handleMouseMove]);

  const handleTouchMove = useCallback((e: TouchEvent): void => {
    if (!isDragging) return;

    const touchY = e.touches[0].clientY;
    const deltaY = touchY - dragStartY;
    const containerHeight = window.innerHeight;
    const percentageChange = (deltaY / containerHeight) * 100;
    const newPosition = Math.max(
      constraintsRef.current.min,
      Math.min(constraintsRef.current.max, dragStartPosition - percentageChange)
    );

    if (Math.abs(newPosition - handlePosition) > dragThreshold) {
      setHasMoved(true);
    }
    setHandlePosition(newPosition);
  }, [isDragging, dragStartY, dragStartPosition, handlePosition]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`fixed z-40 ${isMobile ? 'right-2' : 'right-0'} transition-all duration-300 ease-in-out`}
      style={getPositionStyle()}
    >
      {/* Draggable Handle */}
      <div
        ref={handleRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className={cn(
          'absolute -left-8 w-16 h-6 flex items-center justify-center cursor-move',
          isMobile ? '-top-8' : '-right-8',
          'bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors',
          isDragging ? 'opacity-50' : 'opacity-100'
        )}
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>

      {/* Panel Content */}
      <div className={cn(
        'w-64 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden',
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Settings</h3>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
            </div>
            <DarkModeToggle />
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Language</span>
            </div>
            <LanguageSelector />
          </div>

          {/* Whisper Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Whisper Mode</span>
            </div>
            <select
              value={whisperMode}
              onChange={(e) => {
                setWhisperMode(e.target.value);
                localStorage.setItem('whisperMode', e.target.value);
              }}
              className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-700 dark:text-gray-300"
            >
              <option value="default">Default</option>
              <option value="prompt">Prompt</option>
              <option value="vibe">Vibe</option>
              <option value="instructions">Instructions</option>
              <option value="architect">Architect</option>
            </select>
          </div>

          {/* Auto Expand Tools */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto Expand Tools</span>
            </div>
            <input
              type="checkbox"
              checked={autoExpandTools}
              onChange={(e) => onAutoExpandChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          {/* Show Raw Parameters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Raw Parameters</span>
            </div>
            <input
              type="checkbox"
              checked={showRawParameters}
              onChange={(e) => onShowRawParametersChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          {/* Show Thinking */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Thinking</span>
            </div>
            <input
              type="checkbox"
              checked={showThinking}
              onChange={(e) => onShowThinkingChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          {/* Auto Scroll */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto Scroll</span>
            </div>
            <input
              type="checkbox"
              checked={autoScrollToBottom}
              onChange={(e) => onAutoScrollChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>

          {/* Send by Ctrl+Enter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Send by Ctrl+Enter</span>
            </div>
            <input
              type="checkbox"
              checked={sendByCtrlEnter}
              onChange={(e) => onSendByCtrlEnterChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Drag the handle to reposition the panel
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuickSettingsPanel;