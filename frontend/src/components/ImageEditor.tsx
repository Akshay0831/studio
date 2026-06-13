import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { 
  Square, 
  MousePointer2, 
  Eraser, 
  Brush, 
  RotateCcw, 
  RotateCw,
  Maximize,
  Layers
} from 'lucide-react';

const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState('select');

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 512,
      height: 512,
      backgroundColor: '#000000',
    });

    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'brush', icon: Brush, label: 'Brush' },
    { id: 'mask', icon: Square, label: 'Mask' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-studio-bg border-r border-studio-border overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-2 bg-studio-panel justify-between">
        <div className="flex items-center gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-1.5 rounded transition-colors ${
                activeTool === tool.id 
                  ? 'bg-studio-accent text-white' 
                  : 'text-studio-text-dim hover:bg-studio-border hover:text-studio-text'
              }`}
              title={tool.label}
            >
              <tool.icon size={16} />
            </button>
          ))}
          <div className="w-[1px] h-4 bg-studio-border mx-1" />
          <button className="p-1.5 text-studio-text-dim hover:text-studio-text rounded hover:bg-studio-border">
            <RotateCcw size={16} />
          </button>
          <button className="p-1.5 text-studio-text-dim hover:text-studio-text rounded hover:bg-studio-border">
            <RotateCw size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <div className="flex items-center text-[10px] text-studio-text-dim bg-black/30 px-2 py-0.5 rounded border border-studio-border">
            <Maximize size={10} className="mr-1" />
            <span>512 x 512</span>
          </div>
          <button className="flex items-center gap-1 text-[10px] bg-studio-border hover:bg-studio-border/80 px-2 py-0.5 rounded transition-colors">
            <Layers size={10} />
            <span>Layers</span>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 flex items-center justify-center p-8 bg-[#151515] overflow-auto">
        <div className="relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-studio-border bg-black">
          <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
