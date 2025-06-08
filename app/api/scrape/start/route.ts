import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { saveScrapingJob, savePersonaContext } from '@/lib/storage';
import { ScrapingJob, PageData } from '@/types/scraping';

async function saveContentAsContext(job: ScrapingJob) {
  try {
    console.log(`Saving content for ${job.websiteUrl}`);
    
    // Collect all page content
    const pageContents: { [url: string]: string } = {};
    
    for (const page of job.pages) {
      if (page.markdown) {
        // Store the raw markdown content for each page
        pageContents[page.url] = page.markdown;
      }
    }

    // Create a structured context document with raw content
    const contextDocument = `Website: ${job.websiteUrl}
Scraped on: ${new Date().toISOString()}

` +
      Object.entries(pageContents).map(([url, content]) => 
        `Page URL: ${url}
---
${content}

`
      ).join('\n\n');
    
    job.finalContext = contextDocument;
    
    // Save persona context with raw content
    await savePersonaContext({
      websiteUrl: job.websiteUrl,
      context: contextDocument,
      summaries: pageContents,
      createdAt: new Date()
    });
    
    console.log(`Content saved for ${job.websiteUrl}`);
  } catch (error) {
    console.error('Error saving content:', error);
    throw error;
  }
}

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
    
    const jobId = `job_${Date.now()}`;
    const job: ScrapingJob = {
      id: jobId,
      websiteUrl,
      status: 'scraping',
      pages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await saveScrapingJob(job);

    // Start the actual scraping
    try {
      console.log(`Starting scrape for ${websiteUrl}`);
      const scrapeResult = await app.scrapeUrl(websiteUrl, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Scraping failed');
      }

      const page: PageData = {
        url: websiteUrl,
        title: scrapeResult.metadata?.title || '',
        content: scrapeResult.html || '',
        markdown: scrapeResult.markdown || ''
      };

      // Update job with scraped pages
      job.pages = [page];
      job.status = 'completed'; // Go directly to completed
      job.updatedAt = new Date();
      
      // Save content immediately
      console.log(`Scraping completed for ${websiteUrl}, saving content`);
      await saveContentAsContext(job);
      
      await saveScrapingJob(job);
      console.log(`Job ${jobId} completed with content saved`);

    } catch (error) {
      console.error(`Scraping error for ${websiteUrl}:`, error);
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.updatedAt = new Date();
      await saveScrapingJob(job);
    }

    return NextResponse.json({
      jobId,
      message: 'Scraping job started'
    });

  } catch (error) {
    console.error('Error starting scrape:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping job' },
      { status: 500 }
    );
  }
}