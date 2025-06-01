import { NextResponse } from 'next/server';
import { getPersonaContext, getAllPersonaContexts } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteUrl = searchParams.get('websiteUrl');

    if (websiteUrl) {
      const context = await getPersonaContext(websiteUrl);
      if (!context) {
        return NextResponse.json(
          { error: 'Context not found for this website' },
          { status: 404 }
        );
      }
      return NextResponse.json(context);
    }

    const contexts = await getAllPersonaContexts();
    return NextResponse.json(contexts);

  } catch (error) {
    console.error('Error fetching persona context:', error);
    return NextResponse.json(
      { error: 'Failed to fetch persona context' },
      { status: 500 }
    );
  }
}