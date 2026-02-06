import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export interface ClaudeStatusProps {
  status?: string;
  onAbort?: () => void;
  isLoading: boolean;
  provider?: string;
}

const ClaudeStatus: React.FC<ClaudeStatusProps> = ({
  status,
  onAbort,
  isLoading,
  provider = 'claude'
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [fakeTokens, setFakeTokens] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      setFakeTokens(0);
      return;
    }

    const startTime = Date.now();
    // Calculate random token rate once (30-50 tokens per second)
    const tokenRate = 30 + Math.random() * 20;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      // Simulate token count increasing over time
      setFakeTokens(Math.floor(elapsed * tokenRate));
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Animate the status indicator
  useEffect(() => {
    if (!isLoading) return;

    const timer = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(timer);
  }, [isLoading]);

  // Don't show if loading is false
  // Note: showThinking only controls the reasoning accordion in messages, not this processing indicator
  if (!isLoading) return null;
  
  // Clever action words that cycle
  const actionWords = ['Thinking', 'Processing', 'Analyzing', 'Working', 'Computing', 'Reasoning'];
  const actionIndex = Math.floor(elapsedTime / 3) % actionWords.length;