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
    setReplicaId(process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID || '');
  }, []);

  const checkAllScrapingStatus = useCallback(async () => {
    const updatedJobs = await Promise.all(
      scrapingJobs.map(async (job) => {
        if (job.status === 'completed' || job.status === 'error') return job;
        
        try {
          const response = await fetch(`/api/scrape/status/${job.id}`);
          if (response.ok) {
            return await response.json();
          }
          return job;
        } catch (error) {
          console.error('Error checking status:', error);
          return job;
        }
      })
    );
    
    setScrapingJobs(updatedJobs);
    
    // Check if all jobs are completed
    if (updatedJobs.every(job => job.status === 'completed')) {
      createPersonaFromAllScrapedContent(updatedJobs);
    }
  }, [scrapingJobs]);

  useEffect(() => {
    if (scrapingJobs.some(job => job.status !== 'completed' && job.status !== 'error')) {
      const interval = setInterval(checkAllScrapingStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [scrapingJobs, checkAllScrapingStatus]);

  const createPersonaFromAllScrapedContent = async (jobs: ScrapingJob[]) => {
    try {
      const response = await fetch('/api/persona-context');
      const contexts = await response.json();
      
      // Collect all contexts from scraped URLs
      const combinedContexts = jobs.map(job => {
        const context = contexts.find((c: any) => c.websiteUrl === job.websiteUrl);
        return context ? `\n\nWebsite: ${job.websiteUrl}\n${context.context}` : '';
      }).filter(Boolean).join('\n---');
      
      if (combinedContexts) {
        // Create a persona using all scraped content
        const { tavusAPI } = await import('@/lib/tavus');
        const websiteNames = jobs.map(job => new URL(job.websiteUrl).hostname).join(', ');
        
        const persona = await tavusAPI.createPersona({
          replica_id: replicaId,
          persona_name: `Multi-Website Expert`,
          system_prompt: `You are an expert on the following websites: ${websiteNames}. Use the provided context to answer questions accurately and conversationally. Be friendly and helpful.`,
          context: combinedContexts,
          default_greeting: `Hello! I'm here to help you with information about ${websiteNames}. What would you like to know?`,
          enable_vision: true,
        });
        
        if (persona.persona_id) {
          setPersonaId(persona.persona_id);
          setShowConversation(true);
          setIsScraping(false);
        }
      }
    } catch (error) {
      console.error('Error creating persona:', error);
      setError('Failed to create conversation persona');
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
            const jobResponse = await fetch(`/api/scrape/status/${data.jobId}`);
            return await jobResponse.json();
          } else {
            throw new Error(`Failed to scrape ${websiteUrl}`);
          }
        })
      );
      
      setScrapingJobs(jobs);
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
  if (showConversation && personaId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Knowledge Base: {urlList.length} website{urlList.length !== 1 ? 's' : ''}
              </h2>
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
                personaId={personaId}
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
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'mapping' || job.status === 'scraping' || job.status === 'summarizing' || job.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Discovering pages</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'scraping' || job.status === 'summarizing' || job.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Extracting content</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Processing</span>
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