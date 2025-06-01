'use client';

import { useState, useEffect } from 'react';
import { tavusAPI, CreatePersonaParams } from '@/lib/tavus';

interface PersonaManagerProps {
  replicaId: string;
  onPersonaSelect: (personaId: string) => void;
}

interface Persona {
  persona_id: string;
  persona_name: string;
  system_prompt?: string;
  context?: string;
}

export default function PersonaManager({ replicaId, onPersonaSelect }: PersonaManagerProps) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  
  const [newPersona, setNewPersona] = useState<Partial<CreatePersonaParams>>({
    persona_name: '',
    system_prompt: '',
    context: '',
    default_greeting: 'Hello! How can I help you today?',
    enable_vision: true,
  });

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const response = await tavusAPI.listPersonas();
      if (response && Array.isArray(response)) {
        setPersonas(response);
      }
    } catch (error) {
      console.error('Error loading personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPersona = async () => {
    if (!newPersona.persona_name) {
      alert('Please enter a persona name');
      return;
    }

    try {
      setLoading(true);
      const response = await tavusAPI.createPersona({
        replica_id: replicaId,
        ...newPersona,
      } as CreatePersonaParams);
      
      if (response.persona_id) {
        await loadPersonas();
        setShowCreateForm(false);
        setNewPersona({
          persona_name: '',
          system_prompt: '',
          context: '',
          default_greeting: 'Hello! How can I help you today?',
          enable_vision: true,
        });
        setSelectedPersonaId(response.persona_id);
        onPersonaSelect(response.persona_id);
      }
    } catch (error) {
      console.error('Error creating persona:', error);
      alert('Failed to create persona. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectPersona = (personaId: string) => {
    setSelectedPersonaId(personaId);
    onPersonaSelect(personaId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Persona Configuration
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          {showCreateForm ? 'Cancel' : 'Create New Persona'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Persona Name
            </label>
            <input
              type="text"
              value={newPersona.persona_name || ''}
              onChange={(e) => setNewPersona({ ...newPersona, persona_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              placeholder="e.g., Customer Support Agent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Prompt
            </label>
            <textarea
              value={newPersona.system_prompt || ''}
              onChange={(e) => setNewPersona({ ...newPersona, system_prompt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              rows={3}
              placeholder="Define the persona's behavior and characteristics..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Context
            </label>
            <textarea
              value={newPersona.context || ''}
              onChange={(e) => setNewPersona({ ...newPersona, context: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              rows={2}
              placeholder="Additional context or knowledge..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Greeting
            </label>
            <input
              type="text"
              value={newPersona.default_greeting || ''}
              onChange={(e) => setNewPersona({ ...newPersona, default_greeting: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              placeholder="Hello! How can I help you today?"
            />
          </div>

          <button
            onClick={createPersona}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Persona'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Available Personas
        </h4>
        
        {loading && !showCreateForm ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        ) : personas.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            No personas available. Create one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {personas.map((persona) => (
              <div
                key={persona.persona_id}
                onClick={() => selectPersona(persona.persona_id)}
                className={`p-3 rounded-lg cursor-pointer transition ${
                  selectedPersonaId === persona.persona_id
                    ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                    : 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {persona.persona_name}
                </div>
                {persona.system_prompt && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {persona.system_prompt.substring(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}