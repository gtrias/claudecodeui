/**
 * Chat utility functions for message processing and formatting
 */
/**
 * Decode HTML entities in text
 * Converts common HTML entities like &lt;, &gt;, &quot;, etc. to their character equivalents
 */
export function decodeHtmlEntities(text) {
    if (!text)
        return text;
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}
/**
 * Normalize markdown text where providers mistakenly wrap short inline code with single-line triple fences.
 * Only converts fences that do NOT contain any newline to avoid touching real code blocks.
 *
 * Example: ```code``` → `code`
 */
export function normalizeInlineCodeFences(text) {
    if (!text || typeof text !== 'string')
        return text;
    try {
        // ```code```  -> `code`
        return text.replace(/```\s*([^\n\r]+?)\s*```/g, '`$1`');
    }
    catch {
        return text;
    }
}
/**
 * Extract file mentions from text (e.g., @filename.txt)
 * Returns array of mentioned file paths
 */
export function extractFileMentions(text) {
    if (!text || typeof text !== 'string')
        return [];
    const mentions = [];
    // Match @filepath patterns
    const regex = /@([\w\-./]+\.\w+)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        mentions.push(match[1]);
    }
    return mentions;
}
/**
 * Format message content by applying necessary transformations
 * - Decodes HTML entities
 * - Normalizes inline code fences
 * - Trims whitespace
 */
export function formatMessageContent(content) {
    if (!content || typeof content !== 'string')
        return content;
    let formatted = content;
    formatted = decodeHtmlEntities(formatted);
    formatted = normalizeInlineCodeFences(formatted);
    formatted = formatted.trim();
    return formatted;
}
/**
 * Unescape special characters (\n, \t, \r) while protecting LaTeX formulas
 * LaTeX formulas are delimited by $...$ (inline) and $$...$$ (block)
 */
export function unescapeText(text) {
    if (!text || typeof text !== 'string')
        return text;
    try {
        // Simple approach: split on LaTeX delimiters, process non-LaTeX parts only
        // This is a simplified version - more robust parsing may be needed
        // For now, just do basic unescaping
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r');
    }
    catch {
        return text;
    }
}
/**
 * Check if text contains LaTeX formulas
 */
export function containsLatex(text) {
    if (!text || typeof text !== 'string')
        return false;
    // Check for $...$ or $$...$$ patterns
    return /\$\$[\s\S]+?\$\$|\$[\s\S]+?\$/.test(text);
}
/**
 * Sanitize user input for display
 */
export function sanitizeInput(input) {
    if (!input || typeof input !== 'string')
        return input;
    // Remove null bytes and other control characters (except newlines, tabs)
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
