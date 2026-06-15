import React from 'react';
import { Music } from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

export const AudioControls: React.FC = () => {
  const { yAudio } = useStudioStore();
  const [effects, setEffects] = React.useState<Record<string, boolean>>({ eq: true, reverb: false, delay: false, compression: true });
  React.useEffect(() => {
    if (!yAudio) return;
    const update = () => { const e = yAudio.get('effects'); if (e) setEffects(e); };
    yAudio.observe(update);
    return () => yAudio.unobserve(update);
  }, [yAudio]);
  const toggle = (key: string) => {
    const next = { ...effects, [key]: !effects[key] };
    setEffects(next);
    yAudio?.set('effects', next);
  };
  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">FX Chain</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(effects).map(([key, on]) => (
            <button key={key} onClick={() => toggle(key)} className={`p-2 rounded border text-[9px] font-bold uppercase transition-all ${on ? 'bg-studio-accent/20 border-studio-accent text-studio-accent' : 'bg-black/20 border-studio-border text-studio-text-dim'}`}>
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">Engine Settings</label>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-studio-text-dim">SYNC BPM</span>
            <input type="checkbox" className="accent-studio-accent" defaultChecked />
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-studio-text-dim">LIMITER</span>
            <input type="checkbox" className="accent-studio-accent" defaultChecked />
          </div>
        </div>
      </div>
      <button className="w-full py-2 rounded bg-studio-accent text-white font-bold text-[10px] hover:bg-studio-accent/80 transition-all flex items-center justify-center gap-2">
        <Music size={14} />
        <span>ANALYZE</span>
      </button>
    </div>
  );
};
