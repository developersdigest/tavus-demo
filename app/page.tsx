'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ContextData {
  personaId: string;
  personaName: string;
  websiteUrl: string;
  createdAt: string;
  contextSize: number;
  pagesIncluded: number;
  knowledgeBase: string;
  scrapedContent: string;
}

export default function TavusChatbot() {
  const [conversationUrl, setConversationUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [, setContextData] = useState<ContextData | null>(null);
  const [websiteName, setWebsiteName] = useState<string>('');

  // Start Tavus conversation on mount
  useEffect(() => {
    startConversation();
  }, []);

  const startConversation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_TAVUS_API_KEY;
      const replicaId = process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID;
      const personaId = process.env.NEXT_PUBLIC_TAVUS_PERSONA_ID;

      console.log('🔧 Starting Tavus conversation...');
      console.log('📋 Configuration:', {
        hasApiKey: !!apiKey,
        replicaId: replicaId || 'NOT SET',
        personaId: personaId || 'NOT SET',
      });

      if (!apiKey || !replicaId) {
        throw new Error('Missing Tavus configuration. Please check your environment variables.');
      }

      // Load context from current-context.json
      let conversationalContext = 'You are a helpful AI assistant.';
      let siteName = 'Website';
      
      try {
        const contextResponse = await fetch('/tavus-context/current-context.json');
        if (contextResponse.ok) {
          const data = await contextResponse.json();
          setContextData(data);
          
          if (data.knowledgeBase) {
            // Try to extract website name from knowledge base or use websiteUrl
            if (!data.websiteUrl || data.websiteUrl === '') {
              // Extract from knowledge base title
              const match = data.knowledgeBase.match(/^#\s*(.+?)\s*Knowledge Base/m);
              siteName = match ? match[1] : 'Website';
            } else {
              siteName = data.websiteUrl;
            }
            
            setWebsiteName(siteName);
            
            conversationalContext = `You are an AI assistant with expert knowledge about ${siteName}. 
            
${data.knowledgeBase}

${data.scrapedContent || ''}

Always base your responses on this knowledge. If asked about something not in your knowledge base, politely say you don't have that information.`;
          }
        }
      } catch {
        console.log('Using default context');
      }

      const requestBody: Record<string, unknown> = {
        replica_id: replicaId,
        conversation_name: `${siteName} Expert`,
        conversational_context: conversationalContext,
        custom_greeting: `Hello! I'm your ${siteName} expert. I have extensive knowledge about ${siteName}. How can I help you today?`,
        properties: {
          enable_recording: false,
          enable_closed_captions: true,
        }
      };
      
      // Only add persona_id if it exists
      if (personaId) {
        requestBody.persona_id = personaId;
      }

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        // Parse common errors for better user messages
        let errorMessage = 'Failed to start conversation';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes('maximum concurrent conversations')) {
            errorMessage = 'Please wait a moment - another conversation is currently active. Try again in a few seconds.';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // If parsing fails, use generic message
          errorMessage = 'Unable to start conversation. Please try again.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Conversation created:', {
        conversationUrl: data.conversation_url,
        conversationId: data.conversation_id,
      });
      
      setConversationUrl(data.conversation_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF3F5] flex flex-col items-center py-8">
      <div className="w-full max-w-4xl px-4">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {websiteName ? `${websiteName} AI Assistant` : 'Initializing...'}
          </motion.h1>
        </div>

        {/* Content Area */}
        <div className="bg-[#EFF3F5] rounded-lg shadow-lg overflow-hidden" style={{ minHeight: '700px', height: 'calc(100vh - 200px)' }}>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
                <p className="text-gray-700">Initializing...</p>
              </div>
            </div>
          )}
            
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <p className="text-gray-700 mb-6">{error}</p>
                <button
                  onClick={startConversation}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
            
          {conversationUrl && !loading && !error && (
            <motion.div
              className="w-full h-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <iframe
                src={conversationUrl}
                className="w-full h-full border-0"
                allow="camera; microphone; display-capture"
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}