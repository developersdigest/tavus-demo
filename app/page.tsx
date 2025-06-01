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

  // Remove polling - scraping is now synchronous

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
            // llm_model: 'gpt-4-turbo', // Comment out - might not be a valid option
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