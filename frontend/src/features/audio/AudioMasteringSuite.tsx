import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, 
  Zap, 
  Volume2, 
  TrendingUp, 
  BarChart3,
  Download,
  Settings2,
  RotateCcw,
  Waves,
  Target,
  Shield
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';
import { useAudioComposition } from '../../hooks/useAudioComposition';

interface MasteringPlugin {
  id: string;
  name: string;
  type: 'limiter' | 'multiband' | 'eq' | 'exciter' | 'stereo' | 'maximizer';
  enabled: boolean;
  parameters: Record<string, number>;
  color: string;
}

interface LoudnessMeter {
  integrated: number;
  momentary: number;
  shortTerm: number;
  truePeak: number;
  loudnessRange: number;
}

const AudioMasteringSuite: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { compose } = useAudioComposition();
  
  const [plugins, setPlugins] = useState<MasteringPlugin[]>([
    {
      id: 'multiband',
      name: 'Multi-band Compressor',
      type: 'multiband',
      enabled: true,
      parameters: {
        crossover1: 250,
        crossover2: 2000,
        crossover3: 8000,
        ratioLow: 4,
        ratioMid: 2,
        ratioHigh: 6,
        thresholdLow: -20,
        thresholdMid: -18,
        thresholdHigh: -22
      },
      color: '#3B82F6'
    },
    {
      id: 'eq',
      name: 'Mastering EQ',
      type: 'eq',
      enabled: true,
      parameters: {
        low: -2,
        lowMid: 1,
        mid: 0,
        highMid: -1,
        high: 2,
        highShelf: 3
      },
      color: '#10B981'
    },
    {
      id: 'limiter',
      name: 'Limiter',
      type: 'limiter',
      enabled: true,
      parameters: {
        threshold: -1,
        ceiling: -0.1,
        attack: 5,
        release: 100,
        knee: 2
      },
      color: '#EF4444'
    },
    {
      id: 'exciter',
      name: 'Harmonic Exciter',
      type: 'exciter',
      enabled: false,
      parameters: {
        amount: 0.3,
        harmonics: 3,
        blend: 0.5,
        drive: 0.8
      },
      color: '#F59E0B'
    }
  ]);

  const [loudness, setLoudness] = useState<LoudnessMeter>({
    integrated: -14.2,
    momentary: -12.8,
    shortTerm: -14.0,
    truePeak: -1.2,
    loudnessRange: 3.2
  });

  const [targetLoudness, setTargetLoudness] = useState(-14.0);
  const [stereoWidth, setStereoWidth] = useState(1.0);
  const [overallLevel, setOverallLevel] = useState(-6.0);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate loudness meter updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLoudness({
        integrated: -14.2 + (Math.random() - 0.5) * 2,
        momentary: -12.8 + (Math.random() - 0.5) * 1.5,
        shortTerm: -14.0 + (Math.random() - 0.5) * 1.2,
        truePeak: -1.2 + (Math.random() - 0.5) * 0.8,
        loudnessRange: 3.2 + (Math.random() - 0.5) * 0.8
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const togglePlugin = (pluginId: string) => {
    setPlugins(prev => prev.map(plugin => 
      plugin.id === pluginId 
        ? { ...plugin, enabled: !plugin.enabled }
        : plugin
    ));
  };

  const updatePluginParameter = (pluginId: string, parameter: string, value: number) => {
    setPlugins(prev => prev.map(plugin => 
      plugin.id === pluginId
        ? {
            ...plugin,
            parameters: {
              ...plugin.parameters,
              [parameter]: value
            }
          }
        : plugin
    ));
  };

  const applyMasteringPreset = (preset: string) => {
    switch (preset) {
      case 'radio':
        setOverallLevel(-6.0);
        setTargetLoudness(-14.0);
        setStereoWidth(1.0);
        break;
      case 'streaming':
        setOverallLevel(-10.0);
        setTargetLoudness(-14.0);
        setStereoWidth(1.1);
        break;
      case 'cd':
        setOverallLevel(-9.0);
        setTargetLoudness(-14.0);
        setStereoWidth(1.0);
        break;
      case 'vinyl':
        setOverallLevel(-8.0);
        setTargetLoudness(-14.0);
        setStereoWidth(0.95);
        break;
    }
  };

  const handleMastering = async () => {
    setIsProcessing(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsProcessing(false);
    // Update loudness meters with processed values
    setLoudness({
      integrated: targetLoudness,
      momentary: targetLoudness + 1.2,
      shortTerm: targetLoudness + 0.8,
      truePeak: -0.1,
      loudnessRange: 3.0
    });
  };

  const renderLoudnessMeter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#EF4444');
    gradient.addColorStop(0.3, '#F59E0B');
    gradient.addColorStop(0.7, '#10B981');
    gradient.addColorStop(1, '#10B981');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw target line
    const targetX = ((targetLoudness + 30) / 30) * width;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(targetX, 0);
    ctx.lineTo(targetX, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw current level
    const currentX = ((loudness.integrated + 30) / 30) * width;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(currentX, height / 2, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw scale labels
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = -30; i <= 0; i += 10) {
      const x = ((i + 30) / 30) * width;
      ctx.fillText(`${i}dB`, x, height - 5);
    }
  };

  useEffect(() => {
    renderLoudnessMeter();
  }, [loudness, targetLoudness]);

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text flex items-center gap-2">
          <Crown className="w-5 h-5 text-studio-accent" />
          Mastering Suite
        </h2>
        <div className="flex gap-2">
          <select
            className="px-3 py-1 bg-studio-panel border border-studio-border rounded text-sm"
            onChange={(e) => applyMasteringPreset(e.target.value)}
          >
            <option>Custom</option>
            <option>Radio</option>
            <option>Streaming</option>
            <option>CD Quality</option>
            <option>Vinyl</option>
          </select>
          <button
            onClick={handleMastering}
            disabled={isProcessing}
            className="px-4 py-1 bg-studio-accent text-black rounded text-sm disabled:bg-studio-hover"
          >
            {isProcessing ? 'Processing...' : 'Master'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Plugin Chain */}
        <div className="w-80 border-r border-studio-border bg-studio-panel-darker">
          <div className="p-3 border-b border-studio-border">
            <h3 className="text-sm font-medium text-studio-text">Plugin Chain</h3>
          </div>
          <div className="p-2 space-y-2">
            {plugins.map((plugin, index) => (
              <div
                key={plugin.id}
                className="p-3 rounded-lg bg-studio-panel cursor-pointer hover:bg-studio-hover transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: plugin.color }}
                    />
                    <span className="text-sm font-medium text-studio-text">
                      {plugin.name}
                    </span>
                  </div>
                  <button
                    onClick={() => togglePlugin(plugin.id)}
                    className={`w-5 h-5 rounded border text-xs ${
                      plugin.enabled 
                        ? 'bg-studio-accent text-black border-studio-accent' 
                        : 'border-studio-border text-studio-text'
                    }`}
                  >
                    {plugin.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                <div className="text-xs text-studio-text-dim mb-2">
                  {plugin.parameters && Object.keys(plugin.parameters).length} parameters
                </div>
                
                <button
                  className="text-xs text-studio-accent hover:text-studio-accent/80"
                  onClick={() => {
                    const updatedPlugins = plugins.map(p => 
                      p.id === plugin.id 
                        ? { ...p, parameters: Object.fromEntries(Object.entries(p.parameters).map(([k, v]) => [k, 0])) }
                        : p
                    );
                    setPlugins(updatedPlugins);
                  }}
                >
                  Reset Parameters
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Controls and Analysis */}
        <div className="flex-1 p-4 overflow-auto">
          {/* Loudness Meter */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-studio-text mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Loudness Meter
            </h3>
            <div className="bg-studio-panel-darker rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={600}
                height={100}
                className="w-full h-24 border border-studio-border rounded mb-4"
              />
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-studio-text-dim mb-1">Integrated</div>
                  <div className="font-semibold">{loudness.integrated.toFixed(1)} LUFS</div>
                </div>
                <div className="text-center">
                  <div className="text-studio-text-dim mb-1">Momentary</div>
                  <div className="font-semibold">{loudness.momentary.toFixed(1)} LUFS</div>
                </div>
                <div className="text-center">
                  <div className="text-studio-text-dim mb-1">Short Term</div>
                  <div className="font-semibold">{loudness.shortTerm.toFixed(1)} LUFS</div>
                </div>
                <div className="text-center">
                  <div className="text-studio-text-dim mb-1">True Peak</div>
                  <div className="font-semibold">{loudness.truePeak.toFixed(1)} dBTP</div>
                </div>
                <div className="text-center">
                  <div className="text-studio-text-dim mb-1">Loudness Range</div>
                  <div className="font-semibold">{loudness.loudnessRange.toFixed(1)} LU</div>
                </div>
              </div>
            </div>
          </div>

          {/* Target Controls */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-studio-panel-darker rounded-lg p-4">
              <label className="text-sm text-studio-text mb-2 block">Target Loudness</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-20"
                  max="-10"
                  step="0.1"
                  value={targetLoudness}
                  onChange={(e) => setTargetLoudness(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-12 text-right">
                  {targetLoudness.toFixed(1)} LUFS
                </span>
              </div>
            </div>
            
            <div className="bg-studio-panel-darker rounded-lg p-4">
              <label className="text-sm text-studio-text mb-2 block">Overall Level</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="-12"
                  max="-3"
                  step="0.1"
                  value={overallLevel}
                  onChange={(e) => setOverallLevel(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-12 text-right">
                  {overallLevel.toFixed(1)} dB
                </span>
              </div>
            </div>
            
            <div className="bg-studio-panel-darker rounded-lg p-4">
              <label className="text-sm text-studio-text mb-2 block">Stereo Width</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.01"
                  value={stereoWidth}
                  onChange={(e) => setStereoWidth(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-12 text-right">
                  {stereoWidth.toFixed(2)}x
                </span>
              </div>
            </div>
          </div>

          {/* Active Plugin Controls */}
          {plugins.filter(p => p.enabled).map(plugin => (
            <div key={plugin.id} className="mb-6 bg-studio-panel-darker rounded-lg p-4">
              <h4 className="text-base font-semibold text-studio-text mb-3 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: plugin.color }}
                />
                {plugin.name}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(plugin.parameters).map(([param, value]) => (
                  <div key={param}>
                    <label className="text-sm text-studio-text mb-1 block capitalize">
                      {param.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={param.includes('threshold') || param.includes('ceiling') ? '-30' : '0'}
                        max={param.includes('threshold') || param.includes('ceiling') ? '0' : param.includes('ratio') ? '20' : param.includes('frequency') ? '20000' : '10'}
                        step={param.includes('frequency') ? '10' : '0.1'}
                        value={value}
                        onChange={(e) => updatePluginParameter(plugin.id, param, parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-studio-text w-12 text-right">
                        {value}
                        {param.includes('ratio') ? ':1' : param.includes('frequency') ? 'Hz' : param.includes('threshold') || param.includes('ceiling') ? 'dB' : param.includes('attack') || param.includes('release') ? 'ms' : param.includes('knee') ? 'dB' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Export Options */}
          <div className="bg-studio-panel-darker rounded-lg p-4">
            <h4 className="text-base font-semibold text-studio-text mb-3">Export Options</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-studio-text mb-1 block">Format</label>
                <select className="w-full px-3 py-2 bg-studio-panel border border-studio-border rounded text-sm">
                  <option>WAV 24-bit/96kHz</option>
                  <option>WAV 16-bit/44.1kHz</option>
                  <option>FLAC 24-bit/96kHz</option>
                  <option>MP3 320kbps</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-studio-text mb-1 block">Dither</label>
                <select className="w-full px-3 py-2 bg-studio-panel border border-studio-border rounded text-sm">
                  <option>None</option>
                  <option>TPDF</option>
                  <option>Noise Shaped</option>
                  <option>UV-22</option>
                </select>
              </div>
            </div>
            <button className="mt-3 w-full px-4 py-2 bg-studio-accent text-black rounded font-medium hover:bg-studio-accent/80">
              Export Mastered Audio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioMasteringSuite;