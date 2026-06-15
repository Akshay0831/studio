import React from 'react';
import { useStudioStore } from '../../core/useStudioStore';

const PianoRoll: React.FC = () => {
  const { featureMaps } = useStudioStore();
  const yAudio = featureMaps['audio'];

  const notes = ['C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3'];
  const steps = 16;

  return (
    <div className="flex flex-col h-full bg-black/20 rounded border border-studio-border overflow-hidden">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="min-w-max">
          {notes.map((note) => (
            <div key={note} className="flex h-6 border-b border-studio-border/30">
              <div className="w-12 bg-studio-panel border-r border-studio-border flex items-center justify-center text-[8px] font-bold text-studio-text-dim sticky left-0 z-10">{note}</div>
              <div className="flex">
                {[...Array(steps)].map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      const current = yAudio?.get(`note_${note}_${i}`) || false;
                      yAudio?.set(`note_${note}_${i}`, !current);
                    }}
                    className={`w-8 border-r border-studio-border/20 transition-colors ${i % 4 === 0 ? 'bg-white/5' : ''} hover:bg-studio-accent/20`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
