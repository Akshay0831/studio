import React, { useState } from 'react';
import { useStudioStore } from '../../core/useStudioStore';

const PianoRoll: React.FC = () => {
  const { yAudio } = useStudioStore();
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

  const notes = ['C4', 'B3', 'A#3', 'A3', 'G#3', 'G3', 'F#3', 'F3', 'E3', 'D#3', 'D3', 'C#3', 'C3'];
  const steps = 32;

  const isBlackKey = (note: string) => note.includes('#');

  return (
    <div className="flex flex-col h-full bg-[#050505] rounded-xl border border-studio-border overflow-hidden shadow-inner">
      <div className="flex-1 overflow-auto custom-scrollbar select-none">
        <div className="min-w-max relative">
          {/* Step markers background */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-16" />
            {[...Array(steps)].map((_, i) => (
              <div 
                key={i} 
                className={`w-10 border-r border-white/${i % 4 === 3 ? '10' : '5'} ${i % 16 >= 8 ? 'bg-white/[0.02]' : ''}`} 
              />
            ))}
          </div>

          {notes.map((note) => (
            <div 
              key={note} 
              className={`flex h-7 border-b border-white/5 group relative ${isBlackKey(note) ? 'bg-black/40' : 'bg-white/[0.01]'}`}
              onMouseEnter={() => setHoveredNote(note)}
              onMouseLeave={() => setHoveredNote(null)}
            >
              <div className={`w-16 border-r border-studio-border flex items-center justify-between px-2 text-[9px] font-black sticky left-0 z-20 transition-colors ${isBlackKey(note) ? 'bg-[#111] text-studio-text-dim' : 'bg-[#222] text-studio-text'} ${hoveredNote === note ? 'bg-studio-accent text-white' : ''}`}>
                <span>{note}</span>
                <div className={`w-3 h-2 rounded-sm ${isBlackKey(note) ? 'bg-black border border-white/10' : 'bg-white shadow-sm'}`} />
              </div>
              <div className="flex relative z-10">
                {[...Array(steps)].map((_, i) => {
                  const isActive = yAudio?.get(`note_${note}_${i}`) || false;
                  return (
                    <button 
                      key={i} 
                      onClick={() => {
                        const current = yAudio?.get(`note_${note}_${i}`) || false;
                        yAudio?.set(`note_${note}_${i}`, !current);
                      }}
                      className={`w-10 border-r border-white/5 transition-all duration-75 relative group/cell
                        ${isActive ? 'bg-studio-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] z-20 scale-[0.98] rounded-sm' : 'hover:bg-white/10'}
                      `}
                    >
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/30 rounded-full mx-1 mb-0.5" />
                      )}
                      {!isActive && (
                        <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 bg-studio-accent/20 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="h-6 bg-studio-panel border-t border-studio-border flex items-center px-2 justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-studio-accent" />
            <span className="text-[8px] font-bold text-studio-text-dim uppercase">Active Notes</span>
          </div>
          <div className="text-[8px] font-mono text-studio-text-dim">STEPS: {steps} | QUANTIZE: 1/16</div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 4].map(v => (
            <button key={v} className="px-2 py-0.5 rounded bg-black/40 border border-studio-border text-[8px] text-studio-text-dim hover:text-white transition-colors uppercase font-bold">{v} BAR</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
