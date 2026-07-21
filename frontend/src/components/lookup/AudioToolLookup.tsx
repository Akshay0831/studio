import React, { useState } from 'react';
import {
  Play, Pause, Square, Volume2, VolumeX, Sliders,
  Piano, Drum, Guitar, Headphones, AudioLines, AudioWaveform,
  Download, RotateCw, Minus, Radio, Equal, FileVolume, FileAudio, Save
} from 'lucide-react';
import ToolLookup from './ToolLookup';
import { MaterialButton } from '../common/MaterialButton';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  keywords: string[];
  popular?: boolean;
  subTools?: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<any>;
  }>;
}

// Audio tool definitions
const audioTools: Tool[] = [
  {
    id: 'playback',
    name: 'Playback Controls',
    description: 'Control audio playback and recording',
    category: 'Playback',
    icon: Play,
    keywords: ['play', 'pause', 'stop', 'record', 'transport'],
    popular: true,
    subTools: [
      { id: 'play', name: 'Play', icon: Play },
      { id: 'pause', name: 'Pause', icon: Pause },
      { id: 'stop', name: 'Stop', icon: Square },
      { id: 'record', name: 'Record', icon: FileAudio }
    ]
  },
  {
    id: 'mixer',
    name: 'Audio Mixer',
    description: 'Mix multiple audio tracks with volume and pan controls',
    category: 'Mixing',
    icon: Volume2,
    keywords: ['mix', 'balance', 'volume', 'pan', 'fader'],
    popular: true,
    subTools: [
      { id: 'volume', name: 'Volume Control', icon: Volume2 },
      { id: 'pan', name: 'Pan Control', icon: AudioWaveform },
      { id: 'eq', name: 'Equalizer', icon: Equal },
      { id: 'effects', name: 'Effects', icon: Sliders }
    ]
  },
  {
    id: 'instruments',
    name: 'Virtual Instruments',
    description: 'Play virtual instruments and sound generators',
    category: 'Instruments',
    icon: Piano,
    keywords: ['instrument', 'piano', 'drums', 'guitar', 'synth'],
    subTools: [
      { id: 'piano', name: 'Piano', icon: Piano },
      { id: 'drums', name: 'Drum Kit', icon: Drum },
      { id: 'guitar', name: 'Guitar', icon: Guitar },
      { id: 'synth', name: 'Synthesizer', icon: Headphones },
      { id: 'mic', name: 'Microphone', icon: Headphones }
    ]
  },
  {
    id: 'composition',
    name: 'Composition Tools',
    description: 'Create and arrange musical compositions',
    category: 'Composition',
    icon: AudioLines,
    keywords: ['compose', 'arrange', 'sequence', 'track'],
    popular: true,
    subTools: [
      { id: 'piano-roll', name: 'Piano Roll', icon: Piano },
      { id: 'drum-machine', name: 'Drum Machine', icon: Drum },
      { id: 'step-sequencer', name: 'Step Sequencer', icon: AudioWaveform },
      { id: 'timeline', name: 'Timeline', icon: AudioWaveform }
    ]
  },
  {
    id: 'effects',
    name: 'Audio Effects',
    description: 'Apply professional audio effects and processing',
    category: 'Effects',
    icon: Equal,
    keywords: ['effect', 'plugin', 'processor', 'filter'],
    subTools: [
      { id: 'reverb', name: 'Reverb', icon: Radio },
      { id: 'delay', name: 'Delay', icon: AudioWaveform },
      { id: 'compression', name: 'Compression', icon: Sliders },
      { id: 'distortion', name: 'Distortion', icon: FileVolume },
      { id: 'chorus', name: 'Chorus', icon: AudioLines },
      { id: 'flanger', name: 'Flanger', icon: AudioWaveform },
      { id: 'phaser', name: 'Phaser', icon: AudioWaveform }
    ]
  },
  {
    id: 'midi',
    name: 'MIDI Tools',
    description: 'Work with MIDI data and controllers',
    category: 'MIDI',
    icon: Piano,
    keywords: ['midi', 'controller', 'automation', 'control'],
    subTools: [
      { id: 'midi-input', name: 'MIDI Input', icon: Piano },
      { id: 'midi-output', name: 'MIDI Output', icon: Piano },
      { id: 'midi-learn', name: 'MIDI Learn', icon: Piano },
      { id: 'midi-map', name: 'MIDI Mapping', icon: Piano }
    ]
  },
  {
    id: 'audio-editing',
    name: 'Audio Editing',
    description: 'Edit and manipulate audio waveforms',
    category: 'Editing',
    icon: AudioWaveform,
    keywords: ['edit', 'cut', 'trim', 'crop', 'split'],
    subTools: [
      { id: 'cut', name: 'Cut', icon: Download },
      { id: 'trim', name: 'Trim', icon: Minus },
      { id: 'fade', name: 'Fade', icon: Sliders },
      { id: 'silence', name: 'Silence', icon: Square },
      { id: 'normalize', name: 'Normalize', icon: Sliders }
    ]
  },
  {
    id: 'mastering',
    name: 'Mastering Tools',
    description: 'Final mastering and polishing for audio output',
    category: 'Mastering',
    icon: FileVolume,
    keywords: ['master', 'final', 'export', 'render'],
    subTools: [
      { id: 'limiter', name: 'Limiter', icon: Sliders },
      { id: 'maximizer', name: 'Maximizer', icon: FileVolume },
      { id: 'stereo-enhancer', name: 'Stereo Enhancer', icon: AudioWaveform },
      { id: 'dither', name: 'Dither', icon: Sliders }
    ]
  },
  {
    id: 'batch-processing',
    name: 'Batch Processing',
    description: 'Process multiple audio files at once',
    category: 'Processing',
    icon: RotateCw,
    keywords: ['batch', 'bulk', 'multiple', 'automatic'],
    subTools: [
      { id: 'batch-convert', name: 'Batch Convert', icon: RotateCw },
      { id: 'batch-normalize', name: 'Batch Normalize', icon: Sliders },
      { id: 'batch-rename', name: 'Batch Rename', icon: Save },
      { id: 'batch-export', name: 'Batch Export', icon: Download }
    ]
  }
];

interface AudioToolLookupProps {
  activeTool?: string;
  onToolSelect: (toolId: string) => void;
  showCompact?: boolean;
}

const AudioToolLookup: React.FC<AudioToolLookupProps> = ({
  activeTool,
  onToolSelect,
  showCompact = false
}) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>(activeTool || '');

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    onToolSelect(toolId);
    setExpandedTool(null);
  };

  const handleToolClick = (tool: any) => {
    if (tool.subTools && tool.subTools.length > 0) {
      setExpandedTool(expandedTool === tool.id ? null : tool.id);
    } else {
      handleToolSelect(tool.id);
    }
  };

  // Get current track state
  const getTrackState = (_trackId: number) => {
    // For now, return default state
    return {
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false
    };
  };

  return (
    <div className="space-y-2">
      <ToolLookup
        tools={audioTools}
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        placeholder="Select an audio tool..."
        showPopular={false}
        showCategories={false}
        compact={showCompact}
      />

      {/* Quick Access Toolbar */}
      {!showCompact && (
        <div className="mt-4 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-text-dim mb-2 uppercase tracking-wider">Quick Access</div>
          <div className="flex flex-wrap gap-1">
            {audioTools.filter(tool => tool.popular).map(tool => (
              <MaterialButton
                key={tool.id}
                variant={selectedTool === tool.id ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleToolClick(tool)}
                className="text-xs"
              >
                <tool.icon size={14} />
                <span className="ml-1">{tool.name}</span>
              </MaterialButton>
            ))}
          </div>
        </div>
      )}

      {/* Track Mixer */}
      {!showCompact && selectedTool === 'mixer' && (
        <div className="mt-2 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-accent mb-2 uppercase tracking-wider">
            Track Mixer
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(trackId => {
              const trackState = getTrackState(trackId);
              return (
                <div key={trackId} className="flex items-center gap-2">
                  <span className="text-xs w-8">Track {trackId}</span>
                  <div className="flex items-center gap-1">
                    <MaterialButton variant="ghost" size="icon" className="p-0.5">
                      <VolumeX size={12} />
                    </MaterialButton>
                    <div className="flex-1 bg-studio-bg h-4 rounded">
                      <div 
                        className="bg-studio-accent h-full rounded"
                        style={{ width: `${trackState.volume * 100}%` }}
                      />
                    </div>
                    <MaterialButton variant="ghost" size="icon" className="p-0.5">
                      <Sliders size={12} />
                    </MaterialButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtools */}
      {!showCompact && expandedTool && (
        <div className="mt-2 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-accent mb-2 uppercase tracking-wider">
            Sub-Tools
          </div>
          <div className="flex flex-wrap gap-1">
            {(() => {
              const parentTool = audioTools.find(t => t.id === expandedTool);
              if (!parentTool?.subTools) return null;
              
              return parentTool.subTools.map(subTool => (
                <MaterialButton
                  key={subTool.id}
                  variant={selectedTool === subTool.id ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => handleToolSelect(subTool.id)}
                  className="text-xs"
                >
                  <subTool.icon size={14} />
                  <span className="ml-1">{subTool.name}</span>
                </MaterialButton>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioToolLookup;