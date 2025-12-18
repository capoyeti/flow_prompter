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
  ];

  return NextResponse.json({ providers });
}
