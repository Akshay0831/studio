import React, { useMemo } from 'react'
import { useApiKey } from './ApiKeyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Alert, AlertDescription } from '../ui/alert'
import { CheckCircle, AlertCircle, Zap, RefreshCw } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'

export const ApiKeySelector: React.FC = () => {
  const { state, setCurrentProfile } = useApiKey()
  
  const activeProfiles = useMemo(() => {
    return Object.values(state.profiles).filter(profile => profile.is_active)
  }, [state.profiles])

  const selectedProfile = useMemo(() => {
    if (!state.currentProfile) return null
    return state.profiles[state.currentProfile]
  }, [state.currentProfile, state.profiles])

  const handleProfileChange = (profileId: string) => {
    setCurrentProfile(profileId)
  }

  const getProviderIcon = (apiType: string) => {
    switch (apiType) {
      case 'replicate': return '🧪'
      case 'runpod': return '🚀'
      case 'openai': return '🤖'
      default: return '🔑'
    }
  }

  const getStatusMessage = () => {
    if (!state.currentProfile) {
      if (activeProfiles.length === 0) {
        return {
          type: 'error' as const,
          message: 'No active API profiles available. Please add at least one profile in the management tab.'
        }
      }
      return {
        type: 'warning' as const,
        message: 'No API profile selected. Please choose one to start generating.'
      }
    }
    
    return {
      type: 'success' as const,
      message: `Active profile: ${selectedProfile?.name} (${getProviderIcon(selectedProfile?.api_type || '')})`
    }
  }

  const status = getStatusMessage()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Current API Configuration
          </CardTitle>
          <CardDescription>
            Select the API profile and model to use for generation tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Alert */}
          <Alert className={status.type === 'error' ? 'border-red-200' : status.type === 'warning' ? 'border-yellow-200' : 'border-green-200'}>
            {status.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
            {status.type === 'warning' && <RefreshCw className="h-4 w-4 text-yellow-600" />}
            {status.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>

          {/* Profile Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Active API Profile</label>
            <Select
              value={state.currentProfile || ''}
              onValueChange={handleProfileChange}
              disabled={activeProfiles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={activeProfiles.length === 0 ? "No active profiles" : "Select API profile"} />
              </SelectTrigger>
              <SelectContent>
                {activeProfiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div className="flex items-center gap-2">
                      <span>{getProviderIcon(profile.api_type)}</span>
                      <span>{profile.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {profile.api_type.toUpperCase()}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeProfiles.length === 0 && (
              <p className="text-xs text-red-600">Please add at least one active API profile to continue</p>
            )}
          </div>

          {/* Selected Profile Details */}
          {selectedProfile && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{selectedProfile.name}</h4>
                    <div className="flex items-center gap-2">
                      <span>{getProviderIcon(selectedProfile.api_type)}</span>
                      <Badge variant="default">{selectedProfile.api_type.toUpperCase()}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Default Model:</span>
                      <span className="ml-2 font-medium">{selectedProfile.default_model || 'None selected'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Rate Limit:</span>
                      <span className="ml-2 font-medium">{selectedProfile.rate_limit}/min</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Available Models:</span>
                      <span className="ml-2 font-medium">{selectedProfile.models.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Usage Count:</span>
                      <span className="ml-2 font-medium">{selectedProfile.usage_count}</span>
                    </div>
                  </div>

                  {/* Model Selection */}
                  {selectedProfile.models.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available Models</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfile.models.map(modelId => (
                          <TooltipProvider key={modelId}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant={modelId === selectedProfile.default_model ? "default" : "secondary"}
                                  className="cursor-pointer hover:bg-gray-200"
                                >
                                  {modelId}
                                  {modelId === selectedProfile.default_model && (
                                    <span className="ml-1">🌟</span>
                                  )}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">Click to use this model for generation</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Profiles Overview */}
          {activeProfiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">All Active Profiles</label>
              <div className="space-y-2">
                {activeProfiles.map(profile => (
                  <Card
                    key={profile.id}
                    className={`transition-all cursor-pointer ${
                      profile.id === state.currentProfile
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleProfileChange(profile.id)}
                  >
                    <CardContent className="pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getProviderIcon(profile.api_type)}</span>
                          <div>
                            <h5 className="font-medium">{profile.name}</h5>
                            <p className="text-sm text-gray-600">
                              {profile.models.length} models • {profile.rate_limit}/min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={profile.id === state.currentProfile ? "default" : "outline"}>
                            {profile.api_type.toUpperCase()}
                          </Badge>
                          {profile.id === state.currentProfile && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}