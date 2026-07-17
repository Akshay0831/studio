import React, { useState, useEffect, useRef } from 'react';
import { 
  Puzzle, 
  Download, 
  Upload, 
  Star, 
  Settings, 
  Trash2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Play,
  Pause,
  Code,
  Globe,
  Package,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  repoUrl: string;
  documentation: string;
  downloads: number;
  stars: number;
  license: string;
  installed: boolean;
  enabled: boolean;
  icon: string;
  changelog: string;
  dependencies: string[];
  permissions: string[];
  sandboxed: boolean;
  lastUpdated: string;
  compatible: boolean;
  maintainer: string;
  rating?: number;
  preview?: {
    images: string[];
    demoUrl?: string;
  };
}

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    website?: string;
  };
  main: string;
  dependencies?: Record<string, string>;
  permissions?: string[];
  sandboxed: boolean;
  categories: string[];
  tags: string[];
  icon?: string;
  preview?: {
    images: string[];
    demoUrl?: string;
  };
}

interface PluginRegistry {
  plugins: Map<string, Plugin>;
  installedPlugins: Map<string, PluginManifest>;
  disabledPlugins: Set<string>;
}

const PluginManager: React.FC = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([
    {
      id: 'advanced-layer-blending',
      name: 'Advanced Layer Blending',
      version: '1.2.0',
      author: 'Creative Studio',
      description: 'Professional blending modes and layer effects for advanced image editing',
      category: 'image-processing',
      tags: ['blending', 'layers', 'effects', 'professional'],
      rating: 4.8,
      stars: 189,
      downloads: 15420,
      license: 'MIT',
      installed: true,
      enabled: true,
      icon: '🎨',
      documentation: 'https://docs.creativestudio/plugins/advanced-blending',
      changelog: '1.2.0: Added 5 new blending modes, Fixed compatibility issues',
      dependencies: [],
      permissions: ['read-canvas', 'write-canvas'],
      sandboxed: true,
      lastUpdated: '2026-07-15',
      compatible: true,
      maintainer: 'creativestudio',
      repoUrl: 'https://github.com/creativestudio/advanced-layer-blending',
      preview: {
        images: ['/plugin-previews/advanced-blending-1.png', '/plugin-previews/advanced-blending-2.png'],
        demoUrl: 'https://demo.creativestudio/plugins/advanced-blending'
      }
    },
    {
      id: 'ai-enhance',
      name: 'AI Enhancement Suite',
      version: '2.0.1',
      author: 'AI Studio',
      description: 'AI-powered image enhancement, upscaling, and restoration tools',
      category: 'ai-tools',
      tags: ['ai', 'enhancement', 'upscaling', 'restoration'],
      rating: 4.9,
      stars: 342,
      downloads: 28930,
      license: 'Apache-2.0',
      installed: false,
      enabled: false,
      icon: '🤖',
      documentation: 'https://docs.aistudio/plugins/ai-enhance',
      changelog: '2.0.1: Improved AI models, Better performance, Bug fixes',
      dependencies: [],
      permissions: ['read-canvas', 'write-canvas', 'network-access'],
      sandboxed: true,
      lastUpdated: '2026-07-14',
      compatible: true,
      maintainer: 'aistudio',
      repoUrl: 'https://github.com/aistudio/ai-enhancement-suite',
      preview: {
        images: ['/plugin-previews/ai-enhance-1.png', '/plugin-previews/ai-enhance-2.png']
      }
    },
    {
      id: 'pro-audio-mastering',
      name: 'Pro Audio Mastering',
      version: '1.5.0',
      author: 'Audio Pro',
      description: 'Professional audio mastering and processing tools with advanced EQ and compression',
      category: 'audio-processing',
      tags: ['audio', 'mastering', 'eq', 'compression', 'professional'],
      rating: 4.7,
      stars: 127,
      downloads: 12450,
      license: 'GPL-3.0',
      installed: false,
      enabled: false,
      icon: '🎵',
      documentation: 'https://docs.audiopro/plugins/mastering',
      changelog: '1.5.0: New mastering presets, Improved algorithms, Performance optimizations',
      dependencies: [],
      permissions: ['read-audio', 'write-audio'],
      sandboxed: true,
      lastUpdated: '2026-07-13',
      compatible: true,
      maintainer: 'audiopro',
      repoUrl: 'https://github.com/audiopro/pro-audio-mastering',
      preview: {
        images: ['/plugin-previews/audio-mastering-1.png', '/plugin-previews/audio-mastering-2.png']
      }
    },
    {
      id: 'batch-processor',
      name: 'Batch Processor',
      version: '1.0.0',
      author: 'Efficient Studio',
      description: 'Process multiple images and audio files with customizable batch operations',
      category: 'automation',
      tags: ['batch', 'automation', 'workflow', 'efficiency'],
      rating: 4.6,
      stars: 298,
      downloads: 8760,
      license: 'MIT',
      installed: false,
      enabled: false,
      icon: '⚡',
      documentation: 'https://docs.efficientstudio/plugins/batch-processor',
      changelog: '1.0.0: Initial release, Batch processing, Custom workflows',
      dependencies: [],
      permissions: ['file-access', 'network-access'],
      sandboxed: true,
      lastUpdated: '2026-07-12',
      compatible: true,
      maintainer: 'efficientstudio',
      repoUrl: 'https://github.com/efficientstudio/batch-processor',
      preview: {
        images: ['/plugin-previews/batch-processor-1.png', '/plugin-previews/batch-processor-2.png']
      }
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstallingPluginId, setIsInstallingPluginId] = useState<string | null>(null);
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);

  const categories = ['all', 'image-processing', 'audio-processing', 'ai-tools', 'automation', 'effects', 'format-support'];

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
    const matchesInstalled = !showInstalledOnly || plugin.installed;

    return matchesSearch && matchesCategory && matchesInstalled;
  });

  const handleInstallPlugin = async (pluginId: string) => {
    setIsInstalling(true);
    setIsInstallingPluginId(pluginId);
    
    const plugin = plugins.find(p => p.id === pluginId);
    if (plugin) {
      // Simulate installation process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPlugins(prev => prev.map(p => 
        p.id === pluginId 
          ? { ...p, installed: true, enabled: false }
          : p
      ));
    }
    
    setIsInstalling(false);
    setIsInstallingPluginId(null);
  };

  const handleEnablePlugin = (pluginId: string, enabled: boolean) => {
    setPlugins(prev => prev.map(p => 
      p.id === pluginId 
        ? { ...p, enabled }
        : p
    ));
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    if (confirm('Are you sure you want to uninstall this plugin?')) {
      setPlugins(prev => prev.map(p => 
        p.id === pluginId 
          ? { ...p, installed: false, enabled: false }
          : p
      ));
    }
  };

  const getPriceDisplay = () => {
    return 'Free Open-Source';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-studio-accent" />
          Plugin Manager
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Refresh
          </button>
          <button className="px-3 py-1 bg-studio-accent text-black rounded text-sm hover:bg-studio-accent/80">
            <Plus className="w-4 h-4 inline mr-1" />
            Install from File
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-studio-border">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-studio-text-dim" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-studio-panel border border-studio-border rounded text-sm text-studio-text focus:outline-none focus:border-studio-accent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-studio-panel border border-studio-border rounded text-sm text-studio-text"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowInstalledOnly(!showInstalledOnly)}
            className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${
              showInstalledOnly 
                ? 'bg-studio-accent text-black' 
                : 'bg-studio-hover text-studio-text'
            }`}
          >
            <Eye className="w-4 h-4" />
            Installed Only
          </button>
        </div>
      </div>

      {/* Plugin Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlugins.map(plugin => (
            <div
              key={plugin.id}
              className={`rounded-lg border p-4 cursor-pointer transition-all ${
                selectedPlugin?.id === plugin.id
                  ? 'border-studio-accent bg-studio-panel-darker'
                  : 'border-studio-panel hover:border-studio-accent'
              }`}
              onClick={() => setSelectedPlugin(plugin)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{plugin.icon}</div>
                  <div>
                    <h3 className="font-semibold text-studio-text">{plugin.name}</h3>
                    <p className="text-xs text-studio-text-dim">v{plugin.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{plugin.rating}</span>
                </div>
              </div>

              <p className="text-sm text-studio-text-dim mb-3 line-clamp-2">
                {plugin.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-500 text-white">
                    Free Open-Source
                  </span>
                  <span className="text-xs text-studio-text-dim">
                    {plugin.downloads.toLocaleString()} downloads
                  </span>
                </div>
                <span className="text-xs text-studio-text-dim">
                  by {plugin.author}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {plugin.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-studio-panel rounded text-xs text-studio-text-dim">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  {plugin.installed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnablePlugin(plugin.id, !plugin.enabled);
                      }}
                      className={`p-1 rounded ${
                        plugin.enabled
                          ? 'bg-green-500 text-white'
                          : 'bg-studio-hover text-studio-text'
                      }`}
                    >
                      {plugin.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInstallPlugin(plugin.id);
                      }}
                      disabled={isInstalling && isInstallingPluginId === plugin.id}
                      className={`p-1 rounded ${
                        isInstalling && isInstallingPluginId === plugin.id
                          ? 'bg-studio-panel-darker text-studio-text-dim'
                          : 'bg-studio-accent text-black hover:bg-studio-accent/80'
                      }`}
                    >
                      {isInstalling && isInstallingPluginId === plugin.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {plugin.installed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUninstallPlugin(plugin.id);
                      }}
                      className="p-1 rounded bg-studio-hover text-studio-text hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plugin Details Sidebar */}
      {selectedPlugin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-studio-panel rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-studio-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-studio-text flex items-center gap-2">
                {selectedPlugin.icon}
                {selectedPlugin.name}
              </h3>
              <button
                onClick={() => setSelectedPlugin(null)}
                className="p-1 hover:bg-studio-hover rounded"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold text-studio-text mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-studio-text-dim">Version:</span> {selectedPlugin.version}</div>
                    <div><span className="text-studio-text-dim">Author:</span> {selectedPlugin.author}</div>
                    <div><span className="text-studio-text-dim">Category:</span> {selectedPlugin.category}</div>
                    <div><span className="text-studio-text-dim">Updated:</span> {formatDate(selectedPlugin.lastUpdated)}</div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{selectedPlugin.rating}/5 ({selectedPlugin.downloads.toLocaleString()} downloads)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-studio-text mb-2">Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Compatible with your system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPlugin.sandboxed ? (
                        <Info className="w-4 h-4 text-blue-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span>{selectedPlugin.sandboxed ? 'Runs in sandboxed environment' : 'Requires elevated permissions'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-studio-text mb-2">Description</h4>
                <p className="text-sm text-studio-text-dim">{selectedPlugin.description}</p>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-studio-text mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPlugin.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-studio-panel rounded text-xs text-studio-text">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {selectedPlugin.preview && selectedPlugin.preview.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-studio-text mb-2">Preview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPlugin.preview.images.slice(0, 4).map((image: string, index: number) => (
                      <div key={index} className="aspect-square bg-studio-panel-d rounded flex items-center justify-center">
                        <span className="text-sm text-studio-text-dim">Preview {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h4 className="font-semibold text-studio-text mb-2">Permissions</h4>
                <div className="space-y-1 text-sm">
                  {selectedPlugin.permissions.map(permission => (
                    <div key={permission} className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-studio-text-dim" />
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-studio-border flex justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Documentation
                </button>
                <button className="px-4 py-2 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
                  <Package className="w-4 h-4 inline mr-1" />
                  Changelog
                </button>
              </div>
              <div className="flex gap-2">
                {selectedPlugin.installed ? (
                  <button
                    onClick={() => handleEnablePlugin(selectedPlugin.id, !selectedPlugin.enabled)}
                    className={`px-4 py-2 rounded ${
                      selectedPlugin.enabled
                        ? 'bg-red-500 text-white'
                        : 'bg-studio-accent text-black'
                    }`}
                  >
                    {selectedPlugin.enabled ? 'Disable' : 'Enable'} Plugin
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstallPlugin(selectedPlugin.id)}
                    disabled={isInstalling && isInstallingPluginId === selectedPlugin.id}
                    className={`px-4 py-2 rounded ${
                      isInstalling && isInstallingPluginId === selectedPlugin.id
                        ? 'bg-studio-panel-darker text-studio-text-dim'
                        : 'bg-studio-accent text-black hover:bg-studio-accent/80'
                    }`}
                  >
                    {isInstalling && isInstallingPluginId === selectedPlugin.id ? (
                      <><RefreshCw className="w-4 h-4 inline mr-1 animate-spin" />Installing...</>
                    ) : (
                      <><Download className="w-4 h-4 inline mr-1" />Install (Free)</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginManager;