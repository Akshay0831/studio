import React, { useState } from 'react'
import { useApiKey } from './ApiKeyContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/themed'
import { Button, Badge } from '@/components/ui/themed'
import { Alert, AlertDescription } from '@/components/ui/themed'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/themed'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/themed'
import { Plus, Settings, Key, Trash2, Edit, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { ApiProfileEditor } from './ApiProfileEditor'
import { ApiKeySelector } from './ApiKeySelector'
import { ApiProfile } from '../../types/api'

export const ApiKeyManager: React.FC = () => {
  const { state, addProfile, updateProfile, deleteProfile, refreshProfiles } = useApiKey()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<ApiProfile | null>(null)

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You can add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleRefresh = () => {
    refreshProfiles()
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <CardDescription>
            Manage your API keys and switch between different providers and models dynamically
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.isLoading && (
            <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700">Loading API profiles...</span>
            </div>
          )}
          
          {state.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{state.error}</AlertDescription>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="text-xs"
                >
                  Try Again
                </Button>
              </div>
            </Alert>
          )}

          <Tabs value="selector" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selector">API Selector</TabsTrigger>
              <TabsTrigger value="profiles">Profile Management</TabsTrigger>
            </TabsList>

            <TabsContent value="selector" className="space-y-4">
              <ApiKeySelector />
            </TabsContent>

            <TabsContent value="profiles" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">API Profiles</h3>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New API Profile</DialogTitle>
                      <DialogDescription>
                        Create a new API profile with your credentials
                      </DialogDescription>
                    </DialogHeader>
                    <ApiProfileEditor 
                      onSubmit={async (profile) => {
                        try {
                          await addProfile(profile)
                          setShowAddDialog(false)
                        } catch (error) {
                          // Error will be handled by the context
                          console.error('Failed to add profile:', error)
                        }
                      }}
                      onCancel={() => setShowAddDialog(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {Object.values(state.profiles).map((profile) => (
                  <Card 
                    key={profile.id}
                    className={profile.is_active ? 'border-green-200/30' : ''}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{profile.name}</h4>
                            <Badge variant={profile.is_active ? "default" : "secondary"}>
                              {profile.api_type.toUpperCase()}
                            </Badge>
                            {profile.is_active && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-studio-text-dim">
                            <div>
                              <span className="font-medium">Models:</span>
                              <span className="ml-1">
                                {profile.models.length > 0 
                                  ? profile.models.slice(0, 3).join(', ') + (profile.models.length > 3 ? '...' : '')
                                  : 'No models'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Rate Limit:</span>
                              <span className="ml-1">{profile.rate_limit}/min</span>
                            </div>
                            <div>
                              <span className="font-medium">Usage:</span>
                              <span className="ml-1">{profile.usage_count}</span>
                            </div>
                            <div>
                              <span className="font-medium">Default Model:</span>
                              <span className="ml-1">
                                {profile.default_model || 'Not set'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyToClipboard(profile.api_key)}
                            className="text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Key
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProfile(profile)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
                                deleteProfile(profile.id)
                                  .catch((error: any) => {
                                    console.error('Failed to delete profile:', error)
                                    // Error will be handled by the context
                                  })
                              }
                            }}
                            disabled={profile.is_active}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {editingProfile && (
                <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit API Profile</DialogTitle>
                      <DialogDescription>
                        Update your API profile settings
                      </DialogDescription>
                    </DialogHeader>
                    <ApiProfileEditor 
                      profile={editingProfile}
                      onSubmit={async (profile) => {
                        try {
                          await updateProfile(editingProfile.id, profile)
                          setEditingProfile(null)
                        } catch (error) {
                          // Error will be handled by the context
                          console.error('Failed to update profile:', error)
                        }
                      }}
                      onCancel={() => setEditingProfile(null)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={handleRefresh}>
              <Settings className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}