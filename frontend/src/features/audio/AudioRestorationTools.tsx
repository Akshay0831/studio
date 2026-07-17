import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Scan, 
  Zap, 
  Droplets, 
  Mic,
  RotateCcw,
  Download,
  Upload,
  Settings2,
  Play,
  Pause,
  Volume2,
  BarChart3,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';
import { useAudioComposition } from '../../hooks/useAudioComposition';

interface RestorationTool {
  id: string;
  name: string;
  type: 'declick' | 'denoise' | 'declip' | 'dehum' | 'voice' | 'pitch' | 'time' | 'mastering';
  enabled: boolean;
  parameters: Record<string, number>;
  color: string;
  progress: number;
}

interface NoiseProfile {
  id: string;
  name: string;
  samplingRate: number;
  noiseType: 'hiss' | 'hum' | 'click' | 'crackle' | 'wobble' | 'burst';
  captured: boolean;
  waveform: number[];
}

const AudioRestorationTools: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { compose } = useAudioComposition();
  
  const [tools, setTools] = useState<RestorationTool[]>([
    {
      id: 'declick',
      name: 'Click/Pop Removal',
      type: 'declick',
      enabled: true,
      parameters: {
        threshold: 0.8,
        speed: 0.5,
        reduction: 0.9,
        smoothing: 0.3
      },
      color: '#EF4444',
      progress: 0
    },
    {
      id: 'denoise',
      name: 'Noise Reduction',
      type: 'denoise',
      enabled: false,
      parameters: {
        reduction: 12,
        sensitivity: 0.7,
        attack: 10,
        release: 100,
        lookahead: 3
      },
      color: '#3B82F6',
      progress: 0
    },
    {
      id: 'declip',
      name: 'De-clipping',
      type: 'declip',
      enabled: false,
      parameters: {
        threshold: -0.5,
        recovery: 0.8,
        smoothing: 0.5,
        harmonics: 1
      },
      color: '#10B981',
      progress: 0
    },
    {
      id: 'dehum',
      name: 'De-humming',
      type: 'dehum',
      enabled: false,
      parameters: {
        frequency: 50,
        width: 2,
        reduction: 0.8,
        Q: 30
      },
      color: '#F59E0B',
      progress: 0
    },
    {
      id: 'voice',
      name: 'Voice Enhancement',
      type: 'voice',
      enabled: false,
      parameters: {
        deesser: 0.5,
        brighten: 2,
        deess: 0.7,
        reduceBreath: 0.3,
        compress: 4
      },
      color: '#8B5CF6',
      progress: 0
    }
  ]);

  const [noiseProfiles, setNoiseProfiles] = useState<NoiseProfile[]>([
    {
      id: 'profile1',
      name: 'Room Hiss',
      samplingRate: 48000,
      noiseType: 'hiss',
      captured: false,
      waveform: Array.from({ length: 100 }, () => Math.random() * 0.1)
    },
    {
      id: 'profile2',
      name: '60Hz Hum',
      samplingRate: 48000,
      noiseType: 'hum',
      captured: false,
      waveform: Array.from({ length: 100 }, () => Math.sin(Math.random() * Math.PI * 2) * 0.2)
    }
  ]);

  const [selectedTool, setSelectedTool] = useState<string>('declick');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<{
    rms: number;
    peak: number;
    thd: number;
    snr: number;
    clicks: number;
    noiseLevel: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate analysis
  useEffect(() => {
    if (isAnalyzing) {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisResults({
          rms: 0.25,
          peak: 0.82,
          thd: 0.03,
          snr: 45,
          clicks: 12,
          noiseLevel: -35
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzing]);

  const toggleTool = (toolId: string) => {
    setTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, enabled: !tool.enabled }
        : tool
    ));
  };

  const updateToolParameter = (toolId: string, parameter: string, value: number) => {
    setTools(prev => prev.map(tool => 
      tool.id === toolId
        ? {
            ...tool,
            parameters: {
              ...tool.parameters,
              [parameter]: value
            }
          }
        : tool
    ));
  };

  const captureNoiseProfile = async (profileId: string) => {
    setIsAnalyzing(true);
    const profile = noiseProfiles.find(p => p.id === profileId);
    if (profile) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setNoiseProfiles(prev => prev.map(p => 
        p.id === profileId 
          ? { ...p, captured: true, waveform: Array.from({ length: 100 }, () => Math.random() * 0.05) }
          : p
      ));
    }
    setIsAnalyzing(false);
  };

  const applyRestoration = async (toolId: string) => {
    setIsProcessing(true);
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setTools(prev => prev.map(t => 
          t.id === toolId 
            ? { ...t, progress: i }
            : t
        ));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      setTools(prev => prev.map(t => 
        t.id === toolId 
          ? { ...t, progress: 0 }
          : t
      ));
    }
    setIsProcessing(false);
  };

  const renderWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw waveform
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < width; i++) {
      const sample = Math.sin(i * 0.1) * Math.random() * 0.5;
      const y = height / 2 - (sample * height / 2);
      
      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }

    ctx.stroke();
  };

  useEffect(() => {
    renderWaveform();
  }, []);

  const selectedToolData = tools.find(t => t.id === selectedTool);

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text flex items-center gap-2">
          <Wrench className="w-5 h-5 text-studio-accent" />
          Audio Restoration Tools
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAnalyzing(true)}
            disabled={isAnalyzing}
            className="px-4 py-1 bg-studio-hover rounded text-sm disabled:bg-studio-panel-darker"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Audio'}
          </button>
        </div>
      </div>

      {analysisResults && (
        <div className="px-4 py-3 bg-studio-panel-d border-b border-studio-border">
          <div className="grid grid-cols-6 gap-4 text-sm">
            <div className="text-center">
              <div className="text-studio-text-dim mb-1">RMS Level</div>
              <div className="font-semibold">{(analysisResults.rms * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-studio-text-dim mb-1">Peak Level</div>
              <div className="font-semibold">{(analysisResults.peak * 100).toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-studio-text-dim mb-1">THD</div>
              <div className="font-semibold">{(analysisResults.thd * 100).toFixed(2)}%</div>
            </div>
            <div className="text-center">
              <div className="text-studio-text-dim mb-1">SNR</div>
              <div className="font-semibold">{analysisResults.snr.toFixed(1)}dB</div>
            </div>
            <div className="text-center">
              <div className="text-studio-text-dim mb-1">Detected Clicks</div>
              <div className="font-semibold">{analysisResults.clicks}</div>
            </div>
            <div className="text-center">
              <div className="text-studio-text-dim mb-1">Noise Level</div>
              <div className="font-semibold">{analysisResults.noiseLevel.toFixed(1)}dB</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Tools List */}
        <div className="w-64 border-r border-studio-border bg-studio-panel-darker">
          <div className="p-3 border-b border-studio-border">
            <h3 className="text-sm font-medium text-studio-text">Restoration Tools</h3>
          </div>
          <div className="p-2 space-y-1">
            {tools.map(tool => (
              <div
                key={tool.id}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedTool === tool.id 
                    ? 'bg-studio-accent text-black' 
                    : 'hover:bg-studio-hover'
                }`}
                onClick={() => setSelectedTool(tool.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tool.color }}
                    />
                    <span className="text-sm font-medium">{tool.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTool(tool.id);
                    }}
                    className={`w-4 h-4 rounded border text-xs ${
                      tool.enabled 
                        ? 'bg-studio-accent text-black border-studio-accent' 
                        : 'border-studio-border text-studio-text'
                    }`}
                  >
                    {tool.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {tool.progress > 0 && (
                  <div className="mt-1">
                    <div className="w-full bg-studio-border rounded-full h-1">
                      <div 
                        className="bg-studio-accent h-1 rounded-full transition-all"
                        style={{ width: `${tool.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tool Controls */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-studio-text">
                {selectedToolData?.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => applyRestoration(selectedTool!)}
                  disabled={isProcessing}
                  className="px-4 py-1 bg-studio-accent text-black rounded text-sm disabled:bg-studio-hover"
                >
                  {isProcessing ? 'Processing...' : 'Apply Restoration'}
                </button>
              </div>
            </div>
            
            <div className="bg-studio-panel-darker rounded-lg p-4 mb-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full h-32 border border-studio-border rounded"
              />
            </div>
          </div>

          {selectedToolData && (
            <div className="mb-6 bg-studio-panel-darker rounded-lg p-4">
              <h4 className="text-base font-semibold text-studio-text mb-3">Parameters</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedToolData.parameters).map(([param, value]) => (
                  <div key={param}>
                    <label className="text-sm text-studio-text mb-1 block capitalize">
                      {param.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={param.includes('threshold') ? '-1' : '0'}
                        max={param.includes('reduction') ? '1' : param.includes('frequency') ? '200' : param.includes('Q') ? '100' : '10'}
                        step={param.includes('threshold') ? '0.01' : '0.1'}
                        value={value}
                        onChange={(e) => updateToolParameter(selectedToolData.id, param, parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-studio-text w-12 text-right">
                        {value}
                        {param.includes('frequency') ? 'Hz' : param.includes('Q') ? '' : param.includes('reduction') || param.includes('threshold') ? '' : param.includes('smoothing') || param.includes('attack') || param.includes('release') ? 'ms' : param.includes('sensitivity') || param.includes('speed') || param.includes('brighten') || param.includes('deess') || param.includes('reduceBreath') || param.includes('compress') ? '' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Noise Profile Section */}
          <div className="bg-studio-panel-darker rounded-lg p-4">
            <h4 className="text-base font-semibold text-studio-text mb-3 flex items-center gap-2">
              <Scan className="w-4 h-4" />
              Noise Profiles
            </h4>
            
            <div className="space-y-3">
              {noiseProfiles.map(profile => (
                <div key={profile.id} className="p-3 bg-studio-panel rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-studio-text">
                        {profile.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        profile.captured 
                          ? 'bg-green-500 text-white' 
                          : 'bg-studio-hover text-studio-text'
                      }`}>
                        {profile.captured ? 'Captured' : 'Not Captured'}
                      </span>
                    </div>
                    <button
                      onClick={() => captureNoiseProfile(profile.id)}
                      disabled={profile.captured || isAnalyzing}
                      className="px-3 py-1 text-xs bg-studio-hover rounded disabled:bg-studio-panel-darker"
                    >
                      {isAnalyzing ? 'Capturing...' : 'Capture Profile'}
                    </button>
                  </div>
                  
                  <div className="text-xs text-studio-text-dim mb-2">
                    {profile.noiseType} • {profile.samplingRate/1000}kHz
                  </div>
                  
                  <div className="h-8 bg-black/20 rounded overflow-hidden">
                    <div className="h-full flex items-center justify-center text-xs text-studio-text-dim">
                      {profile.captured ? 'Noise profile captured' : 'Click Capture to analyze noise'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button className="p-3 bg-studio-panel rounded-lg text-sm text-studio-text hover:bg-studio-hover transition-colors">
              <TrendingDown className="w-4 h-4 mb-1" />
              Remove DC Offset
            </button>
            <button className="p-3 bg-studio-panel rounded-lg text-sm text-studio-text hover:bg-studio-hover transition-colors">
              <AlertTriangle className="w-4 h-4 mb-1" />
              Auto Detect Issues
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRestorationTools;