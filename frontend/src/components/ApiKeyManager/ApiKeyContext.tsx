import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { ApiProfile, ApiKeyState } from '../../types/api'
import { ApiErrorHandler } from '../../utils/apiErrorHandler'

// Extended Error type with API response
interface ApiError extends Error {
  response?: {
    status: number;
    data?: any;
  };
}

interface ApiKeyContextType {
  state: ApiKeyState
  dispatch: React.Dispatch<ApiKeyAction>
  setCurrentProfile: (profileId: string) => void
  addProfile: (profile: Omit<ApiProfile, 'id'>) => Promise<ApiProfile>
  updateProfile: (profileId: string, updates: Partial<ApiProfile>) => Promise<ApiProfile>
  deleteProfile: (profileId: string) => Promise<void>
  refreshProfiles: () => Promise<void>
  isLoading: boolean
  error: string | null
}

type ApiKeyAction =
  | { type: 'SET_PROFILES'; payload: ApiProfile[] }
  | { type: 'SET_CURRENT_PROFILE'; payload: string }
  | { type: 'ADD_PROFILE'; payload: ApiProfile }
  | { type: 'UPDATE_PROFILE'; payload: { id: string; updates: Partial<ApiProfile> } }
  | { type: 'DELETE_PROFILE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

const initialState: ApiKeyState = {
  profiles: {},
  currentProfile: null,
  isLoading: false,
  error: null
}

function apiKeyReducer(state: ApiKeyState, action: ApiKeyAction): ApiKeyState {
  switch (action.type) {
    case 'SET_PROFILES':
      return {
        ...state,
        profiles: action.payload.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {} as Record<string, ApiProfile>),
        isLoading: false
      }
    case 'SET_CURRENT_PROFILE':
      return {
        ...state,
        currentProfile: action.payload,
        error: null
      }
    case 'ADD_PROFILE':
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [action.payload.id]: action.payload
        }
      }
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profiles: {
          ...state.profiles,
          [action.payload.id]: {
            ...state.profiles[action.payload.id],
            ...action.payload.updates
          }
        }
      }
    case 'DELETE_PROFILE': {
      delete state.profiles[action.payload]
      return {
        ...state,
        profiles: { ...state.profiles },
        currentProfile: state.currentProfile === action.payload ? null : state.currentProfile
      }
    }
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    default:
      return state
  }
}

interface ApiKeyProviderProps {
  children: ReactNode
}

export const ApiKeyProvider: React.FC<ApiKeyProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(apiKeyReducer, initialState)

  // Load profiles on mount
  useEffect(() => {
    refreshProfiles()
  }, [])

  const refreshProfiles = async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const response = await fetch('/api/api-management/profiles')
      if (response.ok) {
        const data = await response.json()
        dispatch({ type: 'SET_PROFILES', payload: data.profiles })
      } else {
        const error = new Error('Failed to load API profiles') as ApiError
        error.response = { status: response.status }
        dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
    }
  }

  const setCurrentProfile = (profileId: string) => {
    dispatch({ type: 'SET_CURRENT_PROFILE', payload: profileId })
  }

  const addProfile = async (profileData: Omit<ApiProfile, 'id'>) => {
    try {
      const response = await fetch('/api/api-management/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })
      
      if (response.ok) {
        const newProfile = await response.json()
        dispatch({ type: 'ADD_PROFILE', payload: newProfile })
        return newProfile
      } else {
        const error = new Error('Failed to create profile') as ApiError
        error.response = { status: response.status }
        const errorData = await response.json().catch(() => ({}))
        error.response = { status: response.status, data: errorData }
        dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
        throw error
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
      throw error
    }
  }

  const updateProfile = async (profileId: string, updates: Partial<ApiProfile>) => {
    try {
      const response = await fetch(`/api/api-management/profiles/${profileId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        const updatedProfile = await response.json()
        dispatch({ type: 'UPDATE_PROFILE', payload: { id: profileId, updates } })
        return updatedProfile
      } else {
        const error = new Error('Failed to update profile') as ApiError
        error.response = { status: response.status }
        const errorData = await response.json().catch(() => ({}))
        error.response = { status: response.status, data: errorData }
        dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
        throw error
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
      throw error
    }
  }

  const deleteProfile = async (profileId: string) => {
    try {
      const response = await fetch(`/api/api-management/profiles/${profileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        dispatch({ type: 'DELETE_PROFILE', payload: profileId })
      } else {
        const error = new Error('Failed to delete profile') as ApiError
        error.response = { status: response.status }
        const errorData = await response.json().catch(() => ({}))
        error.response = { status: response.status, data: errorData }
        dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
        throw error
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: ApiErrorHandler.handleError(error) })
      throw error
    }
  }

  const value: ApiKeyContextType = {
    state,
    dispatch,
    setCurrentProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    refreshProfiles,
    isLoading: state.isLoading,
    error: state.error
  }

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  )
}

export const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined)
export const useApiKey = () => {
  const context = useContext(ApiKeyContext)
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider')
  }
  return context
}