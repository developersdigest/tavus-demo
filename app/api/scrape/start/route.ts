import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';
import { saveScrapingJob, savePersonaContext } from '@/lib/storage';
import { ScrapingJob, PageData } from '@/types/scraping';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function summarizeContent(job: ScrapingJob) {
  try {
    console.log(`Summarizing content for ${job.websiteUrl}`);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    
    const summaries: { [url: string]: string } = {};
    
    for (const page of job.pages) {
      if (page.markdown) {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that summarizes web pages concisely. Focus on the main content, key features, and important information.'
            },
            {
              role: 'user',
              content: `Please summarize the following webpage content:\n\n${page.markdown.substring(0, 4000)}`
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        const summary = response.choices[0]?.message?.content || '';
        summaries[page.url] = summary;
        page.summary = summary;
      }
    }

    const contextResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing websites and creating comprehensive context documents. Create a detailed context document that captures the essence of the website, its purpose, features, and key information that would be useful for having conversations about it.'
        },
        {
          role: 'user',
          content: `Based on these page summaries from ${job.websiteUrl}, create a comprehensive context document:\n\n${JSON.stringify(summaries, null, 2)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const finalContext = contextResponse.choices[0]?.message?.content || '';
    
    job.finalContext = finalContext;
    
    // Save persona context
    await savePersonaContext({
      websiteUrl: job.websiteUrl,
      context: finalContext,
      summaries: summaries,
      createdAt: new Date()
    });
    
    console.log(`Summarization completed for ${job.websiteUrl}`);
  } catch (error) {
    console.error('Error during summarization:', error);
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
      
      // Summarize immediately
      console.log(`Scraping completed for ${websiteUrl}, starting summarization`);
      await summarizeContent(job);
      
      await saveScrapingJob(job);
      console.log(`Job ${jobId} completed with summary`);

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