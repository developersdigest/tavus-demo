import { NextResponse } from 'next/server';
import { getAllScrapingJobs } from '@/lib/storage';

export async function GET() {
  try {
    const jobs = await getAllScrapingJobs();
    
    return NextResponse.json({
      totalJobs: jobs.length,
      jobs: jobs.map(job => ({
        id: job.id,
        websiteUrl: job.websiteUrl,
        status: job.status,
        pagesCount: job.pages.length,
        hasContext: !!job.finalContext,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch scraping jobs' },
      { status: 500 }
    );
  }
}

// Clear all scraping jobs (useful for debugging)
export async function DELETE() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const DATA_DIR = path.join(process.cwd(), 'data');
    const JOBS_FILE = path.join(DATA_DIR, 'scraping-jobs.json');
    
    await fs.writeFile(JOBS_FILE, '[]');
    
    return NextResponse.json({ message: 'All scraping jobs cleared' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear scraping jobs' },
      { status: 500 }
    );
  }
}