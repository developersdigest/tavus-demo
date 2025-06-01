import { NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';
import { getScrapingJob, saveScrapingJob, savePersonaContext } from '@/lib/storage';
import { PageData } from '@/types/scraping';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await getScrapingJob(jobId);
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.status === 'completed' || job.status === 'error') {
      return NextResponse.json(job);
    }

    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlApiKey) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      );
    }

    const app = new FirecrawlApp({ apiKey: firecrawlApiKey });

    if (job.batchScrapeId && job.status === 'scraping') {
      const batchStatus = await app.checkBatchScrapeStatus(job.batchScrapeId);
      
      if (batchStatus.status === 'completed') {
        const pages: PageData[] = batchStatus.data?.map((item: any) => ({
          url: item.metadata?.url || '',
          title: item.metadata?.title || '',
          content: item.html || '',
          markdown: item.markdown || ''
        })) || [];

        job.pages = pages;
        job.status = 'summarizing';
        job.updatedAt = new Date();
        await saveScrapingJob(job);

        setTimeout(async () => {
          await summarizePages(job);
        }, 0);
      }
    }

    return NextResponse.json(job);

  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}

async function summarizePages(job: any) {
  try {
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
    job.status = 'completed';
    job.updatedAt = new Date();
    await saveScrapingJob(job);

    await savePersonaContext({
      websiteUrl: job.websiteUrl,
      context: finalContext,
      summaries,
      createdAt: new Date()
    });

  } catch (error) {
    job.status = 'error';
    job.error = error instanceof Error ? error.message : 'Summarization failed';
    job.updatedAt = new Date();
    await saveScrapingJob(job);
  }
}