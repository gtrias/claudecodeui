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