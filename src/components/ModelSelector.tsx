import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ClaudeLogo from './ClaudeLogo';
import CursorLogo from './CursorLogo';
import CodexLogo from './CodexLogo';
import PiLogo from './PiLogo';
import { CLAUDE_MODELS, CURSOR_MODELS, CODEX_MODELS } from '../../shared/modelConstants';

type Provider = 'claude' | 'cursor' | 'codex' | 'pi';

interface ModelOption {
  value: string;
  label: string;
  reasoning?: boolean;
}

interface ModelSelectorProps {
  provider: Provider;
  claudeModel: string;
  cursorModel: string;
  codexModel: string;
  piModel: string;
  piModels: ModelOption[];
  dynamicCodexModels: ModelOption[];
  onClaudeModelChange: (model: string) => void;
  onCursorModelChange: (model: string) => void;
  onCodexModelChange: (model: string) => void;
  onCodexModelChoiceChange: (choice: string) => void;
  onPiModelChange: (model: string) => void;
  className?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  provider,
  claudeModel,
  cursorModel,
  codexModel,
  piModel,
  piModels,
  dynamicCodexModels,
  onClaudeModelChange,
  onCursorModelChange,
  onCodexModelChange,
  onCodexModelChoiceChange,
  onPiModelChange,
  className = ''
}) => {
  const { t } = useTranslation('chat');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current model info based on provider
  const getCurrentModel = (): { label: string; value: string } => {
    switch (provider) {
      case 'claude': {
        const model = CLAUDE_MODELS.OPTIONS.find(m => m.value === claudeModel);
        return { label: model?.label || claudeModel, value: claudeModel };
      }
      case 'cursor': {
        const model = CURSOR_MODELS.OPTIONS.find(m => m.value === cursorModel);
        return { label: model?.label || cursorModel, value: cursorModel };
      }
      case 'codex': {
        const models = dynamicCodexModels.length > 0 ? dynamicCodexModels : CODEX_MODELS.OPTIONS;
        const model = models.find(m => m.value === codexModel);
        return { label: model?.label || codexModel, value: codexModel };
      }
      case 'pi': {
        const model = piModels.find(m => m.value === piModel);
        return { label: model?.label || piModel || 'Default', value: piModel || '' };
      }
      default:
        return { label: 'Unknown', value: '' };
    }
  };

  // Get available models for current provider
  const getModels = (): ModelOption[] => {
    switch (provider) {
      case 'claude':
        return CLAUDE_MODELS.OPTIONS;
      case 'cursor':
        return CURSOR_MODELS.OPTIONS;
      case 'codex':
        return dynamicCodexModels.length > 0 ? dynamicCodexModels : CODEX_MODELS.OPTIONS;
      case 'pi':
        return piModels;
      default:
        return [];
    }
  };

  // Get current model value
  const getCurrentValue = (): string => {
    switch (provider) {
      case 'claude': return claudeModel;
      case 'cursor': return cursorModel;
      case 'codex': return codexModel;
      case 'pi': return piModel;
      default: return '';
    }
  };

  // Handle model selection
  const handleSelect = (value: string) => {
    switch (provider) {
      case 'claude':
        onClaudeModelChange(value);
        break;
      case 'cursor':
        onCursorModelChange(value);
        break;
      case 'codex':
        onCodexModelChange(value);
        onCodexModelChoiceChange(value);
        break;
      case 'pi':
        onPiModelChange(value);
        break;
    }
    setIsOpen(false);
  };

  // Get provider color
  const getProviderColor = (): string => {
    switch (provider) {
      case 'claude': return 'text-primary';
      case 'cursor': return 'text-purple-500';
      case 'codex': return 'text-gray-500';
      case 'pi': return 'text-amber-500';
      default: return 'text-gray-500';
    }
  };

  // Get provider accent for selection
  const getProviderAccent = (): string => {
    switch (provider) {
      case 'claude': return 'bg-primary/10 border-primary';
      case 'cursor': return 'bg-purple-500/10 border-purple-500';
      case 'codex': return 'bg-gray-500/10 border-gray-500';
      case 'pi': return 'bg-amber-500/10 border-amber-500';
      default: return 'bg-gray-500/10 border-gray-500';
    }
  };

  const currentModel = getCurrentModel();
  const models = getModels();
  const currentValue = getCurrentValue();

  // Render provider logo
  const renderLogo = (size: string = 'w-4 h-4') => {
    switch (provider) {
      case 'claude': return <ClaudeLogo className={size} />;
      case 'cursor': return <CursorLogo className={size} />;
      case 'codex': return <CodexLogo className={size} />;
      case 'pi': return <PiLogo className={size} />;
      default: return null;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Compact button showing current model */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 hover:bg-secondary ${
          isOpen ? getProviderAccent() : 'bg-card border-border'
        }`}
        title={t('modelSelector.clickToChange', 'Click to change model')}
      >
        {renderLogo('w-3.5 h-3.5')}
        <span className="text-foreground max-w-[80px] truncate hidden sm:inline">
          {currentModel.label}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-card rounded-lg shadow-xl border border-border overflow-hidden z-50">
          {/* Header */}
          <div className="p-3 border-b border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderLogo('w-4 h-4')}
                <h3 className="text-sm font-semibold text-foreground">
                  {t('modelSelector.title', 'Select Model')}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-secondary rounded transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('modelSelector.current', 'Current')}: <span className="font-mono">{currentModel.value}</span>
            </p>
          </div>

          {/* Model list */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {models.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                {t('modelSelector.noModels', 'No models available')}
              </div>
            ) : (
              models.map((model) => {
                const isSelected = model.value === currentValue;
                return (
                  <button
                    key={model.value}
                    onClick={() => handleSelect(model.value)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between gap-2 ${
                      isSelected ? 'bg-secondary/70' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {renderLogo('w-4 h-4 flex-shrink-0')}
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {model.label}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono truncate">
                          {model.value}
                        </div>
                        {(model as any).reasoning && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            🧠 Reasoning
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className={`w-4 h-4 flex-shrink-0 ${getProviderColor()}`} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
