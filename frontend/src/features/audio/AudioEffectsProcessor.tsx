import React, { useState, useEffect, useRef } from 'react';
import { 
  Sliders, 
  Activity, 
  Volume2, 
  RotateCcw, 
  Download,
  Upload,
  Settings2,
  Zap,
  Droplets,
  BarChart3
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';
import { useAudioComposition } from '../../hooks/useAudioComposition';

interface AudioEffect {
  id: string;
  name: string;
  type: 'eq' | 'compressor' | 'reverb' | 'delay' | 'gate' | 'distortion' | 'chorus' | 'flanger' | 'phaser';
  enabled: boolean;
  parameters: Record<string, number>;
  color: string;
}

interface EQBand {
  frequency: number;
  gain: number;
  q: number;
}

const AudioEffectsProcessor: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { compose } = useAudioComposition();
  
  const [effects, setEffects] = useState<AudioEffect[]>([
    {
      id: 'eq',
      name: 'Multi-band EQ',
      type: 'eq',
      enabled: true,
      parameters: {
        lowGain: 0,
        midGain: 0,
        highGain: 0,
        lowFreq: 250,
        midFreq: 2000,
        highFreq: 8000,
        q: 1.0
      },
      color: '#3B82F6'
    },
    {
      id: 'compressor',
      name: 'Compressor',
      type: 'compressor',
      enabled: true,
      parameters: {
        threshold: -20,
        ratio: 4,
        attack: 10,
        release: 100,
        knee: 3,
        makeup: 6
      },
      color: '#10B981'
    },
    {
      id: 'reverb',
      name: 'Reverb',
      type: 'reverb',
      enabled: false,
      parameters: {
        roomSize: 0.7,
        wet: 0.3,
        dry: 0.7,
        decay: 2.0,
        damping: 0.5
      },
      color: '#8B5CF6'
    },
    {
      id: 'delay',
      name: 'Delay',
      type: 'delay',
      enabled: false,
      parameters: {
        time: 0.3,
        feedback: 0.3,
        mix: 0.3,
        cutoff: 8000
      },
      color: '#F59E0B'
    }
  ]);

  const [selectedEffect, setSelectedEffect] = useState<string>('eq');
  const [eqBands, setEqBands] = useState<EQBand[]>([
    { frequency: 60, gain: 0, q: 1.0 },
    { frequency: 250, gain: 0, q: 1.0 },
    { frequency: 500, gain: 0, q: 1.0 },
    { frequency: 1000, gain: 0, q: 1.0 },
    { frequency: 2000, gain: 0, q: 1.0 },
    { frequency: 4000, gain: 0, q: 1.0 },
    { frequency: 8000, gain: 0, q: 1.0 },
    { frequency: 16000, gain: 0, q: 1.0 }
  ]);

  const [analysisData, setAnalysisData] = useState<{
    rms: number;
    peak: number;
    spectrum: number[];
    dynamicRange: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simulate audio analysis
  useEffect(() => {
    const interval = setInterval(() => {
      const spectrum = Array.from({ length: 32 }, () => Math.random() * 100);
      const rms = Math.random() * 50;
      const peak = Math.random() * 100;
      const dynamicRange = 20 + Math.random() * 40;
      
      setAnalysisData({
        rms,
        peak,
        spectrum,
        dynamicRange
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const toggleEffect = (effectId: string) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? { ...effect, enabled: !effect.enabled }
        : effect
    ));
  };

  const updateEffectParameter = (effectId: string, parameter: string, value: number) => {
    setEffects(prev => prev.map(effect => 
      effect.id === effectId
        ? {
            ...effect,
            parameters: {
              ...effect.parameters,
              [parameter]: value
            }
          }
        : effect
    ));
  };

  const updateEQBand = (index: number, gain: number, q: number) => {
    setEqBands(prev => prev.map((band, i) => 
      i === index ? { ...band, gain, q } : band
    ));
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'vocal':
        setEqBands(prev => prev.map((band, i) => {
          if (i === 3) return { ...band, gain: 6 }; // Boost mid frequencies
          if (i === 0) return { ...band, gain: -3 }; // Cut low frequencies
          return band;
        }));
        break;
      case 'bass':
        setEqBands(prev => prev.map((band, i) => {
          if (i === 0) return { ...band, gain: 4 }; // Boost low frequencies
          if (i === 1) return { ...band, gain: 2 }; // Boost low-mid
          return band;
        }));
        break;
      case 'mastering':
        setEqBands(prev => prev.map(band => ({ ...band, q: 0.5 })));
        break;
    }
  };

  const renderEQ = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= eqBands.length; i++) {
      const x = (width / eqBands.length) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw EQ curve
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    eqBands.forEach((band, i) => {
      const x = (width / eqBands.length) * i + (width / eqBands.length) / 2;
      const y = height / 2 - (band.gain * height / 40);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw frequency labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    
    eqBands.forEach((band, i) => {
      const x = (width / eqBands.length) * i + (width / eqBands.length) / 2;
      const freq = band.frequency;
      ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, x, height - 5);
    });
  };

  useEffect(() => {
    renderEQ();
  }, [eqBands]);

  const renderCompressor = () => {
    const effect = effects.find(e => e.id === 'compressor');
    if (!effect) return null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(effect.parameters).map(([param, value]) => (
            <div key={param}>
              <label className="text-sm text-studio-text mb-1 block capitalize">
                {param.replace(/([A-Z])/g, ' $1')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={param === 'threshold' ? '-60' : param === 'ratio' ? '1' : '0'}
                  max={param === 'threshold' ? '0' : param === 'ratio' ? '20' : param === 'attack' || param === 'release' ? '1000' : '10'}
                  step={param === 'threshold' || param === 'ratio' ? '1' : '0.1'}
                  value={value}
                  onChange={(e) => updateEffectParameter('compressor', param, parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-studio-text w-12 text-right">
                  {value}{param === 'ratio' ? '' : param === 'threshold' || param === 'makeup' ? 'dB' : param === 'attack' || param === 'release' ? 'ms' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpectrum = () => {
    if (!analysisData) return null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw spectrum bars
    const barWidth = width / analysisData.spectrum.length;
    
    analysisData.spectrum.forEach((value, i) => {
      const barHeight = (value / 100) * height;
      const x = i * barWidth;
      const y = height - barHeight;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#1E40AF');

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw RMS line
    const rmsY = height - (analysisData.rms / 100) * height;
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, rmsY);
    ctx.lineTo(width, rmsY);
    ctx.stroke();
  };

  useEffect(() => {
    renderSpectrum();
  }, [analysisData]);

  const selectedEffectData = effects.find(e => e.id === selectedEffect);

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <h2 className="text-lg font-semibold text-studio-text">Audio Effects Processor</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-studio-hover rounded text-sm text-studio-text">
            Save Preset
          </button>
          <button className="px-3 py-1 bg-studio-accent text-black rounded text-sm">
            Apply All
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Effects List */}
        <div className="w-64 border-r border-studio-border bg-studio-panel-darker">
          <div className="p-3 border-b border-studio-border">
            <h3 className="text-sm font-medium text-studio-text">Effects Chain</h3>
          </div>
          <div className="p-2">
            {effects.map(effect => (
              <div
                key={effect.id}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  selectedEffect === effect.id 
                    ? 'bg-studio-accent text-black' 
                    : 'hover:bg-studio-hover'
                }`}
                onClick={() => setSelectedEffect(effect.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: effect.color }}
                    />
                    <span className="text-sm font-medium">{effect.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEffect(effect.id);
                    }}
                    className={`w-5 h-5 rounded border text-xs ${
                      effect.enabled 
                        ? 'bg-studio-accent text-black border-studio-accent' 
                        : 'border-studio-border text-studio-text'
                    }`}
                  >
                    {effect.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Effect Controls */}
        <div className="flex-1 p-4">
          {selectedEffectData?.type === 'eq' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-studio-text">Multi-band EQ</h3>
                <div className="flex gap-2">
                  <select
                    className="px-2 py-1 bg-studio-panel border border-studio-border rounded text-sm"
                    onChange={(e) => applyPreset(e.target.value)}
                  >
                    <option>Custom</option>
                    <option>Vocal</option>
                    <option>Bass</option>
                    <option>Mastering</option>
                  </select>
                  <button 
                    onClick={() => setEqBands(eqBands.map(band => ({ ...band, gain: 0, q: 1.0 })))}
                    className="px-2 py-1 bg-studio-hover rounded text-sm text-studio-text"
                  >
                    Reset
                  </button>
                </div>
              </div>
              
              <div className="bg-studio-panel-darker rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full h-48 border border-studio-border rounded"
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                {eqBands.map((band, i) => (
                  <div key={i} className="bg-studio-panel rounded-lg p-3">
                    <div className="text-sm text-studio-text mb-2">
                      {band.frequency >= 1000 ? `${band.frequency/1000}k` : `${band.frequency}`}Hz
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-studio-text-dim">Gain</label>
                        <input
                          type="range"
                          min="-20"
                          max="20"
                          value={band.gain}
                          onChange={(e) => updateEQBand(i, parseFloat(e.target.value), band.q)}
                          className="w-full"
                        />
                        <span className="text-xs text-studio-text">{band.gain}dB</span>
                      </div>
                      <div>
                        <label className="text-xs text-studio-text-dim">Q</label>
                        <input
                          type="range"
                          min="0.1"
                          max="10"
                          step="0.1"
                          value={band.q}
                          onChange={(e) => updateEQBand(i, band.gain, parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <span className="text-xs text-studio-text">{band.q}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEffectData?.type === 'compressor' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-studio-text">Compressor / Limiter</h3>
              <div className="bg-studio-panel-darker rounded-lg p-4">
                {renderCompressor()}
              </div>
            </div>
          )}

          {selectedEffectData?.type === 'reverb' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-studio-text">Reverb & Delay</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(selectedEffectData.parameters).map(([param, value]) => (
                  <div key={param}>
                    <label className="text-sm text-studio-text mb-1 block capitalize">
                      {param.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={param === 'roomSize' || param === 'wet' || param === 'dry' ? '0' : '0.1'}
                        max={param === 'roomSize' ? '1' : param === 'wet' || param === 'dry' ? '1' : '5'}
                        step="0.1"
                        value={value}
                        onChange={(e) => updateEffectParameter('reverb', param, parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm text-studio-text w-12 text-right">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisData && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-studio-text mb-3">Audio Analysis</h3>
              <div className="bg-studio-panel-darker rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  className="w-full h-32 border border-studio-border rounded"
                />
                <div className="flex justify-between mt-4 text-sm text-studio-text">
                  <div>RMS: {analysisData.rms.toFixed(1)}dB</div>
                  <div>Peak: {analysisData.peak.toFixed(1)}dB</div>
                  <div>Dynamic Range: {analysisData.dynamicRange.toFixed(1)}dB</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioEffectsProcessor;