import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface StatusData {
  text?: string;
  tokens?: number;
  can_interrupt?: boolean;
}

interface ModelInfo {
  /** Short display name, e.g. "Sonnet" */
  label: string;
  /** Full model ID, e.g. "claude-sonnet-4-20250514" */
  id: string;
}

interface ClaudeStatusProps {
  status?: StatusData;
  onAbort?: () => void;
  isLoading?: boolean;
  provider?: string;
  /** Current model information */
  model?: ModelInfo;
  /** Callback when model badge is clicked */
  onModelClick?: () => void;
}

const ClaudeStatus: React.FC<ClaudeStatusProps> = ({ 
  status, 
  onAbort, 
  isLoading = false, 
  provider = 'claude',
  model,
  onModelClick
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
  
  // Parse status data
  const statusText = status?.text || actionWords[actionIndex];
  const tokens = status?.tokens || fakeTokens;
  const canInterrupt = status?.can_interrupt !== false;
  
  // Animation characters
  const spinners = ['✻', '✹', '✸', '✶'];
  const currentSpinner = spinners[animationPhase];
  
  return (
    <div className="w-full mb-3 sm:mb-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between max-w-4xl mx-auto bg-gray-800 dark:bg-gray-900 text-white rounded-lg shadow-lg px-2.5 py-2 sm:px-4 sm:py-3 border border-gray-700 dark:border-gray-800">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Animated spinner */}
            <span className={cn(
              "text-base sm:text-xl transition-all duration-500 flex-shrink-0",
              animationPhase % 2 === 0 ? "text-primary scale-110" : "text-primary"
            )}>
              {currentSpinner}
            </span>

            {/* Status text - compact for mobile */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-medium text-xs sm:text-sm truncate">{statusText}...</span>
                <span className="text-gray-400 text-xs sm:text-sm flex-shrink-0">({elapsedTime}s)</span>
                {/* Model indicator badge */}
                {model && (
                  <>
                    <span className="text-gray-500 hidden sm:inline">·</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onModelClick?.();
                      }}
                      className={cn(
                        "hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm",
                        "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
                        "text-[10px] font-mono tracking-tight transition-all duration-150",
                        "cursor-pointer group"
                      )}
                      title={`${model.label} (${model.id}) - Click to change model`}
                    >
                      <span className="text-gray-300 font-semibold">{model.label}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-400 truncate max-w-[120px] lg:max-w-[180px]">{model.id}</span>
                      <svg 
                        className="w-2.5 h-2.5 text-gray-500 group-hover:text-gray-300 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </>
                )}
                {tokens > 0 && (
                  <>
                    <span className="text-gray-500 hidden sm:inline">·</span>
                    <span className="text-gray-300 text-xs sm:text-sm hidden sm:inline flex-shrink-0">⚒ {tokens.toLocaleString()}</span>
                  </>
                )}
                <span className="text-gray-500 hidden sm:inline">·</span>
                <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline">esc to stop</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interrupt button */}
        {canInterrupt && onAbort && (
          <button
            onClick={onAbort}
            className="ml-2 sm:ml-3 text-xs bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-md transition-colors flex items-center gap-1 sm:gap-1.5 flex-shrink-0 font-medium"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ClaudeStatus;
