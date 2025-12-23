import { NextRequest } from 'next/server';

/**
 * Validate API key for external API access
 * API keys are configured via API_KEYS environment variable (comma-separated)
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey) {
    return false;
  }

  const validKeys = process.env.API_KEYS?.split(',').map(k => k.trim()).filter(Boolean) || [];

  if (validKeys.length === 0) {
    // If no API keys are configured, allow access (dev mode)
    console.warn('Warning: No API_KEYS configured. External API access is unrestricted.');
    return true;
  }

  return validKeys.includes(apiKey);
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: 'Unauthorized', message: 'Invalid or missing API key' },
    { status: 401 }
  );
}

/**
 * Middleware helper to check API key
 * Returns null if authorized, or an error response if not
 */
export function requireApiKey(request: NextRequest): Response | null {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }
  return null;
}
