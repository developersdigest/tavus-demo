import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_TAVUS_API_KEY;
  const replicaId = process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID;
  
  if (!apiKey || !replicaId) {
    return NextResponse.json({
      error: 'Missing Tavus credentials',
      hasApiKey: !!apiKey,
      hasReplicaId: !!replicaId
    }, { status: 400 });
  }

  try {
    // Test the Tavus API endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('https://api.tavus.io/v2/replicas', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: 'Tavus API error',
        status: response.status,
        message: errorText
      }, { status: response.status });
    }
    
    const data = await response.json();
    
    // Check if the replica ID exists
    const replicaExists = data.data?.some((replica: any) => replica.replica_id === replicaId);
    
    return NextResponse.json({
      success: true,
      apiKeyValid: true,
      replicaId: replicaId,
      replicaExists: replicaExists,
      totalReplicas: data.data?.length || 0,
      message: replicaExists ? 'Credentials are valid!' : 'API key is valid but replica ID not found'
    });
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({
        error: 'Tavus API timeout',
        message: 'The Tavus API is not responding. This might be a temporary issue.'
      }, { status: 504 });
    }
    
    return NextResponse.json({
      error: 'Connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}