import React, { useState, useRef, useEffect } from 'react';
import { Brain, Zap, Sparkles, Atom, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ThinkingMode {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  prefix: string;
  color: string;
}

const thinkingModes: ThinkingMode[] = [
  {
    id: 'none',
    name: 'Standard',
    description: 'Regular Claude response',
    icon: undefined,
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

export interface ThinkingModeSelectorProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
  onClose?: () => void;
  className?: string;
}

const ThinkingModeSelector: React.FC<ThinkingModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  onClose,
  className = ''
}) => {
  const { t } = useTranslation('chat');