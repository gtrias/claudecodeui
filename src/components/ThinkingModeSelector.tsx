import React, { useState, useRef, useEffect } from 'react';
import { Brain, Zap, Sparkles, Atom, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ThinkingMode {
  id: string;
  name: string;
  description: string;
  icon?: React.FC<{ className?: string }>;
  prefix: string;
  color: string;
}

export interface ThinkingModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  onClose?: () => void;
  className?: string;
}

interface TranslatedMode extends ThinkingMode {
  name: string;
  description: string;
  prefix: string;
}

const thinkingModes: ThinkingMode[] = [
  {
    id: 'none',
    name: 'Standard',
    description: 'Regular Claude response',
    icon: null,
    prefix: '',
    color: 'text-gray-600'
  },
  {
    id: 'think',
    name: 'Think',
    description: 'Basic extended thinking',
    icon: Brain,
    prefix: 'think',
    color: 'text-blue-600'
  },
  {
    id: 'think-hard',
    name: 'Think Hard',
    description: 'More thorough evaluation',
    icon: Zap,
    prefix: 'think hard',
    color: 'text-purple-600'
  },
  {
    id: 'think-harder',
    name: 'Think Harder',
    description: 'Deep analysis with alternatives',
    icon: Sparkles,
    prefix: 'think harder',
    color: 'text-indigo-600'
  },
  {
    id: 'ultrathink',
    name: 'Ultrathink',
    description: 'Maximum thinking budget',
    icon: Atom,
    prefix: 'ultrathink',
    color: 'text-red-600'
  }
];

const ThinkingModeSelector: React.FC<ThinkingModeSelectorProps> = ({ 
  selectedMode, 
  onModeChange, 
  onClose, 
  className = '' 
}) => {
  const { t } = useTranslation('chat');

  // Mapping from mode ID to translation key
  const modeKeyMap: Record<string, string> = {
    'think-hard': 'thinkHard',
    'think-harder': 'thinkHarder'
  };
  // Create translated modes for display
  const translatedModes: TranslatedMode[] = thinkingModes.map(mode => {
    const modeKey = modeKeyMap[mode.id] || mode.id;
    return {
      ...mode,
      name: t(`thinkingMode.modes.${modeKey}.name`),
      description: t(`thinkingMode.modes.${modeKey}.description`),
      prefix: t(`thinkingMode.modes.${modeKey}.prefix`)
    };
  });

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);