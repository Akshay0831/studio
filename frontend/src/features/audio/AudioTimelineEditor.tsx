import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Scissors, 
  Copy, 
  RotateCcw, 
  Clock,
  Volume2,
  Settings2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';
import { useAudioComposition } from '../../hooks/useAudioComposition';
import { useAudioPlayback } from '../../hooks/useAudioPlayback';

interface AudioClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  track: number;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  color: string;
}

interface AudioTrack {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: number;
  soloed: boolean;
  clips: AudioClip[];
}

const AudioTimelineEditor: React.FC = () => {
  const { yAudio } = useStudioStore();
  const { isComposing, composingLayerIndex, compose } = useAudioComposition();
  const { togglePlay, stop, isPlaying } = useAudioPlayback();
  
  const [tracks, setTracks] = useState<AudioTrack[]>([
    {
      id: 'track1',
      name: 'Main',
      volume: 0.8,
      pan: 0,
      muted: 0,
      soloed: false,
      clips: []
    },
    {
      id: 'track2',
      name: 'Instruments',
      volume: 0.7,
      pan: 0,
      muted: 0,
      soloed: false,
      clips: []
    },
    {
      id: 'track3',
      name: 'Effects',
      volume: 0.6,
      pan: 0,
      muted: 0,
      soloed: false,
      clips: []
    },
    {
      id: 'track4',
      name: 'Ambient',
      volume: 0.5,
      pan: 0,
      muted: 0,
      soloed: false,
      clips: []
    }
  ]);

  const [timelinePosition, setTimelinePosition] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);

  // Timeline playback
  useEffect(() => {
    let animationFrame: number;
    let lastTime = 0;
    
    const updateTimeline = (currentTime: number) => {
      if (isPlayingTimeline) {
        const deltaTime = currentTime - lastTime;
        setTimelinePosition(prev => prev + deltaTime * 0.001 * zoomLevel);
        lastTime = currentTime;
        animationFrame = requestAnimationFrame(updateTimeline);
      }
    };

    if (isPlayingTimeline) {
      animationFrame = requestAnimationFrame(updateTimeline);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlayingTimeline, zoomLevel]);

  const handlePlay = () => {
    setIsPlayingTimeline(!isPlayingTimeline);
  };

  const handleStop = () => {
    setIsPlayingTimeline(false);
    setTimelinePosition(0);
  };

  const handleAddClip = (trackId: string) => {
    const newClip: AudioClip = {
      id: `clip_${Date.now()}`,
      name: `Clip ${tracks.find(t => t.id === trackId)?.clips.length ? tracks.find(t => t.id === trackId)!.clips.length + 1 : 1}`,
      startTime: tracks.find(t => t.id === trackId)?.clips.reduce((max, clip) => Math.max(max, clip.startTime + clip.duration), 0) || 0,
      duration: 4,
      track: tracks.findIndex(t => t.id === trackId),
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };

    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, clips: [...track.clips, newClip] }
        : track
    ));
  };

  const handleCutClip = (clipId: string) => {
    setTracks(prev => prev.map(track => {
      const clipIndex = track.clips.findIndex(clip => clip.id === clipId);
      if (clipIndex === -1) return track;
      
      const clip = track.clips[clipIndex];
      const firstHalf = { ...clip, duration: clip.duration / 2 };
      const secondHalf = { 
        ...clip, 
        id: `${clip.id}_2`,
        startTime: clip.startTime + clip.duration / 2,
        duration: clip.duration / 2
      };
      
      return {
        ...track,
        clips: [
          ...track.clips.slice(0, clipIndex),
          firstHalf,
          secondHalf,
          ...track.clips.slice(clipIndex + 1)
        ]
      };
    }));
  };

  const handleDuplicateClip = (clipId: string) => {
    setTracks(prev => prev.map(track => {
      const clipIndex = track.clips.findIndex(clip => clip.id === clipId);
      if (clipIndex === -1) return track;
      
      const clip = track.clips[clipIndex];
      const duplicatedClip = { 
        ...clip, 
        id: `${clip.id}_copy_${Date.now()}`,
        startTime: clip.startTime + clip.duration + 1
      };
      
      return {
        ...track,
        clips: [
          ...track.clips,
          duplicatedClip
        ]
      };
    }));
  };

  const renderTimeRuler = () => {
    const pixelsPerSecond = 100 * zoomLevel;
    const totalDuration = 32; // 32 seconds timeline
    const width = totalDuration * pixelsPerSecond;
    
    return (
      <div className="h-8 border-b border-studio-border bg-studio-panel-darker relative">
        <div className="absolute inset-0 flex" style={{ width }}>
          {[...Array(totalDuration)].map((_, i) => (
            <div 
              key={i}
              className="h-full border-r border-studio-border/30 flex items-end justify-center text-[10px] text-studio-text-dim"
              style={{ width: pixelsPerSecond }}
            >
              <span className="mb-1">{i}s</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTracks = () => {
    const pixelsPerSecond = 100 * zoomLevel;
    const totalDuration = 32;
    const width = totalDuration * pixelsPerSecond;
    
    return tracks.map((track, trackIndex) => (
      <div key={track.id} className="flex border-b border-studio-border">
        {/* Track Header */}
        <div className="w-48 bg-studio-panel-darker border-r border-studio-border p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-studio-text truncate">
              {track.name}
            </span>
            <div className="flex gap-1">
              <button className="p-1 hover:bg-studio-hover rounded">
                <Volume2 className="w-4 h-4 text-studio-text" />
              </button>
              <button className="p-1 hover:bg-studio-hover rounded">
                <Layers className="w-4 h-4 text-studio-text" />
              </button>
            </div>
          </div>
          <div className="text-[10px] text-studio-text-dim">
            {track.clips.length} clips
          </div>
        </div>
        
        {/* Track Content */}
        <div className="flex-1 relative" style={{ width }}>
          {track.clips.map(clip => (
            <div
              key={clip.id}
              className={`absolute h-12 rounded cursor-pointer border-2 ${
                selectedClip === clip.id 
                  ? 'border-studio-accent' 
                  : 'border-studio-border'
              } transition-all`}
              style={{
                left: clip.startTime * pixelsPerSecond,
                width: clip.duration * pixelsPerSecond,
                backgroundColor: clip.color,
                opacity: clip.muted ? 0.5 : 1,
              }}
              onClick={() => setSelectedClip(clip.id)}
              onDoubleClick={() => handleCutClip(clip.id)}
            >
              <div className="h-full flex items-center justify-between px-2">
                <span className="text-xs text-white/90 font-medium truncate">
                  {clip.name}
                </span>
                <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                  <button 
                    className="p-0.5 hover:bg-black/50 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCutClip(clip.id);
                    }}
                  >
                    <Scissors className="w-3 h-3 text-white/70" />
                  </button>
                  <button 
                    className="p-0.5 hover:bg-black/50 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateClip(clip.id);
                    }}
                  >
                    <Copy className="w-3 h-3 text-white/70" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Clip Button */}
          <button
            className="absolute top-1 right-1 px-2 py-1 text-xs bg-studio-accent text-black rounded hover:bg-studio-accent/80 transition-colors"
            onClick={() => handleAddClip(track.id)}
          >
            Add Clip
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-studio-panel">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-studio-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              className="p-2 bg-studio-accent text-black rounded-lg hover:bg-studio-accent/80 transition-colors"
            >
              {isPlayingTimeline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleStop}
              className="p-2 bg-studio-hover rounded-lg hover:bg-studio-hover/80 transition-colors"
            >
              <Square className="w-4 h-4 text-studio-text" />
            </button>
            <div className="text-sm text-studio-text">
              {Math.floor(timelinePosition)}s / 32s
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}
              className="p-1 bg-studio-hover rounded hover:bg-studio-hover/80 transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-studio-text" />
            </button>
            <span className="text-sm text-studio-text">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.25))}
              className="p-1 bg-studio-hover rounded hover:bg-studio-hover/80 transition-colors"
            >
              <ChevronUp className="w-4 h-4 text-studio-text" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-studio-text">BPM:</label>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-16 px-2 py-1 bg-studio-panel border border-studio-border rounded text-sm text-studio-text"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-studio-text">Time:</label>
            <select
              value={`${timeSignature.numerator}/${timeSignature.denominator}`}
              onChange={(e) => {
                const [num, den] = e.target.value.split('/').map(Number);
                setTimeSignature({ numerator: num, denominator: den });
              }}
              className="px-2 py-1 bg-studio-panel border border-studio-border rounded text-sm text-studio-text"
            >
              <option>4/4</option>
              <option>3/4</option>
              <option>6/8</option>
              <option>7/8</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Time Ruler */}
      {renderTimeRuler()}
      
      {/* Tracks */}
      <div className="flex-1 overflow-auto">
        {renderTracks()}
      </div>
    </div>
  );
};

export default AudioTimelineEditor;