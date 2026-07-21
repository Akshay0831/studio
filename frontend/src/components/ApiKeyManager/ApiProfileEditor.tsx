import React, { useState, useEffect } from 'react'
import { ApiProfile } from '../../types/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/themed'
import { Button } from '@/components/ui/themed'
import { Input } from '@/components/ui/themed'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/themed'
import { Checkbox } from '@/components/ui/themed'
import { Badge } from '@/components/ui/themed'
import { Label } from '@/components/ui/themed'
import { Key } from 'lucide-react'

interface ApiProfileEditorProps {
  profile?: ApiProfile | null
  onSubmit: (profile: Omit<ApiProfile, 'id'>) => void
  onCancel: () => void
}

const API_PROVIDERS = [
  { value: 'replicate', label: 'Replicate', description: 'AI model hosting platform' },
  { value: 'runpod', label: 'RunPod', description: 'GPU computing platform' },
  { value: 'openai', label: 'OpenAI', description: 'Large language models' }
]

interface ModelOption {
  value: string
  label: string
  type: string
  pricing?: string
}

const API_MODELS: Record<string, ModelOption[]> = {
  replicate: [
    { value: 'stable-diffusion', label: 'Stable Diffusion', type: 'image', pricing: '$0.02/4K steps' },
    { value: 'sd-xl', label: 'Stable Diffusion XL', type: 'image', pricing: '$0.08/4K steps' },
    { value: 'whisper', label: 'Whisper', type: 'audio' },
    { value: 'mistral', label: 'Mistral', type: 'text' },
    { value: 'llama', label: 'Llama', type: 'text' }
  ],
  runpod: [
    { value: 'stable-diffusion', label: 'Stable Diffusion', type: 'image', pricing: '$0.05/4K steps' },
    { value: 'sdxl-turbo', label: 'SDXL Turbo', type: 'image', pricing: '$0.03/4K steps' },
    { value: 'flux', label: 'Flux', type: 'image', pricing: '$0.10/4K steps' },
    { value: 'speecht5', label: 'SpeechT5', type: 'audio' },
    { value: 'llama3', label: 'Llama 3', type: 'text', pricing: '$0.01/1K tokens' },
    { value: 'mistral', label: 'Mistral', type: 'text', pricing: '$0.01/1K tokens' }
  ],
  openai: [
    { value: 'dall-e-3', label: 'DALL-E 3', type: 'image', pricing: '$0.040/image' },
    { value: 'gpt-4', label: 'GPT-4', type: 'text', pricing: '$0.03/1K tokens' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5', type: 'text', pricing: '$0.0015/1K tokens' },
    { value: 'whisper-1', label: 'Whisper', type: 'audio', pricing: '$0.006/minute' }
  ]
}

export const ApiProfileEditor: React.FC<ApiProfileEditorProps> = ({ profile, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    api_key: '',
    api_type: API_PROVIDERS[0].value,
    is_active: false,
    models: [] as string[],
    default_model: '',
    rate_limit: 60,
    usage_count: 0,
    last_used: null as string | null,
    created_at: new Date().toISOString()
  })

  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        api_key: profile.api_key,
        api_type: profile.api_type,
        is_active: profile.is_active,
        models: profile.models,
        default_model: profile.default_model || '',
        rate_limit: profile.rate_limit,
        usage_count: profile.usage_count,
        last_used: profile.last_used,
        created_at: profile.created_at
      })
      setSelectedModels(profile.models)
    }
  }, [profile])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Profile name is required'
    }
    
    if (!formData.api_key.trim()) {
      newErrors.api_key = 'API key is required'
    }
    
    if (selectedModels.length === 0) {
      newErrors.models = 'At least one model must be selected'
    }
    
    if (selectedModels.includes(formData.default_model) && !formData.default_model) {
      newErrors.default_model = 'Default model must be selected from available models'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const profileData: Omit<ApiProfile, 'id'> = {
      name: formData.name,
      api_key: formData.api_key,
      api_type: formData.api_type as 'replicate' | 'runpod' | 'openai',
      is_active: formData.is_active,
      models: selectedModels,
      default_model: formData.default_model || null,
      rate_limit: formData.rate_limit,
      usage_count: formData.usage_count,
      last_used: formData.last_used,
      created_at: formData.created_at
    }

    onSubmit(profileData)
  }

  const handleModelToggle = (modelValue: string) => {
    setSelectedModels(prev => {
      const newModels = prev.includes(modelValue)
        ? prev.filter(m => m !== modelValue)
        : [...prev, modelValue]
      
      // If default model is removed and it's not selected anymore, clear it
      if (formData.default_model && !newModels.includes(formData.default_model)) {
        setFormData(prev => ({ ...prev, default_model: '' }))
      }
      
      return newModels
    })
  }

  const handleRateLimitChange = (value: string) => {
    const rateLimit = parseInt(value, 10)
    if (!isNaN(rateLimit) && rateLimit >= 1 && rateLimit <= 1000) {
      setFormData(prev => ({ ...prev, rate_limit: rateLimit }))
    }
  }

  const availableModels = API_MODELS[formData.api_type] || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {profile ? 'Edit API Profile' : 'Add New API Profile'}
        </CardTitle>
        <CardDescription>
          {profile ? 'Update your API profile settings' : 'Create a new profile with your API credentials'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., My Replicate Account"
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_type">API Provider</Label>
            <Select value={formData.api_type} onValueChange={(value: string) => setFormData(prev => ({ ...prev, api_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select API provider" />
              </SelectTrigger>
              <SelectContent>
                {API_PROVIDERS.map(provider => (
                  <SelectItem key={provider.value} value={provider.value}>
                    <div>
                      <div className="font-medium">{provider.label}</div>
                      <div className="text-sm text-gray-600">{provider.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="Enter your API key"
            />
            {errors.api_key && <p className="text-sm text-red-600">{errors.api_key}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="active">Active Status</Label>
            <div className="flex items-center space-x-2">
              <input
                id="active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              />
              <Label htmlFor="active" className="text-sm">Enable this profile (disabled profiles cannot be used)</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate_limit">Rate Limit (requests per minute)</Label>
            <Input
              id="rate_limit"
              type="number"
              value={formData.rate_limit.toString()}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRateLimitChange(e.target.value)}
            />
            <p className="text-xs text-gray-600">Maximum requests allowed per minute</p>
          </div>

          <div className="space-y-2">
            <Label>Available Models</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {availableModels.map(model => (
                <div
                  key={model.value}
                  className="flex items-center space-x-2 p-2 rounded border hover:bg-gray-50"
                >
                  <Checkbox
                    id={`model-${model.value}`}
                    checked={selectedModels.includes(model.value)}
                    onCheckedChange={() => handleModelToggle(model.value)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`model-${model.value}`} className="text-sm cursor-pointer flex items-center justify-between">
                      <span>{model.label}</span>
                      <Badge variant="outline" className="text-xs">{model.type}</Badge>
                    </Label>
                    {model.pricing && (
                      <p className="text-xs text-gray-500">{model.pricing}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.models && <p className="text-sm text-red-600">{errors.models}</p>}
          </div>

          {selectedModels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="default_model">Default Model</Label>
              <Select value={formData.default_model} onValueChange={(value: string) => setFormData(prev => ({ ...prev, default_model: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedModels.map(modelValue => {
                    const model = availableModels.find(m => m.value === modelValue)
                    return (
                      <SelectItem key={modelValue} value={modelValue}>
                        {model?.label} ({modelValue})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.default_model && <p className="text-sm text-red-600">{errors.default_model}</p>}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {profile ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}