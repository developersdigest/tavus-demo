import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { saveScrapingJob } from '@/lib/storage';
import { ScrapingJob } from '@/types/scraping';

export async function POST(request: Request) {
  try {
    const { websiteUrl } = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      );
    }

    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    const mapResult = await app.mapUrl(websiteUrl, {
      includeSubdomains: false,
      limit: 100
    });

    const jobId = `job_${Date.now()}`;
    const job: ScrapingJob = {
      id: jobId,
      websiteUrl,
      status: 'mapping',
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      mapId: mapResult.id
    };

    await saveScrapingJob(job);

    setTimeout(async () => {
      try {
        const urls = mapResult.links || [];
        
        job.status = 'scraping';
        job.updatedAt = new Date();
        await saveScrapingJob(job);

        const batchScrapeResult = await app.batchScrapeUrls(urls, {
          formats: ['markdown', 'html'],
        });

        job.batchScrapeId = batchScrapeResult.id;
        await saveScrapingJob(job);

      } catch (error) {
        job.status = 'error';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.updatedAt = new Date();
        await saveScrapingJob(job);
      }
    }, 0);

    return NextResponse.json({
      jobId,
      message: 'Scraping job started',
      mapId: mapResult.id
    });

  } catch (error) {
    console.error('Error starting scrape:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping job' },
      { status: 500 }
    );
  }
}