/**
 * Configuration constants for the server
 */

// Platform mode: true for managed/hosted deployments where authentication is handled by an external proxy
export const IS_PLATFORM = process.env.IS_PLATFORM === 'true' || process.env.VITE_IS_PLATFORM === 'true';
