import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

export async function GET() {
  try {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    
    if (!firecrawlApiKey) {
      return NextResponse.json({ error: 'No API key' });
    }

    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    const result = await app.scrapeUrl('https://www.example.com', {
      formats: ['markdown'],
    });

    return NextResponse.json({ 
      success: result.success,
      markdown: result.markdown?.substring(0, 200),
      error: result.error
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}