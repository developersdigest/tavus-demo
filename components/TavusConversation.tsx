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