import React, { useEffect, useState } from 'react';
import * as Y from 'yjs';

interface StudioControlProps {
  label: string;
  yMap?: Y.Map<any>;
  stateKey: string;
  className?: string;
}

export const StudioToggle: React.FC<StudioControlProps> = ({ label, yMap, stateKey, className }) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!yMap || typeof yMap.observe !== 'function') return;
    
    const update = () => {
      try {
        const val = yMap.get(stateKey);
        if (typeof val === 'boolean') setEnabled(val);
      } catch (error) {
        console.warn(`Error updating StudioToggle for ${stateKey}:`, error);
      }
    };
    
    try {
      yMap.observe(update);
      update();
    } catch (error) {
      console.warn(`Error setting up StudioToggle observer for ${stateKey}:`, error);
    }
    
    return () => {
      try {
        yMap.unobserve(update);
      } catch (error) {
        console.warn(`Error unobserving StudioToggle for ${stateKey}:`, error);
      }
    };
  }, [yMap, stateKey]);

  const toggle = () => {
    yMap?.set(stateKey, !enabled);
  };

  return (
    <div className={`flex items-center justify-between p-2 rounded border transition-all ${enabled ? 'bg-studio-accent/10 border-studio-accent/30' : 'bg-black/10 border-studio-border/30'} ${className}`}>
      <span className={`text-[10px] font-bold uppercase ${enabled ? 'text-studio-text' : 'text-studio-text-dim'}`}>{label}</span>
      <button 
        onClick={toggle}
        className={`w-8 h-4 rounded-full relative transition-all ${enabled ? 'bg-studio-accent' : 'bg-studio-border'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-4.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
};

interface SliderProps extends StudioControlProps {
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export const StudioSlider: React.FC<SliderProps> = ({ label, yMap, stateKey, min, max, step = 1, unit = '', className }) => {
  const [value, setValue] = useState(min);

  useEffect(() => {
    if (!yMap) return;
    const update = () => {
      const val = yMap.get(stateKey);
      if (typeof val === 'number') setValue(val);
    };
    yMap.observe(update);
    update();
    return () => yMap.unobserve(update);
  }, [yMap, stateKey]);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-bold text-studio-text-dim uppercase">{label}</label>
        <span className="text-[9px] font-mono text-studio-accent">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => yMap?.set(stateKey, parseFloat(e.target.value))}
        className="w-full accent-studio-accent"
      />
    </div>
  );
};

interface SelectProps extends StudioControlProps {
  options: { id: string; name: string; description?: string }[];
}

export const StudioSelect: React.FC<SelectProps> = ({ label, yMap, stateKey, options, className }) => {
  const [selected, setSelected] = useState(options[0]?.id);

  useEffect(() => {
    if (!yMap) return;
    const update = () => {
      const val = yMap.get(stateKey);
      if (typeof val === 'string') setSelected(val);
    };
    yMap.observe(update);
    update();
    return () => yMap.unobserve(update);
  }, [yMap, stateKey, options]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-[10px] font-bold text-studio-text-dim uppercase tracking-wider">{label}</label>
      <div className="flex flex-col gap-1">
        {options.map(opt => (
          <button 
            key={opt.id}
            onClick={() => yMap?.set(stateKey, opt.id)}
            className={`text-left px-3 py-2 rounded border transition-all ${selected === opt.id ? 'bg-studio-accent/20 border-studio-accent border-l-4' : 'bg-black/20 border-studio-border border-l-transparent hover:border-studio-border-bright'}`}
          >
            <div className="text-[11px] font-bold">{opt.name}</div>
            {opt.description && <div className="text-[9px] text-studio-text-dim">{opt.description}</div>}
          </button>
        ))}
      </div>
    </div>
  );
};
