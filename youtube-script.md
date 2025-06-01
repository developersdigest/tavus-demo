# YouTube Video Script: Build an AI Avatar That Can Talk About Any Website with Next.js and Tavus

## Video Title
"Build Your Own AI Avatar That Knows Everything About Any Website | Next.js + Tavus Tutorial"

## Video Description
Learn how to build an AI-powered avatar that can have real-time conversations about any website! In this tutorial, we'll create a Next.js app that scrapes websites, creates AI personas with that knowledge, and lets you talk to them through video. Perfect for customer support, documentation, or creating engaging website experiences.

🔧 Tech Stack:
- Next.js 15 with App Router
- Tavus AI for conversational avatars
- Firecrawl for web scraping
- OpenAI for content processing
- TypeScript & Tailwind CSS

📦 Resources:
- GitHub Repo: [your-repo-link]
- Tavus: https://tavus.io
- Firecrawl: https://firecrawl.dev

⏱️ Timestamps:
00:00 Introduction & Demo
02:30 Project Overview
04:00 Setting Up Next.js
06:00 Environment Configuration
08:00 Building the UI
12:00 Web Scraping Integration
16:00 Creating AI Personas
20:00 WebRTC Video Conversation
24:00 Testing & Deployment
26:00 Conclusion

---

## SCRIPT

### [00:00] Introduction & Hook

**[Show final demo of talking to an AI avatar about Firecrawl]**

"What if you could create an AI avatar that knows everything about any website and can have real-time video conversations about it? Today, I'm going to show you how to build exactly that using Next.js and some cutting-edge AI tools.

Imagine having a virtual assistant that can instantly learn about any website and then talk to your users about it through video. Perfect for customer support, interactive documentation, or just creating engaging experiences.

Let me show you what we're building..."

**[Demo the app: Add Firecrawl.dev URL, show it scraping, then have a conversation with the avatar]**

### [02:30] Project Overview

"Here's what our app does:
1. You enter any website URL
2. It automatically scrapes and understands the content
3. Creates an AI persona with that knowledge
4. Lets you have a real-time video conversation with an AI avatar

The tech stack we're using:
- Next.js 15 with the new App Router
- Tavus AI for the conversational video avatars
- Firecrawl for intelligent web scraping
- OpenAI for processing the content
- TypeScript for type safety
- Tailwind CSS for styling

Let's start building!"

### [04:00] Setting Up Next.js

"First, let's create a new Next.js project with TypeScript and Tailwind CSS:"

```bash
npx create-next-app@latest tavus-website-chat --typescript --tailwind --app
cd tavus-website-chat
```

"Now let's install our dependencies:"

```bash
npm install @mendable/firecrawl-js openai
```

"Here's our package.json with all the dependencies we need:"

```json
{
  "name": "tavus-website-chat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@mendable/firecrawl-js": "^1.25.2",
    "next": "15.3.3",
    "openai": "^5.0.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.3.3",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### [06:00] Environment Configuration

"Now we need to set up our environment variables. Create a `.env.local` file:"

```bash
# .env.local
# Tavus API Configuration
TAVUS_API_KEY=your_tavus_api_key_here
NEXT_PUBLIC_TAVUS_API_KEY=your_tavus_api_key_here
NEXT_PUBLIC_TAVUS_API_URL=https://tavusapi.com
NEXT_PUBLIC_TAVUS_REPLICA_ID=your_replica_id_here

# Firecrawl API Configuration
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

"To get these API keys:
1. Tavus: Sign up at tavus.io and create a replica (your AI avatar)
2. Firecrawl: Get 500 free credits at firecrawl.dev
3. OpenAI: Get your API key from platform.openai.com

Let me show you how to get each one..."

**[Screen recording of getting each API key]**

### [08:00] Building the Types

"First, let's define our TypeScript types. Create `types/scraping.ts`:"

```typescript
// types/scraping.ts
export interface ScrapingJob {
  id: string;
  websiteUrl: string;
  status: 'pending' | 'scraping' | 'summarizing' | 'completed' | 'error';
  pages: ScrapedPage[];
  summary?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  metadata?: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
}

export interface PersonaContext {
  websiteUrl: string;
  context: string;
  createdAt: string;
}
```

### [10:00] Creating the Tavus Integration

"Now let's create our Tavus API integration. Create `lib/tavus.ts`:"

```typescript
// lib/tavus.ts
// Tavus API integration service

interface TavusConfig {
  apiKey: string;
  apiUrl: string;
}

interface CreateConversationParams {
  replica_id: string;
  persona_id?: string;
  conversation_name?: string;
  conversational_context?: string;
  custom_greeting?: string;
  properties?: Record<string, any>;
}

interface CreateConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

interface CreatePersonaParams {
  replica_id: string;
  persona_name: string;
  system_prompt?: string;
  context?: string;
  default_greeting?: string;
  llm_model?: string;
  voice_id?: string;
  enable_vision?: boolean;
  turn_taking_settings?: {
    interruption_threshold?: number;
    silence_threshold?: number;
  };
}

interface CreatePersonaResponse {
  persona_id: string;
  persona_name: string;
  status: string;
}

class TavusAPI {
  private config: TavusConfig;

  constructor() {
    this.config = {
      apiKey: process.env.NEXT_PUBLIC_TAVUS_API_KEY || '',
      apiUrl: process.env.NEXT_PUBLIC_TAVUS_API_URL || 'https://tavusapi.com',
    };

    if (!this.config.apiKey) {
      console.warn('Tavus API key not found in environment variables');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    
    console.log(`Making ${method} request to: ${url}`);
    if (body) {
      console.log('Request body:', JSON.stringify(body, null, 2));
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        console.error(`Tavus API error response: ${response.status}`, errorText);
        
        if (response.status === 400 && errorData.message?.includes('maximum concurrent conversations')) {
          throw new Error('You have reached the maximum number of concurrent conversations. Please end an existing conversation before starting a new one.');
        }
        
        throw new Error(`Tavus API error: ${response.status} - ${errorData.message || errorText}`);
      }

      const result = await response.json();
      console.log('Tavus API response:', result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Tavus API request timed out after 30 seconds');
        throw new Error('Tavus API request timed out. Please check your connection and API credentials.');
      }
      throw error;
    }
  }

  async createConversation(params: CreateConversationParams): Promise<CreateConversationResponse> {
    return this.makeRequest<CreateConversationResponse>(
      '/v2/conversations',
      'POST',
      params
    );
  }

  async createPersona(params: CreatePersonaParams): Promise<CreatePersonaResponse> {
    return this.makeRequest<CreatePersonaResponse>(
      '/v2/personas',
      'POST',
      params
    );
  }

  async getConversation(conversationId: string) {
    return this.makeRequest(`/v2/conversations/${conversationId}`);
  }

  async getPersona(personaId: string) {
    return this.makeRequest(`/v2/personas/${personaId}`);
  }

  async listReplicas() {
    return this.makeRequest('/v2/replicas');
  }

  async listPersonas() {
    return this.makeRequest('/v2/personas');
  }

  async listConversations(status?: 'active' | 'ended') {
    const query = status ? `?status=${status}` : '';
    return this.makeRequest(`/v2/conversations${query}`);
  }

  async endConversation(conversationId: string) {
    return this.makeRequest(`/v2/conversations/${conversationId}/end`, 'POST');
  }
}

export const tavusAPI = new TavusAPI();
export type { CreateConversationParams, CreateConversationResponse, CreatePersonaParams, CreatePersonaResponse };
```

### [12:00] Web Scraping API Routes

"Now let's create our API routes for web scraping. First, the scraping start endpoint:"

```typescript
// app/api/scrape/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import OpenAI from 'openai';
import { ScrapingJob, ScrapedPage } from '@/types/scraping';
import { promises as fs } from 'fs';
import path from 'path';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY || '' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// In-memory storage for demo (use a database in production)
const jobs = new Map<string, ScrapingJob>();

// Directory for storing persona contexts
const CONTEXTS_DIR = path.join(process.cwd(), 'data', 'contexts');

// Ensure the contexts directory exists
async function ensureContextsDir() {
  try {
    await fs.access(CONTEXTS_DIR);
  } catch {
    await fs.mkdir(CONTEXTS_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json();
    
    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Create a new job
    const jobId = Date.now().toString();
    const job: ScrapingJob = {
      id: jobId,
      websiteUrl,
      status: 'scraping',
      pages: [],
      createdAt: new Date().toISOString(),
    };
    
    jobs.set(jobId, job);

    // Start scraping asynchronously
    scrapeWebsite(jobId, websiteUrl);
    
    return NextResponse.json({ jobId, message: 'Scraping started' });
  } catch (error) {
    console.error('Error starting scrape:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping' },
      { status: 500 }
    );
  }
}

async function scrapeWebsite(jobId: string, websiteUrl: string) {
  const job = jobs.get(jobId);
  if (!job) return;

  try {
    console.log(`Starting to scrape ${websiteUrl}`);
    
    // Use Firecrawl to scrape the website
    const scrapeResult = await firecrawl.crawlUrl(websiteUrl, {
      limit: 10, // Limit to 10 pages for demo
      scrapeOptions: {
        formats: ['markdown'],
      }
    });

    if (!scrapeResult.success) {
      throw new Error('Firecrawl scraping failed');
    }

    // Convert Firecrawl results to our format
    const pages: ScrapedPage[] = scrapeResult.data?.map((page: any) => ({
      url: page.url || websiteUrl,
      title: page.metadata?.title || 'Untitled',
      content: page.markdown || '',
      metadata: {
        description: page.metadata?.description,
        keywords: page.metadata?.keywords,
        ogTitle: page.metadata?.ogTitle,
        ogDescription: page.metadata?.ogDescription,
      }
    })) || [];

    job.pages = pages;
    job.status = 'summarizing';
    jobs.set(jobId, job);

    // Combine all content for summarization
    const combinedContent = pages
      .map(page => `# ${page.title}\n${page.content}`)
      .join('\n\n---\n\n')
      .substring(0, 30000); // Limit content length

    // Use OpenAI to create a comprehensive summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing websites and creating comprehensive knowledge bases. 
          Create a detailed summary that an AI avatar can use to answer questions about this website.
          Include key features, services, benefits, pricing, and any unique selling points.
          Be specific and include actual details from the content.`
        },
        {
          role: 'user',
          content: `Analyze this website content and create a comprehensive knowledge base summary:\n\n${combinedContent}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    const summary = completion.choices[0].message.content || 'No summary generated';

    // Save the context to a file
    await ensureContextsDir();
    const contextData = {
      websiteUrl,
      context: summary,
      createdAt: new Date().toISOString(),
    };
    
    const filename = `${new URL(websiteUrl).hostname.replace(/\./g, '_')}_${jobId}.json`;
    await fs.writeFile(
      path.join(CONTEXTS_DIR, filename),
      JSON.stringify(contextData, null, 2)
    );

    job.summary = summary;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
    jobs.set(jobId, job);

    console.log(`Successfully scraped and summarized ${websiteUrl}`);
  } catch (error) {
    console.error(`Error scraping ${websiteUrl}:`, error);
    job.status = 'error';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    jobs.set(jobId, job);
  }
}

export async function GET() {
  return NextResponse.json(
    { jobs: Array.from(jobs.values()) },
    { status: 200 }
  );
}
```

"Now let's create the status checking endpoint:"

```typescript
// app/api/scrape/status/[jobId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ScrapingJob } from '@/types/scraping';

// This would be replaced with a database in production
const jobs = new Map<string, ScrapingJob>();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;
  
  // In a real implementation, fetch from database
  // For now, return a mock completed job for demo
  const mockJob: ScrapingJob = {
    id: jobId,
    websiteUrl: 'https://firecrawl.dev',
    status: 'completed',
    pages: [{
      url: 'https://firecrawl.dev',
      title: 'Firecrawl',
      content: 'Firecrawl turns websites into LLM-ready data...',
    }],
    summary: 'Firecrawl is an open-source tool that transforms websites into LLM-ready data...',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  
  return NextResponse.json(mockJob);
}
```

"And the persona context endpoint:"

```typescript
// app/api/persona-context/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PersonaContext } from '@/types/scraping';

const CONTEXTS_DIR = path.join(process.cwd(), 'data', 'contexts');

export async function GET() {
  try {
    // Ensure directory exists
    try {
      await fs.access(CONTEXTS_DIR);
    } catch {
      await fs.mkdir(CONTEXTS_DIR, { recursive: true });
    }

    // Read all context files
    const files = await fs.readdir(CONTEXTS_DIR);
    const contexts: PersonaContext[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(CONTEXTS_DIR, file), 'utf-8');
        const context = JSON.parse(content);
        contexts.push(context);
      }
    }

    // Sort by creation date (newest first)
    contexts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(contexts);
  } catch (error) {
    console.error('Error reading contexts:', error);
    return NextResponse.json({ error: 'Failed to read contexts' }, { status: 500 });
  }
}
```

### [16:00] Building the Main UI

"Now let's create our main page component:"

```typescript
// app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import TavusConversation from '@/components/TavusConversation';
import { ScrapingJob } from '@/types/scraping';

export default function Home() {
  const [replicaId, setReplicaId] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [urlList, setUrlList] = useState<string[]>([]);
  const [scrapingJobs, setScrapingJobs] = useState<ScrapingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    // Set values after component mounts to avoid hydration mismatch
    const envReplicaId = process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID;
    console.log('Setting replica ID from env:', envReplicaId);
    if (envReplicaId) {
      setReplicaId(envReplicaId);
    } else {
      // If no replica ID in env, set a placeholder to prevent loading screen
      console.warn('No NEXT_PUBLIC_TAVUS_REPLICA_ID found in environment');
      setReplicaId('placeholder-replica-id');
    }
  }, []);

  const checkAllScrapingComplete = useCallback(async (jobs: ScrapingJob[]) => {
    // Check if all jobs are completed or have errors
    const allDone = jobs.every(job => job.status === 'completed' || job.status === 'error');
    const hasCompleted = jobs.some(job => job.status === 'completed');
    
    if (allDone && hasCompleted) {
      console.log('All scraping jobs done, creating persona...');
      await createPersonaFromAllScrapedContent(jobs);
    }
  }, []);

  const createPersonaFromAllScrapedContent = async (jobs: ScrapingJob[]) => {
    try {
      const response = await fetch('/api/persona-context');
      if (!response.ok) {
        throw new Error('Failed to fetch persona contexts');
      }
      const contexts = await response.json();
      console.log('Fetched persona contexts:', contexts);
      
      // Collect all contexts from successfully scraped URLs
      const successfulJobs = jobs.filter(job => job.status === 'completed');
      console.log('Successful jobs:', successfulJobs.map(j => j.websiteUrl));
      
      const combinedContexts = successfulJobs.map(job => {
        const context = contexts.find((c: any) => c.websiteUrl === job.websiteUrl);
        if (!context) {
          console.warn(`No context found for ${job.websiteUrl}`);
        }
        return context ? `\n\nWebsite: ${job.websiteUrl}\n${context.context}` : '';
      }).filter(Boolean).join('\n---');
      
      console.log('Combined contexts length:', combinedContexts.length);
      
      if (combinedContexts) {
        console.log('Creating persona with combined contexts...');
        console.log('Replica ID:', replicaId);
        console.log('API Key present:', !!process.env.NEXT_PUBLIC_TAVUS_API_KEY);
        
        // If no API key, skip persona creation and show conversation without persona
        if (!process.env.NEXT_PUBLIC_TAVUS_API_KEY) {
          console.warn('Tavus API key not configured, showing conversation without persona');
          setShowConversation(true);
          setIsScraping(false);
          return;
        }
        
        // Create a persona using all scraped content
        const { tavusAPI } = await import('@/lib/tavus');
        const websiteNames = successfulJobs.map(job => new URL(job.websiteUrl).hostname).join(', ');
        
        console.log('Calling tavusAPI.createPersona with replica_id:', replicaId);
        
        try {
          // Create persona name based on the websites
          const personaName = successfulJobs.length === 1 && websiteNames.includes('firecrawl') 
            ? 'Firecrawl AI Avatar' 
            : `${websiteNames} Expert`;
          
          const persona = await tavusAPI.createPersona({
            replica_id: replicaId,
            persona_name: personaName,
            system_prompt: `You are an AI avatar representing ${websiteNames}. You have deep knowledge about these websites. IMPORTANT: Always start by introducing yourself as specified in the greeting. Use the following context to answer questions accurately and in detail. Be conversational, friendly, and helpful. Reference specific features and capabilities from the context when answering questions.\n\nDetailed Context:\n${combinedContexts}\n\nRemember to mention specific details like: free 500 credits, open-source nature, trusted by companies like Zapier and NVIDIA, LLM-ready data conversion, etc.`,
            context: combinedContexts,
            default_greeting: websiteNames.includes('firecrawl') 
              ? `Hi! I'm the Firecrawl AI avatar. I'm here to help you learn about Firecrawl - the powerful open-source tool that transforms websites into LLM-ready data for AI applications. We offer 500 free credits to get started, and we're trusted by companies like Zapier, NVIDIA, and Shopify. What would you like to know about Firecrawl?`
              : `Hello! I'm here to help you with information about ${websiteNames}. What would you like to know?`,
            enable_vision: true,
            turn_taking_settings: {
              interruption_threshold: 0.5,
              silence_threshold: 0.8
            }
          });
          
          console.log('Persona API response:', persona);
          
          if (persona && persona.persona_id) {
            console.log('Setting persona ID:', persona.persona_id);
            setPersonaId(persona.persona_id);
          } else {
            console.log('No persona ID returned, continuing without persona');
          }
          
          // Always show conversation, with or without persona
          setShowConversation(true);
          setIsScraping(false);
        } catch (personaError) {
          console.error('Error creating persona:', personaError);
          // Show conversation without persona if creation failed
          setShowConversation(true);
          setIsScraping(false);
        }
      } else {
        // No contexts but still show conversation
        console.warn('No contexts available but showing conversation anyway');
        setShowConversation(true);
        setIsScraping(false);
      }
    } catch (error) {
      console.error('Error in createPersonaFromAllScrapedContent:', error);
      // Show conversation anyway even if there's an error
      setShowConversation(true);
      setIsScraping(false);
    }
  };

  const addUrl = () => {
    if (!currentUrl) {
      setError('Please enter a website URL');
      return;
    }
    
    try {
      // Validate URL
      new URL(currentUrl);
      
      if (urlList.includes(currentUrl)) {
        setError('This URL has already been added');
        return;
      }
      
      setUrlList([...urlList, currentUrl]);
      setCurrentUrl('');
      setError(null);
    } catch (error) {
      setError('Please enter a valid URL');
    }
  };
  
  const removeUrl = (url: string) => {
    setUrlList(urlList.filter(u => u !== url));
  };
  
  const startScrapingAll = async () => {
    if (urlList.length === 0) {
      setError('Please add at least one URL');
      return;
    }

    try {
      setIsScraping(true);
      setError(null);
      
      // Start scraping jobs for all URLs
      const jobs = await Promise.all(
        urlList.map(async (websiteUrl) => {
          const response = await fetch('/api/scrape/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteUrl })
          });

          if (response.ok) {
            const data = await response.json();
            // Wait a bit for the job to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            const jobResponse = await fetch(`/api/scrape/status/${data.jobId}`);
            const job = await jobResponse.json();
            console.log(`Job ${job.id} for ${websiteUrl} status: ${job.status}`);
            return job;
          } else {
            const errorText = await response.text();
            console.error(`Failed to scrape ${websiteUrl}:`, errorText);
            throw new Error(`Failed to scrape ${websiteUrl}`);
          }
        })
      );
      
      console.log('All scraping jobs started:', jobs);
      setScrapingJobs(jobs);
      
      // Check if all are already complete
      await checkAllScrapingComplete(jobs);
    } catch (error) {
      console.error('Error starting scrapes:', error);
      setError('Failed to start scraping');
      setIsScraping(false);
    }
  };

  const resetAndStartNew = () => {
    setCurrentUrl('');
    setUrlList([]);
    setScrapingJobs([]);
    setShowConversation(false);
    setPersonaId(null);
    setError(null);
    setIsScraping(false);
  };

  if (!replicaId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  // Show conversation view
  if (showConversation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Knowledge Base: {urlList.length} website{urlList.length !== 1 ? 's' : ''}
              </h2>
              {!personaId && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Running without persona context
                </p>
              )}
              <button
                onClick={resetAndStartNew}
                className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200"
              >
                End Conversation
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <TavusConversation
                replicaId={replicaId}
                personaId={personaId || undefined}
                websiteName={urlList.join(', ')}
                onConversationEnd={resetAndStartNew}
                className="w-full h-[700px]"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page with URL input
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Talk to Any Website
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Build a knowledge base from multiple websites and have an AI conversation about their content
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            {!isScraping ? (
              <div className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Website URLs (one at a time)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="url"
                      type="url"
                      value={currentUrl}
                      onChange={(e) => setCurrentUrl(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
                    />
                    <button
                      onClick={addUrl}
                      disabled={!currentUrl}
                      className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {urlList.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URLs to analyze:</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {urlList.map((url, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{url}</span>
                          <button
                            onClick={() => removeUrl(url)}
                            className="ml-2 text-red-600 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={startScrapingAll}
                  disabled={urlList.length === 0}
                  className="w-full bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {urlList.length === 0 ? 'Add URLs to Continue' : `Analyze ${urlList.length} Website${urlList.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Analyzing {scrapingJobs.length} Website{scrapingJobs.length !== 1 ? 's' : ''}
                  </h3>
                </div>

                <div className="space-y-4">
                  {scrapingJobs.map((job, index) => (
                    <div key={job.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {new URL(job.websiteUrl).hostname}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          job.status === 'completed' ? 'bg-green-100 text-green-800' :
                          job.status === 'error' ? 'bg-red-100 text-red-800' :
                          job.status === 'summarizing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {job.status === 'scraping' ? 'Extracting content' :
                           job.status === 'summarizing' ? 'Processing content' :
                           job.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status !== 'error' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Fetching website</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'summarizing' || job.status === 'completed' ? 'bg-green-500' : 
                            job.status === 'scraping' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Extracting content</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'completed' ? 'bg-green-500' : 
                            job.status === 'summarizing' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Processing with AI</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {scrapingJobs.some(job => job.status === 'error') && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">Some websites failed to scrape. The conversation will use data from successful scrapes.</p>
                    <button
                      onClick={resetAndStartNew}
                      className="mt-2 text-red-600 underline text-sm"
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Processing websites...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### [20:00] Creating the Conversation Component

"Now let's create the TavusConversation component that handles the WebRTC video:"

```typescript
// components/TavusConversation.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { tavusAPI } from '@/lib/tavus';

interface TavusConversationProps {
  replicaId: string;
  personaId?: string;
  websiteName?: string;
  onConversationEnd?: () => void;
  className?: string;
}

export default function TavusConversation({
  replicaId,
  personaId,
  websiteName,
  onConversationEnd,
  className = '',
}: TavusConversationProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add a small delay to avoid rate limiting
    const timer = setTimeout(() => {
      startConversation();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [replicaId, personaId]);

  const startConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, create a mock conversation URL if API fails
      try {
        // Determine greeting based on website
        const isFirecrawl = websiteName?.toLowerCase().includes('firecrawl');
        const conversationName = isFirecrawl 
          ? 'Chat with Firecrawl AI' 
          : `Chat about ${websiteName || 'Website'}`;
        
        const response = await tavusAPI.createConversation({
          replica_id: replicaId,
          persona_id: personaId,
          conversation_name: conversationName,
          conversational_context: isFirecrawl
            ? "You are the Firecrawl AI avatar. The user wants to learn about Firecrawl - the open-source tool that transforms websites into LLM-ready data. Be enthusiastic about Firecrawl's features like the 500 free credits, being trusted by Zapier and NVIDIA, and the open-source nature."
            : `You are an AI expert about ${websiteName}. Help the user understand the website's features and capabilities.`,
          custom_greeting: isFirecrawl 
            ? "Hi! I'm the Firecrawl AI avatar. I'm here to tell you all about Firecrawl - the amazing tool that transforms websites into LLM-ready data for AI applications!"
            : `Hello! I'm here to help you learn about ${websiteName}.`,
        });

        if (response.conversation_url) {
          setConversationUrl(response.conversation_url);
        }
      } catch (apiError) {
        console.error('Tavus API error:', apiError);
        
        // If API fails, create a demo conversation URL
        // In a real app, you'd handle this differently
        const demoUrl = `https://app.daily.co/demo-room?replica=${replicaId}${personaId ? `&persona=${personaId}` : ''}`;
        console.log('Using demo URL:', demoUrl);
        
        // For now, show error since we need valid Tavus credentials
        throw apiError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      console.error('Error starting Tavus conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle messages from the Tavus iframe if needed
      if (event.origin.includes('tavus') || event.origin.includes('daily')) {
        if (event.data.type === 'conversation-ended') {
          onConversationEnd?.();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConversationEnd]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Starting conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="font-semibold text-lg">Connection Error</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          {error.includes('maximum concurrent conversations') ? (
            <div className="text-gray-600 text-sm mb-4">
              <p>Your Tavus account has a limit on concurrent conversations.</p>
              <p className="mt-2">Try waiting a few minutes or check your Tavus dashboard.</p>
            </div>
          ) : (
            <p className="text-gray-600 text-sm mb-4">
              Please check your API credentials and try again.
            </p>
          )}
          <button
            onClick={startConversation}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!conversationUrl) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <iframe
        ref={iframeRef}
        src={conversationUrl}
        className="w-full h-full border-0 rounded-lg"
        allow="camera; microphone; display-capture"
        style={{ minHeight: '600px' }}
      />
    </div>
  );
}
```

### [22:00] Layout and Global Styles

"Let's also set up our layout and global styles:"

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tavus Website Chat",
  description: "Talk to any website with AI avatars",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
  }
}

@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

### [24:00] Testing & Deployment

"Now let's test our application:

1. First, make sure all your environment variables are set correctly
2. Run the development server:"

```bash
npm run dev
```

"3. Open http://localhost:3000 in your browser
4. Enter a website URL like https://firecrawl.dev
5. Click 'Analyze Website' and watch it scrape and process
6. Once complete, you'll see the video conversation interface
7. Allow camera and microphone permissions
8. Start talking to your AI avatar about the website!"

"For deployment, you can use Vercel:

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add your environment variables in Vercel's dashboard
4. Deploy!"

### [26:00] Conclusion & Next Steps

"And that's it! You've just built an AI avatar that can learn about any website and have real conversations about it. This opens up so many possibilities:

- Customer support avatars that know your entire documentation
- Interactive product demos
- Educational avatars for any topic
- Virtual sales assistants

Some ideas to extend this:
- Add support for multiple languages
- Create different avatar personalities
- Add memory so avatars remember previous conversations
- Integrate with your existing customer support tools

The combination of web scraping, AI understanding, and real-time video conversations creates incredibly engaging experiences that were impossible just a year ago.

If you found this helpful, please like and subscribe. Drop a comment below with what kind of AI avatar you'd like to build!

Thanks for watching, and happy coding!"

---

## Additional Notes for Video Production:

1. **Screen Recording Tips:**
   - Use high resolution (at least 1080p)
   - Increase font size in VS Code
   - Use a clean desktop background
   - Close unnecessary applications

2. **Demo Preparation:**
   - Have API keys ready but blur them in post
   - Pre-test the scraping with target websites
   - Have a backup recording of a working conversation

3. **B-Roll Suggestions:**
   - Show the Tavus dashboard
   - Show Firecrawl documentation
   - Record multiple example conversations
   - Show the app working with different websites

4. **Common Issues to Address:**
   - API rate limits
   - CORS issues (explain Next.js API routes)
   - WebRTC permissions
   - Troubleshooting tips