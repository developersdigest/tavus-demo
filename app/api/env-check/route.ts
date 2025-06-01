import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasFirecrawlKey: !!process.env.FIRECRAWL_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    hasTavusApiKey: !!process.env.NEXT_PUBLIC_TAVUS_API_KEY,
    hasTavusReplicaId: !!process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID,
    nodeEnv: process.env.NODE_ENV,
    firecrawlKeyPrefix: process.env.FIRECRAWL_API_KEY?.substring(0, 5) || 'none',
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 5) || 'none',
    tavusKeyPrefix: process.env.NEXT_PUBLIC_TAVUS_API_KEY?.substring(0, 5) || 'none'
  });
}