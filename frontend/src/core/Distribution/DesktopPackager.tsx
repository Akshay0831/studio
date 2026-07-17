import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Download, 
  Upload, 
  ExternalLink,
  Settings,
  Shield,
  Zap,
  Monitor,
  Smartphone,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Layers,
  Play,
  Pause,
  FolderOpen,
  Save,
  RefreshCw,
  Box,
  Target,
  Users,
  DollarSign,
  Code
} from 'lucide-react';

interface BuildTarget {
  id: string;
  name: string;
  platform: 'windows' | 'macos' | 'linux' | 'web';
  arch: 'x64' | 'arm64' | 'universal';
  icon: string;
  description: string;
  recommended: boolean;
}

interface BuildConfig {
  id: string;
  name: string;
  target: string;
  type: 'portable' | 'installer' | 'web';
  options: {
    includeUpdater: boolean;
    autoUpdate: boolean;
    includeDeps: boolean;
    compressAssets: boolean;
    enableLogging: boolean;
    enableTelemetry: boolean;
    createShortcut: boolean;
    registerFileAssociations: boolean;
    signApp: boolean;
    notarize: boolean;
  };
  status: 'idle' | 'configuring' | 'building' | 'testing' | 'packaging' | 'complete' | 'failed';
  progress: number;
  logs: string[];
  artifacts: string[];
}

interface DistributionPackage {
  id: string;
  name: string;
  version: string;
  platform: string;
  arch: string;
  size: number;
  checksum: string;
  downloadUrl: string;
  changelog: string;
  releaseDate: Date;
}

const DesktopPackager: React.FC = () => {
  const [buildConfigs, setBuildConfigs] = useState<BuildConfig[]>([
    {
      id: 'config-1',
      name: 'Windows Installer',
      target: 'windows-x64',
      type: 'installer',
      options: {
        includeUpdater: true,
        autoUpdate: true,
        includeDeps: true,
        compressAssets: true,
        enableLogging: false,
        enableTelemetry: true,
        createShortcut: true,
        registerFileAssociations: true,
        signApp: true,
        notarize: false
      },
      status: 'idle',
      progress: 0,
      logs: [],
      artifacts: []
    },
    {
      id: 'config-2',
      name: 'macOS Application',
      target: 'macos-x64',
      type: 'portable',
      options: {
        includeUpdater: true,
        autoUpdate: true,
        includeDeps: true,
        compressAssets: true,
        enableLogging: false,
        enableTelemetry: false,
        createShortcut: false,
        registerFileAssociations: false,
        signApp: true,
        notarize: true
      },
      status: 'idle',
      progress: 0,
      logs: [],
      artifacts: []
    },
    {
      id: 'config-3',
      name: 'Linux Portable',
      target: 'linux-x64',
      type: 'portable',
      options: {
        includeUpdater: false,
        autoUpdate: false,
        includeDeps: true,
        compressAssets: true,
        enableLogging: true,
        enableTelemetry: false,
        createShortcut: false,
        registerFileAssociations: false,
        signApp: false,
        notarize: false
      },
      status: 'idle',
      progress: 0,
      logs: [],
      artifacts: []
    }
  ]);

  const [distributionPackages, setDistributionPackages] = useState<DistributionPackage[]>([
    {
      id: 'dist-1',
      name: 'Studio Pro',
      version: '1.0.0',
      platform: 'windows',
      arch: 'x64',
      size: 125000000,
      checksum: 'sha256:abc123...',
      downloadUrl: 'https://downloads.studio-pro.com/v1.0.0/Studio-Pro-Windows.exe',
      changelog: 'Initial release with full feature set',
      releaseDate: new Date('2026-07-16')
    }
  ]);

  const [selectedConfig, setSelectedConfig] = useState<BuildConfig | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildTarget, setBuildTarget] = useState<string>('windows-x64');
  const [autoPublish, setAutoPublish] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');

  const buildTargets: BuildTarget[] = [
    {
      id: 'windows-x64',
      name: 'Windows (64-bit)',
      platform: 'windows',
      arch: 'x64',
      icon: '🪟',
      description: 'Windows installer with auto-update and system integration',
      recommended: true
    },
    {
      id: 'windows-arm64',
      name: 'Windows (ARM64)',
      platform: 'windows',
      arch: 'arm64',
      icon: '🪟',
      description: 'Windows ARM64 portable application',
      recommended: false
    },
    {
      id: 'macos-x64',
      name: 'macOS (Intel)',
      platform: 'macos',
      arch: 'x64',
      icon: '🍎',
      description: 'macOS application bundle with code signing',
      recommended: false
    },
    {
      id: 'macos-arm64',
      name: 'macOS (Apple Silicon)',
      platform: 'macos',
      arch: 'arm64',
      icon: '🍎',
      description: 'Native Apple Silicon application bundle',
      recommended: true
    },
    {
      id: 'linux-x64',
      name: 'Linux (64-bit)',
      platform: 'linux',
      arch: 'x64',
      icon: '🐧',
      description: 'Linux portable application',
      recommended: true
    },
    {
      id: 'linux-arm64',
      name: 'Linux (ARM64)',
      platform: 'linux',
      arch: 'arm64',
      icon: '🐧',
      description: 'Linux ARM64 portable application',
      recommended: false
    },
    {
      id: 'web-pwa',
      name: 'Web PWA',
      platform: 'web',
      arch: 'universal',
      icon: '🌐',
      description: 'Progressive Web App for browser deployment',
      recommended: true
    }
  ];

  const startBuild = async (configId: string) => {
    if (isBuilding) return;
    
    setIsBuilding(true);
    setBuildConfigs(prev => prev.map(config => 
      config.id === configId 
        ? { ...config, status: 'building', progress: 0 }
        : config
    ));

    // Simulate build process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setBuildConfigs(prev => prev.map(config => 
        config.id === configId 
          ? { ...config, progress: Math.min(progress, 100) }
          : config
      ));

      if (progress >= 100) {
        clearInterval(interval);
        setBuildConfigs(prev => prev.map(config => 
          config.id === configId 
            ? { 
                ...config, 
                status: 'complete',
                progress: 100,
                artifacts: [
                  `${config.name.toLowerCase()}-${Date.now()}.exe`,
                  `${config.name.toLowerCase()}-setup-${Date.now()}.msi`
                ]
              }
            : config
        ));
        setIsBuilding(false);
      }
    }, 500);
  };

  const downloadArtifact = (artifact: string) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = artifact;
    link.download = artifact;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadToStore = async (platform: string) => {
    // Simulate store upload
    alert(`Uploading to ${platform} store...`);
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'building': return 'text-blue-500';
      case 'packaging': return 'text-yellow-500';
      case 'testing': return 'text-purple-500';
      default: return 'text-studio-text';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'building': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'packaging': return <Package className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'testing': return <BarChart3 className="w-4 h-4 text-purple-500 animate-pulse" />;
      default: return <Layers className="w-4 h-4 text-studio-text" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text flex items-center gap-2">
          <Package className="w-5 h-5 text-studio-accent" />
          Desktop Application Distribution
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Build Configurations */}
        <div className="w-64 border-r border-studio-border bg-studio-panel-darker">
          <div className="p-3 border-b border-studio-border">
            <h3 className="text-sm font-medium text-studio-text mb-2">Build Configurations</h3>
          </div>
          <div className="p-2 space-y-1">
            {buildConfigs.map(config => (
              <div
                key={config.id}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedConfig?.id === config.id 
                    ? 'bg-studio-accent text-black' 
                    : 'hover:bg-studio-hover'
                }`}
                onClick={() => setSelectedConfig(config)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{config.name}</span>
                  {getStatusIcon(config.status)}
                </div>
                <div className={`text-xs ${getStatusColor(config.status)}`}>
                  {config.status}
                  {config.status === 'building' && ` (${config.progress}%)`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4">
          {selectedConfig ? (
            <>
              {/* Configuration Overview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-studio-text">{selectedConfig.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startBuild(selectedConfig.id)}
                      disabled={isBuilding || selectedConfig.status === 'complete'}
                      className="px-4 py-1 bg-studio-accent text-black rounded text-sm disabled:bg-studio-hover"
                    >
                      {isBuilding ? 'Building...' : 'Start Build'}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-studio-text-dim" />
                    <span>Target: {selectedConfig.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-studio-text-dim" />
                    <span>Type: {selectedConfig.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-studio-text-dim" />
                    <span>Status: {selectedConfig.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedConfig.status === 'building' && (
                      <>
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        <span>Progress: {selectedConfig.progress}%</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Build Progress */}
                {selectedConfig.status === 'building' && (
                  <div className="mt-4">
                    <div className="w-full bg-studio-border rounded-full h-2">
                      <div 
                        className="bg-studio-accent h-2 rounded-full transition-all"
                        style={{ width: `${selectedConfig.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Build Logs */}
                <div className="mt-4 bg-studio-panel-d rounded-lg p-3 max-h-40 overflow-auto">
                  <h4 className="text-sm font-semibold text-studio-text mb-2">Build Logs</h4>
                  <div className="text-xs font-mono text-studio-text-dim">
                    {selectedConfig.logs.length > 0 ? (
                      selectedConfig.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-gray-500">$</span> {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-studio-text-dim">Build logs will appear here...</div>
                    )}
                  </div>
                </div>

                {/* Build Artifacts */}
                {selectedConfig.artifacts.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-studio-text mb-2">Generated Artifacts</h4>
                    <div className="space-y-2">
                      {selectedConfig.artifacts.map((artifact, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-studio-panel rounded">
                          <span className="text-sm text-studio-text">{artifact}</span>
                          <button
                            onClick={() => downloadArtifact(artifact)}
                            className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Configuration Options */}
              <div className="mb-6 bg-studio-panel-d rounded-lg p-4">
                <h4 className="text-lg font-semibold text-studio-text mb-4">Build Options</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-2 bg-studio-panel rounded">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>Auto Update</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedConfig.options.autoUpdate}
                      onChange={(e) => setBuildConfigs(prev => prev.map(config => 
                        config.id === selectedConfig.id
                          ? {
                              ...config,
                              options: {
                                ...config.options,
                                autoUpdate: e.target.checked
                              }
                            }
                          : config
                      ))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-studio-panel rounded">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Code Signing</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedConfig.options.signApp}
                      onChange={(e) => setBuildConfigs(prev => prev.map(config => 
                        config.id === selectedConfig.id
                          ? {
                              ...config,
                              options: {
                                ...config.options,
                                signApp: e.target.checked
                              }
                            }
                          : config
                      ))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-studio-panel rounded">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Telemetry</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedConfig.options.enableTelemetry}
                      onChange={(e) => setBuildConfigs(prev => prev.map(config => 
                        config.id === selectedConfig.id
                          ? {
                              ...config,
                              options: {
                                ...config.options,
                                enableTelemetry: e.target.checked
                              }
                            }
                          : config
                      ))}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-studio-panel rounded">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span>Shortcut</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedConfig.options.createShortcut}
                      onChange={(e) => setBuildConfigs(prev => prev.map(config => 
                        config.id === selectedConfig.id
                          ? {
                              ...config,
                              options: {
                                ...config.options,
                                createShortcut: e.target.checked
                              }
                            }
                          : config
                      ))}
                      className="rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Distribution Actions */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-studio-text mb-4">Distribution Actions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-3 bg-studio-panel rounded-lg text-sm text-studio-text hover:bg-studio-hover transition-colors flex items-center justify-center gap-2">
                    <Package className="w-4 h-4" />
                    Package for Distribution
                  </button>
                  <button className="p-3 bg-studio-panel rounded-lg text-sm text-studio-text hover:bg-studio-hover transition-colors flex items-center justify-center gap-2">
                    <Globe className="w-4 h-4" />
                    Upload to Store
                  </button>
                  <button className="p-3 bg-studio-panel rounded-lg text-sm text-studio-text hover:bg-studio-hover transition-colors flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Generate License Key
                  </button>
                  <button className="p-3 bg-studio-panel rounded-lg text-sm text-studio-text hover:bg-studio-hover transition-colors flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    Create Installer Config
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-studio-text-dim">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-studio-panel-d" />
                <p>Select a build configuration to get started</p>
                <p className="text-sm mt-2">Configure your desktop app builds for different platforms</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesktopPackager;