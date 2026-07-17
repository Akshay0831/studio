import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Tag, 
  Calendar, 
  Users, 
  Globe,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Zap,
  Plus,
  Shield,
  Package,
  FileText,
  Copy,
  Eye,
  Play,
  Pause,
  RefreshCw,
  ArrowUpRight,
  Settings2,
  Monitor,
  Smartphone,
  Server,
  Code
} from 'lucide-react';

interface Release {
  id: string;
  version: string;
  name: string;
  description: string;
  platform: string;
  architecture: string;
  size: number;
  status: 'draft' | 'published' | 'archived';
  releaseDate: Date;
  downloadCount: number;
  changelog: string;
  artifacts: ReleaseArtifact[];
  checksums: Record<string, string>;
  signatures: ReleaseSignature[];
  dependencies: ReleaseDependency[];
}

interface ReleaseArtifact {
  id: string;
  name: string;
  type: 'installer' | 'portable' | 'source' | 'documentation';
  platform: string;
  architecture: string;
  size: number;
  downloadUrl: string;
  checksum: string;
  signature?: string;
}

interface ReleaseSignature {
  type: 'code-signing' | 'timestamp' | 'publisher';
  algorithm: 'sha256' | 'sha512';
  certificate: string;
  timestamp: Date;
  valid: boolean;
}

interface ReleaseDependency {
  name: string;
  version: string;
  type: 'runtime' | 'framework' | 'library';
  optional: boolean;
}

interface ReleaseVersion {
  version: string;
  platform: string;
  architecture: string;
  status: 'ready' | 'building' | 'testing' | 'deployed';
  buildTime: Date;
  artifact: string;
}

const ReleaseManager: React.FC = () => {
  const [releases, setReleases] = useState<Release[]>([
    {
      id: 'release-1',
      version: '1.0.0',
      name: 'Studio Pro v1.0.0',
      description: 'Initial stable release with full feature set',
      platform: 'windows',
      architecture: 'x64',
      size: 125000000,
      status: 'published',
      releaseDate: new Date('2026-07-16'),
      downloadCount: 5420,
      changelog: 'Initial release with full feature set\n\n- Professional image editing tools\n- Advanced audio processing\n- Plugin system integration\n- Team collaboration features',
      artifacts: [
        {
          id: 'artifact-1',
          name: 'Studio-Pro-Windows-1.0.0.exe',
          type: 'installer',
          platform: 'windows',
          architecture: 'x64',
          size: 125000000,
          downloadUrl: 'https://downloads.studio-pro.com/v1.0.0/Studio-Pro-Windows.exe',
          checksum: 'sha256:abc123...',
          signature: 'code-signing-cert-123'
        }
      ],
      checksums: {
        'windows-x64': 'sha256:abc123...',
        'macos-x64': 'sha256:def456...'
      },
      signatures: [
        {
          type: 'code-signing',
          algorithm: 'sha256',
          certificate: 'CN=Studio Pro, O=Studio Inc',
          timestamp: new Date('2026-07-16'),
          valid: true
        }
      ],
      dependencies: [
        { name: '.NET Runtime', version: '6.0', type: 'runtime', optional: false },
        { name: 'DirectX', version: '11.0', type: 'framework', optional: false }
      ]
    }
  ]);

  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newVersion, setNewVersion] = useState('1.0.1');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['windows', 'macos']);

  const platforms = ['windows', 'macos', 'linux', 'web'];
  const architectures = {
    windows: ['x64', 'arm64'],
    macos: ['x64', 'arm64'],
    linux: ['x64', 'arm64'],
    web: ['universal']
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    setIsUploading(false);
    setUploadProgress(0);
  };

  const publishRelease = (releaseId: string) => {
    setReleases(prev => prev.map(release => 
      release.id === releaseId 
        ? { ...release, status: 'published' }
        : release
    ));
  };

  const generateChecksums = (artifact: ReleaseArtifact) => {
    return {
      [`${artifact.platform}-${artifact.architecture}`]: `sha256:${Math.random().toString(16).substr(2, 32)}`
    };
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'windows': return <Monitor className="w-5 h-5" />;
      case 'macos': return <Monitor className="w-5 h-5" />;
      case 'linux': return <Server className="w-5 h-5" />;
      case 'web': return <Globe className="w-5 h-5" />;
      default: return <Code className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-500';
      case 'draft': return 'text-yellow-500';
      case 'archived': return 'text-gray-500';
      default: return 'text-studio-text';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'archived': return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default: return <RefreshCw className="w-4 h-4 text-studio-text" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text flex items-center gap-2">
          <Package className="w-5 h-5 text-studio-accent" />
          Release Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-3 py-1 bg-studio-accent text-black rounded text-sm disabled:bg-studio-hover"
          >
            {isUploading ? `Uploading ${uploadProgress}%` : 'Upload Release'}
          </button>
          <button className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
            <RefreshCw className="w-4 h-4 inline mr-1" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Releases List */}
        <div className="w-64 border-r border-studio-border bg-studio-panel-darker">
          <div className="p-3 border-b border-studio-border">
            <h3 className="text-sm font-medium text-studio-text mb-2">Releases</h3>
          </div>
          <div className="p-2 space-y-1">
            {releases.map(release => (
              <div
                key={release.id}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedRelease?.id === release.id 
                    ? 'bg-studio-accent text-black' 
                    : 'hover:bg-studio-hover'
                }`}
                onClick={() => setSelectedRelease(release)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{release.version}</span>
                  {getStatusIcon(release.status)}
                </div>
                <div className="text-xs text-studio-text-dim">
                  {release.platform} • {new Date(release.releaseDate).toLocaleDateString()}
                </div>
                <div className={`text-xs ${getStatusColor(release.status)}`}>
                  {release.status} • {release.downloadCount} downloads
                </div>
              </div>
            ))}
            
            <button
              className="w-full p-2 mt-3 bg-studio-accent text-black rounded text-sm font-medium hover:bg-studio-accent/80"
              onClick={() => {
                const newRelease: Release = {
                  id: `release-${Date.now()}`,
                  version: newVersion,
                  name: `Studio Pro ${newVersion}`,
                  description: 'New release with improvements and bug fixes',
                  platform: 'windows',
                  architecture: 'x64',
                  size: 120000000,
                  status: 'draft',
                  releaseDate: new Date(),
                  downloadCount: 0,
                  changelog: releaseNotes,
                  artifacts: [],
                  checksums: {},
                  signatures: [],
                  dependencies: [
                    { name: '.NET Runtime', version: '6.0', type: 'runtime', optional: false },
                    { name: 'DirectX', version: '11.0', type: 'framework', optional: false }
                  ]
                };
                setReleases(prev => [...prev, newRelease]);
                setSelectedRelease(newRelease);
              }}
            >
              <Plus className="w-4 h-4 inline mr-1" />
              New Release
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 overflow-auto">
          {selectedRelease ? (
            <>
              {/* Release Overview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-studio-text">
                    {selectedRelease.name}
                  </h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedRelease.status === 'published' ? 'bg-green-500 text-white' :
                      selectedRelease.status === 'draft' ? 'bg-yellow-500 text-black' :
                      'bg-gray-500 text-white'
                    }`}>
                      {selectedRelease.status}
                    </span>
                    {selectedRelease.status === 'draft' && (
                      <button
                        onClick={() => publishRelease(selectedRelease.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-500/80"
                      >
                        Publish
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-studio-text-dim" />
                    <span>Version: {selectedRelease.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-studio-text-dim" />
                    <span>Released: {new Date(selectedRelease.releaseDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-studio-text-dim" />
                    <span>Downloads: {selectedRelease.downloadCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-studio-text-dim" />
                    <span>Size: {formatFileSize(selectedRelease.size)}</span>
                  </div>
                </div>
              </div>

              {/* Release Information */}
              <div className="mb-6 bg-studio-panel-d rounded-lg p-4">
                <h4 className="text-lg font-semibold text-studio-text mb-3">Release Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="text-sm font-medium text-studio-text mb-1">Platform</h5>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(selectedRelease.platform)}
                      <span className="text-studio-text capitalize">{selectedRelease.platform}</span>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-studio-text mb-1">Architecture</h5>
                    <span className="text-studio-text">{selectedRelease.architecture}</span>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-studio-text mb-1">Checksum</h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-studio-text-dim">{selectedRelease.checksums[`${selectedRelease.platform}-${selectedRelease.architecture}`]}</span>
                      <button className="text-xs text-studio-accent hover:text-studio-accent/80">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-studio-text mb-1">Security</h5>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-studio-text">Signed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Changelog */}
              <div className="mb-6 bg-studio-panel-d rounded-lg p-4">
                <h4 className="text-lg font-semibold text-studio-text mb-3">Changelog</h4>
                <div className="bg-studio-panel rounded p-3">
                  <pre className="text-sm text-studio-text whitespace-pre-wrap">{selectedRelease.changelog}</pre>
                </div>
              </div>

              {/* Artifacts */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-studio-text mb-3">Download Artifacts</h4>
                <div className="space-y-3">
                  {selectedRelease.artifacts.map(artifact => (
                    <div key={artifact.id} className="flex items-center justify-between p-3 bg-studio-panel rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {artifact.type === 'installer' ? '📦' : '📁'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-studio-text">{artifact.name}</p>
                          <p className="text-xs text-studio-text-dim">
                            {formatFileSize(artifact.size)} • {artifact.platform}-{artifact.architecture}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-studio-text-dim">{artifact.checksum}</span>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = artifact.downloadUrl;
                            link.download = artifact.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="px-3 py-1 bg-studio-accent text-black rounded text-sm hover:bg-studio-accent/80"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-studio-text mb-3">Digital Signatures</h4>
                <div className="space-y-2">
                  {selectedRelease.signatures.map((signature, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-studio-panel rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-studio-accent" />
                        <div>
                          <p className="text-sm font-medium text-studio-text">{signature.type}</p>
                          <p className="text-xs text-studio-text-dim">{signature.algorithm} • {signature.certificate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          signature.valid ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {signature.valid ? 'Valid' : 'Invalid'}
                        </span>
                        <span className="text-xs text-studio-text-dim">
                          {new Date(signature.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-studio-text mb-3">Dependencies</h4>
                <div className="space-y-2">
                  {selectedRelease.dependencies.map((dependency, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-studio-panel rounded-lg">
                      <div className="flex items-center gap-2">
                        {dependency.optional ? (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-studio-text">{dependency.name}</p>
                          <p className="text-xs text-studio-text-dim">{dependency.version} ({dependency.type})</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        dependency.optional 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {dependency.optional ? 'Optional' : 'Required'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Release Statistics */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-studio-text mb-3">Release Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-studio-panel rounded-lg text-center">
                    <BarChart3 className="w-6 h-6 mx-auto mb-2 text-studio-accent" />
                    <p className="text-lg font-semibold text-studio-text">{selectedRelease.downloadCount}</p>
                    <p className="text-xs text-studio-text-dim">Downloads</p>
                  </div>
                  <div className="p-3 bg-studio-panel rounded-lg text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-studio-accent" />
                    <p className="text-lg font-semibold text-studio-text">+24%</p>
                    <p className="text-xs text-studio-text-dim">Growth</p>
                  </div>
                  <div className="p-3 bg-studio-panel rounded-lg text-center">
                    <Users className="w-6 h-6 mx-auto mb-2 text-studio-accent" />
                    <p className="text-lg font-semibold text-studio-text">1.2K</p>
                    <p className="text-xs text-studio-text-dim">Active Users</p>
                  </div>
                  <div className="p-3 bg-studio-panel rounded-lg text-center">
                    <Zap className="w-6 h-6 mx-auto mb-2 text-studio-accent" />
                    <p className="text-lg font-semibold text-studio-text">99.9%</p>
                    <p className="text-xs text-studio-text-dim">Uptime</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-studio-text-dim">
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-studio-panel-d" />
                <p>Select a release to view details</p>
                <p className="text-sm mt-2">Or create a new release to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseManager;