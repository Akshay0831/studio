export interface ApiProfile {
  id: string
  name: string
  api_key: string
  api_type: 'replicate' | 'runpod' | 'openai'
  is_active: boolean
  models: string[]
  default_model: string | null
  rate_limit: number
  usage_count: number
  last_used: string | null
  created_at: string
}

export interface ApiKeyState {
  profiles: Record<string, ApiProfile>
  currentProfile: string | null
  isLoading: boolean
  error: string | null
}

export interface ModelConfig {
  display_name: string
  type: 'image_generation' | 'audio_generation' | 'text_generation'
  default_prompt: string
  supports_negative_prompt?: boolean
  supports_steps?: boolean
  default_steps: number
  max_steps: number
  supports_cfg?: boolean
  default_cfg?: number
  supports_size?: boolean
  default_size: string
  max_size: string
  description?: string
  pricing?: {
    input_cost?: number
    output_cost?: number
    currency: string
  }
}

export interface ApiProfileConfig {
  [api_type: string]: {
    name: string
    description: string
    models: {
      [model_id: string]: ModelConfig
    }
    rate_limits: {
      requests_per_minute: number
      requests_per_hour: number
    }
  }
}

export interface GenerationRequest {
  prompt: string
  model: string
  api_profile?: string
  negative_prompt?: string
  steps?: number
  cfg?: number
  size?: string
  batch_size?: number
  seed?: number
}

export interface GenerationResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  error?: string
  progress: number
  estimated_time?: number
  api_used: string
  model_used: string
  cost?: number
  metadata?: {
    [key: string]: any
  }
}