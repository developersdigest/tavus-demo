'use client';

import { useState, useEffect } from 'react';
import TavusConversation from '@/components/TavusConversation';
import PersonaManager from '@/components/PersonaManager';

export default function Home() {
  const [showConversation, setShowConversation] = useState(false);
  const [replicaId, setReplicaId] = useState('');
  const [personaId, setPersonaId] = useState('');
  const [showPersonaManager, setShowPersonaManager] = useState(false);

  useEffect(() => {
    // Set values after component mounts to avoid hydration mismatch
    setReplicaId(process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID || '');
    setPersonaId(process.env.NEXT_PUBLIC_TAVUS_PERSONA_ID || '');
    if (process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID) {
      setShowConversation(true);
    }
  }, []);

  const startConversation = () => {
    if (!replicaId) {
      alert('Please enter a Replica ID');
      return;
    }
    setShowConversation(true);
  };

  const endConversation = () => {
    setShowConversation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Tavus AI Avatar Conversation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Have real-time conversations with AI avatars powered by Tavus
          </p>
        </div>

        {!showConversation ? (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="replicaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Replica ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="replicaId"
                  value={replicaId}
                  onChange={(e) => setReplicaId(e.target.value)}
                  placeholder="Enter your Tavus Replica ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You can find this in your Tavus dashboard
                </p>
              </div>

              <div>
                <label htmlFor="personaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Persona ID (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="personaId"
                    value={personaId}
                    onChange={(e) => setPersonaId(e.target.value)}
                    placeholder="Enter a Persona ID (optional)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPersonaManager(!showPersonaManager)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                  >
                    {showPersonaManager ? 'Hide' : 'Manage'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use the default persona or click Manage to create/select one
                </p>
              </div>

              {showPersonaManager && replicaId && (
                <div className="border-t pt-4">
                  <PersonaManager
                    replicaId={replicaId}
                    onPersonaSelect={(id) => {
                      setPersonaId(id);
                      setShowPersonaManager(false);
                    }}
                  />
                </div>
              )}

              <button
                onClick={startConversation}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out transform hover:scale-105"
              >
                Start Conversation
              </button>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Make sure you have added your Tavus API key to the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 py-0.5 rounded">.env.local</code> file:
                </p>
                <code className="block mt-2 text-xs bg-yellow-100 dark:bg-yellow-800 p-2 rounded">
                  NEXT_PUBLIC_TAVUS_API_KEY=your_api_key_here
                </code>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-center">
              <button
                onClick={endConversation}
                className="bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200"
              >
                End Conversation
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <TavusConversation
                replicaId={replicaId}
                personaId={personaId || undefined}
                onConversationEnd={endConversation}
                className="w-full h-[700px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}