// Providers endpoint - returns which providers have server-side API keys configured
// This allows the client to know which models are available without exposing actual keys

import { NextResponse } from 'next/server';
import { ProviderType } from '@/config/providers';

interface ProviderStatus {
  provider: ProviderType;
  configured: boolean;
}

export async function GET() {
  const providers: ProviderStatus[] = [
    {
      provider: 'openai',
      configured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    },
    {
      provider: 'anthropic',
      configured: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    },
    {
      provider: 'google',
      configured: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()),
    },
    {
      provider: 'mistral',
      configured: Boolean(process.env.MISTRAL_API_KEY?.trim()),
    },
    {
      provider: 'deepseek',
      configured: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
    },
    {
      provider: 'perplexity',
      configured: Boolean(process.env.PERPLEXITY_API_KEY?.trim()),
    },
    {
      provider: 'ollama',
      // Ollama is considered "configured" if it's running locally (we'll check connectivity)
      // For now, mark as configured if OLLAMA_BASE_URL is set or assume localhost default
      configured: true, // Ollama doesn't need an API key, just needs to be running
    },
  ];

  return NextResponse.json({ providers });
}
