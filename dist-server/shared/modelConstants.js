/**
 * Centralized Model Definitions
 * Single source of truth for all supported AI models
 */
/**
 * Claude (Anthropic) Models
 *
 * Note: Claude uses two different formats:
 * - SDK format ('sonnet', 'opus') - used by the UI and claude-sdk.js
 * - API format ('claude-sonnet-4.5') - used by slash commands for display
 */
export const CLAUDE_MODELS = {
    // Models in SDK format (what the actual SDK accepts)
    OPTIONS: [
        { value: 'sonnet', label: 'Sonnet' },
        { value: 'opus', label: 'Opus' },
        { value: 'haiku', label: 'Haiku' },
        { value: 'opusplan', label: 'Opus Plan' },
        { value: 'sonnet[1m]', label: 'Sonnet [1M]' }
    ],
    DEFAULT: 'sonnet'
};
/**
 * Cursor Models
 */
export const CURSOR_MODELS = {
    OPTIONS: [
        { value: 'gpt-5.2-high', label: 'GPT-5.2 High' },
        { value: 'gemini-3-pro', label: 'Gemini 3 Pro' },
        { value: 'opus-4.5-thinking', label: 'Claude 4.5 Opus (Thinking)' },
        { value: 'gpt-5.2', label: 'GPT-5.2' },
        { value: 'gpt-5.1', label: 'GPT-5.1' },
        { value: 'gpt-5.1-high', label: 'GPT-5.1 High' },
        { value: 'composer-1', label: 'Composer 1' },
        { value: 'auto', label: 'Auto' },
        { value: 'sonnet-4.5', label: 'Claude 4.5 Sonnet' },
        { value: 'sonnet-4.5-thinking', label: 'Claude 4.5 Sonnet (Thinking)' },
        { value: 'opus-4.5', label: 'Claude 4.5 Opus' },
        { value: 'gpt-5.1-codex', label: 'GPT-5.1 Codex' },
        { value: 'gpt-5.1-codex-high', label: 'GPT-5.1 Codex High' },
        { value: 'gpt-5.1-codex-max', label: 'GPT-5.1 Codex Max' },
        { value: 'gpt-5.1-codex-max-high', label: 'GPT-5.1 Codex Max High' },
        { value: 'opus-4.1', label: 'Claude 4.1 Opus' },
        { value: 'grok', label: 'Grok' }
    ],
    DEFAULT: 'gpt-5'
};
/**
 * Codex (OpenAI) Models
 */
export const CODEX_MODELS = {
    OPTIONS: [
        { value: 'gpt-5.3-codex-xhigh', label: 'gpt-5.3-codex-xhigh' },
        { value: 'gpt-5.3-codex-high', label: 'gpt-5.3-codex-high' },
        { value: 'gpt-5.3-codex-medium', label: 'gpt-5.3-codex-medium' },
        { value: 'gpt-5.3-codex-low', label: 'gpt-5.3-codex-low' },
        { value: 'gpt-5.3-codex', label: 'gpt-5.3-codex' },
        { value: 'gpt-5.3-xhigh', label: 'gpt-5.3-xhigh' },
        { value: 'gpt-5.3-high', label: 'gpt-5.3-high' },
        { value: 'gpt-5.3-medium', label: 'gpt-5.3-medium' },
        { value: 'gpt-5.3-low', label: 'gpt-5.3-low' },
        { value: 'gpt-5.3-none', label: 'gpt-5.3-none' },
        { value: 'gpt-5.3', label: 'gpt-5.3' },
        { value: 'gpt-5.2-codex-xhigh', label: 'gpt-5.2-codex-xhigh' },
        { value: 'gpt-5.2-codex-high', label: 'gpt-5.2-codex-high' },
        { value: 'gpt-5.2-codex-medium', label: 'gpt-5.2-codex-medium' },
        { value: 'gpt-5.2-codex-low', label: 'gpt-5.2-codex-low' },
        { value: 'gpt-5.2-codex', label: 'gpt-5.2-codex' },
        { value: 'gpt-5.2-xhigh', label: 'gpt-5.2-xhigh' },
        { value: 'gpt-5.2-high', label: 'gpt-5.2-high' },
        { value: 'gpt-5.2-medium', label: 'gpt-5.2-medium' },
        { value: 'gpt-5.2-low', label: 'gpt-5.2-low' },
        { value: 'gpt-5.2-none', label: 'gpt-5.2-none' },
        { value: 'gpt-5.2', label: 'gpt-5.2' },
        { value: 'gpt-5.1-codex-max-xhigh', label: 'gpt-5.1-codex-max-xhigh' },
        { value: 'gpt-5.1-codex-max-high', label: 'gpt-5.1-codex-max-high' },
        { value: 'gpt-5.1-codex-max-medium', label: 'gpt-5.1-codex-max-medium' },
        { value: 'gpt-5.1-codex-max-low', label: 'gpt-5.1-codex-max-low' },
        { value: 'gpt-5.1-codex-max', label: 'gpt-5.1-codex-max' },
        { value: 'gpt-5.1-codex-high', label: 'gpt-5.1-codex-high' },
        { value: 'gpt-5.1-codex-medium', label: 'gpt-5.1-codex-medium' },
        { value: 'gpt-5.1-codex-low', label: 'gpt-5.1-codex-low' },
        { value: 'gpt-5.1-codex', label: 'gpt-5.1-codex' },
        { value: 'gpt-5.1-codex-mini-high', label: 'gpt-5.1-codex-mini-high' },
        { value: 'gpt-5.1-codex-mini-medium', label: 'gpt-5.1-codex-mini-medium' },
        { value: 'gpt-5.1-codex-mini', label: 'gpt-5.1-codex-mini' },
        { value: 'gpt-5.1-chat-latest', label: 'gpt-5.1-chat-latest' },
        { value: 'gpt-5.1-high', label: 'gpt-5.1-high' },
        { value: 'gpt-5.1-medium', label: 'gpt-5.1-medium' },
        { value: 'gpt-5.1-low', label: 'gpt-5.1-low' },
        { value: 'gpt-5.1-none', label: 'gpt-5.1-none' },
        { value: 'gpt-5.1', label: 'gpt-5.1' },
        { value: 'gpt-5-codex', label: 'gpt-5-codex' },
        { value: 'gpt-5-codex-mini-high', label: 'gpt-5-codex-mini-high' },
        { value: 'gpt-5-codex-mini-medium', label: 'gpt-5-codex-mini-medium' },
        { value: 'gpt-5-codex-mini', label: 'gpt-5-codex-mini' },
        { value: 'codex-mini-latest', label: 'codex-mini-latest' },
        { value: 'gpt-5-nano', label: 'gpt-5-nano' },
        { value: 'gpt-5-mini', label: 'gpt-5-mini' },
        { value: 'gpt-5', label: 'gpt-5' }
    ],
    DEFAULT: 'gpt-5.2'
};
