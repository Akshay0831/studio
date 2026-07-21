import React from 'react'
import { useApiKey } from '../../components/ApiKeyManager/ApiKeyContext'
import { Key, Plus, Settings } from 'lucide-react'

interface ApiKeySidebarProps {
  onSelectProfile?: (profileId: string) => void
}

export const ApiKeySidebar: React.FC<ApiKeySidebarProps> = ({ onSelectProfile }) => {
  const { state, dispatch, setCurrentProfile } = useApiKey()
  
  const handleProfileSelect = (profileId: string) => {
    setCurrentProfile(profileId)
    onSelectProfile?.(profileId)
  }

  if (state.isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <span className="text-[10px] text-studio-text-dim">Loading profiles...</span>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-[10px] mb-2">Error loading profiles</div>
        <button 
          onClick={() => dispatch({ type: 'SET_LOADING', payload: true })}
          className="text-[9px] text-studio-accent hover:text-white"
        >
          Retry
        </button>
      </div>
    )
  }

  const profiles = Object.values(state.profiles)
  
  if (profiles.length === 0) {
    return (
      <div className="text-center py-8">
        <Key className="h-8 w-8 text-studio-text-dim mx-auto mb-2" />
        <span className="text-[10px] text-studio-text-dim mb-4">No API profiles configured</span>
        <button className="text-[9px] text-studio-accent hover:text-white">
          <Plus className="inline h-3 w-3 mr-1" />
          Add Profile
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-bold text-studio-accent uppercase tracking-wider mb-3">
        <Key className="h-3 w-3" />
        API Profiles
      </div>
      
      {profiles.map((profile) => (
        <button
          key={profile.id}
          onClick={() => handleProfileSelect(profile.id)}
          className={`w-full p-3 rounded-lg border transition-all text-left ${
            profile.id === state.currentProfile
              ? 'bg-studio-accent border-studio-accent text-white shadow-lg'
              : 'bg-studio-panel border-studio-border hover:bg-studio-panel-hover hover:border-studio-border-bright text-studio-text'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold">{profile.name}</span>
            {profile.is_active && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
          </div>
          <div className="text-[8px] opacity-75 mb-1">
            {profile.api_type.toUpperCase()}
          </div>
          <div className="text-[8px] opacity-50">
            {profile.models.length > 0 
              ? `${profile.models.length} models`
              : 'No models'
            }
          </div>
        </button>
      ))}
      
      <button className="w-full p-3 rounded-lg border border-dashed border-studio-border text-studio-text-dim hover:text-studio-accent hover:border-studio-accent transition-all text-left">
        <Plus className="inline h-3 w-3 mr-1" />
        <span className="text-[11px] font-bold">Add Profile</span>
      </button>
      
      <button className="w-full p-3 rounded-lg bg-studio-panel border border-studio-border text-studio-text-dim hover:bg-studio-panel-hover transition-all text-left">
        <Settings className="inline h-3 w-3 mr-1" />
        <span className="text-[11px] font-bold">Manage Profiles</span>
      </button>
    </div>
  )
}