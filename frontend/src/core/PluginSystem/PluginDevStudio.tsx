import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Play, 
  Pause, 
  Save, 
  FolderOpen,
  FileText,
  Settings2,
  Terminal,
  Package,
  TestTube,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Zap,
  AlertCircle,
  CheckCircle,
  Timer,
  Plus
} from 'lucide-react';

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
    description?: string;
  };
  minStudioVersion?: string;
}

interface PluginProject {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: 'image' | 'audio' | 'effect' | 'automation';
  status: 'new' | 'development' | 'testing' | 'published';
  files: PluginFile[];
  dependencies: string[];
  permissions: string[];
  lastModified: Date;
  buildStatus: 'idle' | 'building' | 'testing' | 'success' | 'error';
}

interface PluginFile {
  name: string;
  type: 'manifest' | 'main' | 'styles' | 'assets' | 'tests';
  content: string;
  modified: boolean;
}

const pluginTemplates = [
  {
    name: 'Image Filter Plugin',
    description: 'Create custom image filters and effects',
    manifest: {
      id: 'image-filter-example',
      name: 'Image Filter Example',
      version: '1.0.0',
      description: 'A simple image filter plugin',
      author: {
        name: 'Developer',
        email: 'dev@example.com'
      },
      main: 'index.js',
      sandboxed: true,
      categories: ['image-processing'],
      tags: ['filter', 'effect', 'example'],
      permissions: ['read-canvas', 'write-canvas']
    },
    main: `class ImageFilterPlugin {
  constructor() {
    this.id = 'image-filter-example';
    this.name = 'Image Filter Example';
    this.version = '1.0.0';
  }

  // Plugin entry point
  async processImage(canvas, context, params = {}) {
    // Implement your image processing logic here
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Example: Apply grayscale filter
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    
    context.putImageData(imageData, 0, 0);
    return canvas;
  }

  // Plugin API
  getParameters() {
    return [
      {
        id: 'intensity',
        name: 'Intensity',
        type: 'slider',
        min: 0,
        max: 100,
        default: 50
      }
    ];
  }
}

export default ImageFilterPlugin;`,
    styles: `.filter-plugin {
  user-select: none;
}

.filter-controls {
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 4px;
}

.filter-slider {
  width: 100%;
  margin: 5px 0;
}`
  },
  {
    name: 'Audio Effect Plugin',
    description: 'Create custom audio processing and effects',
    manifest: {
      id: 'audio-effect-example',
      name: 'Audio Effect Example',
      version: '1.0.0',
      description: 'A simple audio effect plugin',
      author: {
        name: 'Developer',
        email: 'dev@example.com'
      },
      main: 'index.js',
      sandboxed: true,
      categories: ['audio-processing'],
      tags: ['audio', 'effect', 'example'],
      permissions: ['read-audio', 'write-audio']
    },
    main: `class AudioEffectPlugin {
  constructor() {
    this.id = 'audio-effect-example';
    this.name = 'Audio Effect Example';
    this.version = '1.0.0';
    this.audioContext = null;
    this.source = null;
    this.processor = null;
  }

  // Plugin entry point
  async processAudio(audioBuffer, params = {}) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create processor node
    this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);
    
    // Process audio
    const data = audioBuffer.getChannelData(0);
    const processedData = new Float32Array(data.length);
    
    // Example: Apply simple gain
    const gain = params.gain || 1.0;
    for (let i = 0; i < data.length; i++) {
      processedData[i] = data[i] * gain;
    }
    
    // Create new buffer
    const processedBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    processedBuffer.copyToChannel(processedData, 0);
    
    return processedBuffer;
  }

  // Plugin API
  getParameters() {
    return [
      {
        id: 'gain',
        name: 'Gain',
        type: 'slider',
        min: -20,
        max: 20,
        default: 0
      }
    ];
  }
}

export default AudioEffectPlugin;`,
    styles: `.audio-plugin {
  user-select: none;
}

.audio-controls {
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  border-radius: 4px;
}

.audio-slider {
  width: 100%;
  margin: 5px 0;
}`
  }
];

const PluginDevStudio: React.FC = () => {
  const [projects, setProjects] = useState<PluginProject[]>([
    {
      id: 'project-1',
      name: 'Vintage Photo Effect',
      version: '1.0.0',
      description: 'Add vintage photo effects with film grain',
      author: 'John Developer',
      type: 'image',
      status: 'development',
      files: [
        {
          name: 'manifest.json',
          type: 'manifest',
          content: JSON.stringify({
            id: 'vintage-photo-effect',
            name: 'Vintage Photo Effect',
            version: '1.0.0',
            description: 'Add vintage photo effects with film grain',
            author: {
              name: 'John Developer',
              email: 'john@example.com'
            },
            main: 'index.js',
            sandboxed: true,
            categories: ['image-processing'],
            tags: ['vintage', 'photo', 'effect'],
            permissions: ['read-canvas', 'write-canvas']
          }, null, 2),
          modified: false
        },
        {
          name: 'index.js',
          type: 'main',
          content: `class VintageEffectPlugin {
  constructor() {
    this.id = 'vintage-photo-effect';
    this.name = 'Vintage Photo Effect';
    this.version = '1.0.0';
  }

  async processImage(canvas, context, params = {}) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Apply sepia tone
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
    
    // Add film grain
    this.addFilmGrain(imageData, params.grainIntensity || 0.3);
    
    context.putImageData(imageData, 0, 0);
    return canvas;
  }

  addFilmGrain(imageData, intensity) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 255 * intensity;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
  }

  getParameters() {
    return [
      {
        id: 'grainIntensity',
        name: 'Grain Intensity',
        type: 'slider',
        min: 0,
        max: 1,
        default: 0.3,
        step: 0.1
      }
    ];
  }
}

export default VintageEffectPlugin;`,
          modified: true
        },
        {
          name: 'styles.css',
          type: 'styles',
          content: `.vintage-plugin {
  user-select: none;
}

.vintage-controls {
  background: rgba(0, 0, 0, 0.8);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.vintage-title {
  color: #8B4513;
  font-family: serif;
  font-size: 16px;
  margin-bottom: 10px;
}

.vintage-slider {
  width: 100%;
  margin: 8px 0;
}`,
          modified: false
        }
      ],
      dependencies: [],
      permissions: ['read-canvas', 'write-canvas'],
      lastModified: new Date(),
      buildStatus: 'idle'
    }
  ]);

  const [selectedProject, setSelectedProject] = useState<PluginProject | null>(null);
  const [selectedFile, setSelectedFile] = useState<PluginFile | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'test'>('editor');

  useEffect(() => {
    if (selectedProject && selectedProject.files.length > 0) {
      setSelectedFile(selectedProject.files[0]);
    }
  }, [selectedProject]);

  const createNewProject = (template: any) => {
    const newProject: PluginProject = {
      id: `project-${Date.now()}`,
      name: template.name,
      version: '1.0.0',
      description: template.description,
      author: 'You',
      type: 'image' as any,
      status: 'new',
      files: [
        {
          name: 'manifest.json',
          type: 'manifest',
          content: JSON.stringify(template.manifest, null, 2),
          modified: true
        },
        {
          name: 'index.js',
          type: 'main',
          content: template.main,
          modified: false
        },
        {
          name: 'styles.css',
          type: 'styles',
          content: template.styles || '',
          modified: false
        }
      ],
      dependencies: [],
      permissions: template.manifest.permissions || [],
      lastModified: new Date(),
      buildStatus: 'idle'
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProject(newProject);
  };

  const updateFileContent = (content: string) => {
    if (!selectedProject || !selectedFile) return;

    const updatedProjects = projects.map(project => {
      if (project.id === selectedProject.id) {
        const updatedFiles = project.files.map(file => {
          if (file.name === selectedFile.name) {
            return { ...file, content, modified: true };
          }
          return file;
        });

        return {
          ...project,
          files: updatedFiles,
          lastModified: new Date()
        };
      }
      return project;
    });

    setProjects(updatedProjects);
    setSelectedProject({
      ...selectedProject,
      files: updatedProjects.find(p => p.id === selectedProject.id)!.files
    });
    setSelectedFile({
      ...selectedFile,
      content,
      modified: true
    });
  };

  const buildPlugin = async () => {
    if (!selectedProject) return;

    setIsBuilding(true);
    setOutput(['Building plugin...', 'Checking manifest...', 'Validating code...']);

    // Simulate build process
    setTimeout(() => {
      setOutput([
        '✓ Manifest validation passed',
        '✓ Code syntax validation passed',
        '✓ Dependencies resolved',
        '✓ Bundle created successfully',
        'Plugin built successfully!'
      ]);
      setIsBuilding(false);
      
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { ...p, buildStatus: 'success' }
          : p
      ));
    }, 3000);
  };

  const testPlugin = async () => {
    if (!selectedProject) return;

    setIsTesting(true);
    setOutput(['Running tests...', 'Loading test environment...', 'Testing plugin functionality...']);

    // Simulate test process
    setTimeout(() => {
      setOutput([
        '✓ Basic functionality test passed',
        '✓ Image processing test passed',
        '✓ Parameter validation passed',
        '✓ Memory usage test passed',
        '✓ All tests passed successfully!'
      ]);
      setIsTesting(false);
      
      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id 
          ? { ...p, buildStatus: 'success' }
          : p
      ));
    }, 3000);
  };

  const saveProject = () => {
    if (!selectedProject) return;
    
    setOutput(['Saving project...', 'Files saved successfully!']);
    
    setProjects(prev => prev.map(p => 
      p.id === selectedProject.id 
        ? { ...p, status: 'development', modified: false }
        : p
    ));
  };

  const exportPlugin = () => {
    if (!selectedProject) return;
    
    // Create export package
    const exportData = {
      manifest: selectedProject.files.find(f => f.type === 'manifest')?.content || '{}',
      main: selectedProject.files.find(f => f.type === 'main')?.content || '',
      styles: selectedProject.files.find(f => f.type === 'styles')?.content || '',
      version: selectedProject.version,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject.name.replace(/\s+/g, '-').toLowerCase()}-v${selectedProject.version}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setOutput(['Plugin exported successfully!', `File: ${selectedProject.name}-v${selectedProject.version}.zip`]);
  };

  const runCodePreview = () => {
    if (!selectedProject || !selectedFile?.content) return;
    
    // This would actually run the plugin in a sandboxed environment
    setOutput(['Running plugin preview...', 'Initializing sandbox environment...', 'Plugin preview loaded successfully!']);
  };

  const getBuildStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'building': return 'text-yellow-500';
      case 'testing': return 'text-blue-500';
      default: return 'text-studio-text';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'building': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'testing': return <Timer className="w-4 h-4 text-blue-500 animate-pulse" />;
      default: return <Code className="w-4 h-4 text-studio-text" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text flex items-center gap-2">
          <Code className="w-5 h-5 text-studio-accent" />
          Plugin Development Studio
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80">
            <Upload className="w-4 h-4 inline mr-1" />
            Import
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Projects Sidebar */}
        <div className="w-64 border-r border-studio-border bg-studio-panel-darker">
          <div className="p-3 border-b border-studio-border">
            <h3 className="text-sm font-medium text-studio-text mb-2">Projects</h3>
            
            <button className="w-full px-3 py-2 bg-studio-accent text-black rounded text-sm font-medium mb-2 hover:bg-studio-accent/80">
              <Plus className="w-4 h-4 inline mr-1" />
              New Project
            </button>
            
            <div className="space-y-1 mb-3">
              <h4 className="text-xs font-medium text-studio-text-dim">Templates</h4>
              {pluginTemplates.map(template => (
                <button
                  key={template.name}
                  onClick={() => createNewProject(template)}
                  className="w-full text-left px-3 py-2 text-xs text-studio-text hover:bg-studio-hover rounded"
                >
                  {template.name}
                </button>
              ))}
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-studio-text-dim">My Projects</h4>
              {projects.map(project => (
                <div
                  key={project.id}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedProject?.id === project.id 
                      ? 'bg-studio-accent text-black' 
                      : 'hover:bg-studio-hover'
                  }`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{project.name}</span>
                    <span className="text-xs">{getStatusIcon(project.buildStatus)}</span>
                  </div>
                  <div className="text-xs text-studio-text-dim">
                    {project.type} • {project.version}
                  </div>
                  <div className={`text-xs ${getBuildStatusColor(project.buildStatus)}`}>
                    {project.buildStatus}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedProject ? (
            <>
              {/* Project Header */}
              <div className="p-4 border-b border-studio-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-studio-text">{selectedProject.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-studio-text-dim">v{selectedProject.version}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        selectedProject.status === 'published' ? 'bg-green-500 text-white' :
                        selectedProject.status === 'development' ? 'bg-blue-500 text-white' :
                        'bg-studio-hover text-studio-text'
                      }`}>
                        {selectedProject.status}
                      </span>
                      <span className="text-sm text-studio-text-dim">
                        {getStatusIcon(selectedProject.buildStatus)}
                        {selectedProject.buildStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveProject}
                      className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text hover:bg-studio-hover/80"
                    >
                      <Save className="w-4 h-4 inline mr-1" />
                      Save
                    </button>
                    <button
                      onClick={buildPlugin}
                      disabled={isBuilding}
                      className="px-3 py-1 bg-studio-accent text-black rounded text-sm disabled:bg-studio-hover"
                    >
                      {isBuilding ? 'Building...' : 'Build'}
                    </button>
                    <button
                      onClick={testPlugin}
                      disabled={isTesting}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-blue-500/50"
                    >
                      {isTesting ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={exportPlugin}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-500/80"
                    >
                      <Download className="w-4 h-4 inline mr-1" />
                      Export
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-studio-border">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'editor'
                      ? 'text-black border-b-2 border-studio-accent bg-studio-accent/10'
                      : 'text-studio-text hover:bg-studio-hover'
                  }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'preview'
                      ? 'text-black border-b-2 border-studio-accent bg-studio-accent/10'
                      : 'text-studio-text hover:bg-studio-hover'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('test')}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'test'
                      ? 'text-black border-b-2 border-studio-accent bg-studio-accent/10'
                      : 'text-studio-text hover:bg-studio-hover'
                  }`}
                >
                  Test Results
                </button>
              </div>

              {/* Content */}
              {activeTab === 'editor' && (
                <div className="flex-1 flex">
                  {/* File Explorer */}
                  <div className="w-48 border-r border-studio-panel bg-studio-panel-darker">
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-studio-text mb-2">Files</h4>
                      <div className="space-y-1">
                        {selectedProject.files.map(file => (
                          <div
                            key={file.name}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              selectedFile?.name === file.name 
                                ? 'bg-studio-accent text-black' 
                                : 'hover:bg-studio-hover'
                            }`}
                            onClick={() => setSelectedFile(file)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{file.name}</span>
                              {file.modified && <div className="w-2 h-2 bg-yellow-500 rounded-full" />}
                            </div>
                            <div className="text-xs text-studio-text-dim mt-1">
                              {file.type}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Code Editor */}
                  <div className="flex-1 flex flex-col">
                    {selectedFile && (
                      <>
                        <div className="p-2 border-b border-studio-border">
                          <h4 className="text-sm font-medium text-studio-text">
                            {selectedFile.name}
                          </h4>
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            value={selectedFile.content}
                            onChange={(e) => updateFileContent(e.target.value)}
                            className="w-full h-full p-4 bg-studio-panel border-none resize-none font-mono text-sm focus:outline-none"
                            spellCheck="false"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="flex-1 p-4">
                  <div className="bg-studio-panel-d rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-studio-text mb-4">Plugin Preview</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="aspect-video bg-studio-panel rounded flex items-center justify-center">
                        <span className="text-sm text-studio-text-dim">Preview Area</span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-studio-text mb-2">Parameters</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-studio-text w-20">Intensity</label>
                              <input type="range" className="flex-1" min="0" max="100" defaultValue="50" />
                              <span className="text-sm text-studio-text w-12">50</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-studio-text w-20">Blur</label>
                              <input type="range" className="flex-1" min="0" max="10" defaultValue="2" />
                              <span className="text-sm text-studio-text w-12">2</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={runCodePreview}
                          className="w-full py-2 bg-studio-accent text-black rounded font-medium hover:bg-studio-accent/80"
                        >
                          Run Preview
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'test' && (
                <div className="flex-1 p-4">
                  <div className="bg-studio-panel-d rounded-lg h-full p-4">
                    <h4 className="text-lg font-semibold text-studio-text mb-4">Build Output</h4>
                    <div className="h-full bg-black rounded p-4 overflow-auto font-mono text-sm">
                      {output.map((line, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-gray-500">$</span>
                          <span className={line.includes('✓') ? 'text-green-500' : line.includes('✗') ? 'text-red-500' : 'text-white'}>
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-studio-text-dim">
              <div className="text-center">
                <Code className="w-16 h-16 mx-auto mb-4 text-studio-panel-d" />
                <p>Select a project to start developing</p>
                <p className="text-sm mt-2">Or create a new project using the templates</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginDevStudio;