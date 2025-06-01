import { NextResponse } from 'next/server';
import { getScrapingJob } from '@/lib/storage';

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

    return NextResponse.json(job);

  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check job status' },
      { status: 500 }
    );
  }
}