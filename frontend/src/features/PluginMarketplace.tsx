import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Star, 
  Download, 
  ExternalLink,
  Code,
  Globe,
  GitBranch,
  Users,
  Calendar,
  RefreshCw,
  Filter,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Github,
  Globe2,
  FileText,
  Zap,
  Palette,
  Music,
  Layers,
  Bot,
  Database,
  BarChart3
} from 'lucide-react';

interface RepositoryPlugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: string;
  tags: string[];
  repoUrl: string;
  docsUrl?: string;
  demoUrl?: string;
  icon: string;
  downloads: number;
  stars: number;
  lastUpdated: string;
  compatible: boolean;
  dependencies: string[];
  permissions: string[];
  sandboxed: boolean;
  featured: boolean;
  trending: boolean;
  maintainer: string;
  license: string;
  size: string;
}

interface PluginCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  count: number;
}

const PluginMarketplace: React.FC = () => {
  const [plugins, setPlugins] = useState<RepositoryPlugin[]>([
    {
      id: 'ai-image-enhancer',
      name: 'AI Image Enhancer',
      description: 'Open-source AI-powered image enhancement with upscaling and restoration',
      author: 'OpenStudio Collective',
      version: '2.1.0',
      category: 'ai-tools',
      tags: ['ai', 'enhancement', 'upscaling', 'restoration', 'open-source'],
      repoUrl: 'https://github.com/openstudio/ai-image-enhancer',
      docsUrl: 'https://github.com/openstudio/ai-image-enhancer/blob/main/README.md',
      demoUrl: 'https://openstudio.dev/ai-enhancer-demo',
      icon: '🤖',
      downloads: 15230,
      stars: 342,
      lastUpdated: '2026-07-15',
      compatible: true,
      dependencies: [],
      permissions: ['read-canvas', 'write-canvas'],
      sandboxed: true,
      featured: true,
      trending: true,
      maintainer: 'openstudio',
      license: 'MIT',
      size: '2.4MB'
    },
    {
      id: 'audio-mastering-suite',
      name: 'Audio Mastering Suite',
      description: 'Open-source professional audio mastering tools for high-quality production',
      author: 'Audio Community',
      version: '1.8.0',
      category: 'audio-processing',
      tags: ['audio', 'mastering', 'eq', 'compression', 'open-source', 'professional'],
      repoUrl: 'https://github.com/audiocomm/audio-mastering-suite',
      docsUrl: 'https://github.com/audiocomm/audio-mastering-suite/blob/main/README.md',
      icon: '🎵',
      downloads: 8920,
      stars: 189,
      lastUpdated: '2026-07-14',
      compatible: true,
      dependencies: [],
      permissions: ['read-audio', 'write-audio'],
      sandboxed: true,
      featured: false,
      trending: false,
      maintainer: 'audiocomm',
      license: 'Apache-2.0',
      size: '5.1MB'
    },
    {
      id: 'film-grain-pack',
      name: 'Film Grain Effects',
      description: 'Collection of authentic film grain and vintage look effects',
      author: 'Cinematic Community',
      version: '1.5.0',
      category: 'image-processing',
      tags: ['film', 'grain', 'vintage', 'cinematic', 'open-source'],
      repoUrl: 'https://github.com/cinecommunity/film-grain-pack',
      docsUrl: 'https://github.com/cinecommunity/film-grain-pack/blob/main/README.md',
      icon: '🎞️',
      downloads: 6540,
      stars: 127,
      lastUpdated: '2026-07-12',
      compatible: true,
      dependencies: [],
      permissions: ['read-canvas', 'write-canvas'],
      sandboxed: true,
      featured: false,
      trending: true,
      maintainer: 'cinecommunity',
      license: 'GPL-3.0',
      size: '1.8MB'
    },
    {
      id: 'color-grading-tools',
      name: 'Color Grading Tools',
      description: 'Professional color grading and correction toolkit',
      author: 'Color Tools Collective',
      version: '2.3.0',
      category: 'image-processing',
      tags: ['color', 'grading', 'correction', 'professional', 'open-source'],
      repoUrl: 'https://github.com/colortools/color-grading-tools',
      docsUrl: 'https://github.com/colortools/color-grading-tools/blob/main/README.md',
      demoUrl: 'https://colortools.dev/demo',
      icon: '🎨',
      downloads: 12350,
      stars: 298,
      lastUpdated: '2026-07-10',
      compatible: true,
      dependencies: [],
      permissions: ['read-canvas', 'write-canvas'],
      sandboxed: true,
      featured: true,
      trending: false,
      maintainer: 'colortools',
      license: 'MIT',
      size: '3.2MB'
    },
    {
      id: 'midi-controller-integration',
      name: 'MIDI Controller Integration',
      description: 'Support for various MIDI controllers with real-time parameter mapping',
      author: 'Music Tech Collective',
      version: '1.2.0',
      category: 'audio-processing',
      tags: ['midi', 'controller', 'music', 'integration', 'open-source'],
      repoUrl: 'https://github.com/miditech/midi-controller-integration',
      docsUrl: 'https://github.com/miditech/midi-controller-integration/blob/main/README.md',
      icon: '🎹',
      downloads: 3420,
      stars: 89,
      lastUpdated: '2026-07-08',
      compatible: true,
      dependencies: [],
      permissions: ['read-audio', 'system-access'],
      sandboxed: false,
      featured: false,
      trending: false,
      maintainer: 'miditech',
      license: 'MIT',
      size: '1.5MB'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('downloads');
  const [installingPlugins, setInstallingPlugins] = useState<Set<string>>(new Set());
  const [sourceRepositories, setSourceRepositories] = useState([
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://api.github.com/search/repositories',
      description: 'World\'s largest open-source software community',
      icon: Github
    },
    {
      id: 'gitlab',
      name: 'GitLab',
      url: 'https://gitlab.com/api/v4/projects',
      description: 'Open-source software development platform',
      icon: GitBranch
    },
    {
      id: 'custom',
      name: 'Custom Repos',
      url: '/api/plugins/repositories',
      description: 'Community-contributed plugin repositories',
      icon: FileText
    }
  ]);

  const categories: PluginCategory[] = [
    { id: 'all', name: 'All Plugins', icon: Package, color: 'blue', count: plugins.length },
    { id: 'ai-tools', name: 'AI Tools', icon: Bot, color: 'purple', count: plugins.filter(p => p.category === 'ai-tools').length },
    { id: 'image-processing', name: 'Image Processing', icon: Palette, color: 'green', count: plugins.filter(p => p.category === 'image-processing').length },
    { id: 'audio-processing', name: 'Audio Processing', icon: Music, color: 'orange', count: plugins.filter(p => p.category === 'audio-processing').length },
    { id: 'workflows', name: 'Workflows', icon: Zap, color: 'yellow', count: plugins.filter(p => p.category === 'workflows').length }
  ];

  const filteredPlugins = plugins
    .filter(plugin => {
      const matchesSearch = plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || plugin.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'stars':
          return b.stars - a.stars;
        case 'recent':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const installPlugin = async (pluginId: string) => {
    setInstallingPlugins(prev => new Set(prev).add(pluginId));
    
    try {
      // Simulate plugin installation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would:
      // 1. Clone the repository
      // 2. Install dependencies
      // 3. Build the plugin
      // 4. Register it with the plugin system
      console.log(`Installing plugin: ${pluginId}`);
      
      // Update plugin download count
      setPlugins(prev => prev.map(plugin => 
        plugin.id === pluginId 
          ? { ...plugin, downloads: plugin.downloads + 1 }
          : plugin
      ));
    } catch (error) {
      console.error(`Failed to install plugin: ${pluginId}`, error);
    } finally {
      setInstallingPlugins(prev => {
        const newSet = new Set(prev);
        newSet.delete(pluginId);
        return newSet;
      });
    }
  };

  const openRepository = (repoUrl: string) => {
    window.open(repoUrl, '_blank');
  };

  const openDocumentation = (docsUrl: string) => {
    window.open(docsUrl, '_blank');
  };

  const openDemo = (demoUrl: string) => {
    window.open(demoUrl, '_blank');
  };

  return (
    <div className="plugin-marketplace p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plugin Marketplace</h1>
          <p className="text-gray-600">
            Discover and install free, open-source plugins from the community
          </p>
        </div>

        {/* Repository Sources */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plugin Repositories</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sourceRepositories.map(repo => (
              <div key={repo.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div className="flex items-center mb-2">
                  <repo.icon className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="font-semibold">{repo.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{repo.description}</p>
                <button 
                  onClick={() => openRepository(repo.url)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Browse Repository →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search plugins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="downloads">Most Downloaded</option>
                <option value="stars">Most Stars</option>
                <option value="recent">Recently Updated</option>
                <option value="name">Name (A-Z)</option>
              </select>
              
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSortBy('downloads');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Plugin Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlugins.map(plugin => (
            <div key={plugin.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Plugin Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{plugin.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{plugin.name}</h3>
                      <p className="text-sm text-gray-600">by {plugin.author}</p>
                    </div>
                  </div>
                  {plugin.featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {plugin.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {plugin.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                  {plugin.tags.length > 3 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{plugin.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Plugin Stats */}
              <div className="px-4 pb-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-gray-500" />
                    <span>{plugin.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span>{plugin.stars}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(plugin.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span>{plugin.license}</span>
                  </div>
                </div>
              </div>
              
              {/* Plugin Actions */}
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => openRepository(plugin.repoUrl)}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Github className="w-4 h-4" />
                    Repository
                  </button>
                  
                  {plugin.docsUrl && (
                    <button
                      onClick={() => openDocumentation(plugin.docsUrl!)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      Docs
                    </button>
                  )}
                  
                  {plugin.demoUrl && (
                    <button
                      onClick={() => openDemo(plugin.demoUrl!)}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Demo
                    </button>
                  )}
                  
                  <button
                    onClick={() => installPlugin(plugin.id)}
                    disabled={installingPlugins.has(plugin.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                      installingPlugins.has(plugin.id)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {installingPlugins.has(plugin.id) ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Install
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Compatibility */}
              <div className="px-4 pb-4">
                {plugin.compatible ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    Compatible with your version
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    May require compatibility updates
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPlugins.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No plugins found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PluginMarketplace;