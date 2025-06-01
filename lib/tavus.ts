// Tavus API integration service

interface TavusConfig {
  apiKey: string;
  apiUrl: string;
}

interface CreateConversationParams {
  replica_id: string;
  persona_id?: string;
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
      apiUrl: process.env.NEXT_PUBLIC_TAVUS_API_URL || 'https://api.tavus.io',
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
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      if (response.status === 400 && errorData.message?.includes('maximum concurrent conversations')) {
        throw new Error('You have reached the maximum number of concurrent conversations. Please end an existing conversation before starting a new one.');
      }
      throw new Error(`Tavus API error: ${response.status} - ${errorData.message || errorText}`);
    }

    return response.json();
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