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
  default_replica_id?: string;
  persona_name: string;
  pipeline_mode: 'full' | 'echo';
  system_prompt: string;
  context?: string;
  llm?: {
    model?: string;
    base_url?: string;
    api_key?: string;
    tools?: any[];
    headers?: Record<string, any>;
    extra_body?: Record<string, any>;
  };
  tts?: {
    api_key?: string;
    tts_engine?: string;
    external_voice_id?: string;
    voice_settings?: Record<string, any>;
    playht_user_id?: string;
    tts_emotion_control?: boolean;
    tts_model_name?: string;
  };
  perception?: {
    perception_model?: string;
    ambient_awareness_queries?: string[];
    perception_tool_prompt?: string;
    perception_tools?: any[];
  };
  stt?: {
    stt_engine?: string;
    participant_pause_sensitivity?: string;
    participant_interrupt_sensitivity?: string;
    hotwords?: string;
    smart_turn_detection?: boolean;
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
        console.error('Error details:', errorData);
        console.error('Request was:', { endpoint, method, body });
        
        if (response.status === 400 && errorData.message?.includes('maximum concurrent conversations')) {
          throw new Error('You have reached the maximum number of concurrent conversations. Please end an existing conversation before starting a new one.');
        }
        
        // Special handling for persona creation errors - don't throw, just log
        if (endpoint.includes('/personas') && response.status === 400) {
          console.warn('Persona creation failed, but continuing without persona');
          return {} as T; // Return empty object to continue flow
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