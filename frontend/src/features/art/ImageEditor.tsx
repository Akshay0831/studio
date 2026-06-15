import React, { useEffect, useRef } from 'react';
import { Canvas, PencilBrush, FabricImage } from 'fabric';
import { MousePointer2, Eraser, Brush, Square, Download, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudioStore } from '../../core/useStudioStore';
import { useImageEditor } from '../../hooks/useImageEditor';

const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { yImage } = useStudioStore();
  const { fabricRef, activeTool, setActiveTool, syncCanvasToYjs, undo, redo } = useImageEditor(yImage);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new Canvas(canvasRef.current, { width: 512, height: 512, backgroundColor: '#000' });
    fabricRef.current = canvas;
    const update = () => {
      const data = yImage.get('canvasData');
      if (data && data !== JSON.stringify(canvas.toJSON())) canvas.loadFromJSON(JSON.parse(data)).then(() => canvas.renderAll());
      const img = yImage.get('baseImageData');
      if (img) {
        FabricImage.fromURL(`data:image/png;base64,${img}`).then(loaded => {
          canvas.getObjects('image').forEach(o => canvas.remove(o));
          loaded.set({ selectable: false, evented: false });
          canvas.add(loaded);
          canvas.sendObjectToBack(loaded);
          canvas.renderAll();
        });
      }
    };
    yImage.observe(update);
    canvas.on('object:added', syncCanvasToYjs);
    canvas.on('object:modified', syncCanvasToYjs);
    canvas.on('object:removed', syncCanvasToYjs);
    canvas.on('path:created', syncCanvasToYjs);
    return () => { yImage.unobserve(update); canvas.dispose(); };
  }, [yImage, syncCanvasToYjs, fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = activeTool !== 'select';
    if (canvas.isDrawingMode) {
      const b = new PencilBrush(canvas);
      b.width = activeTool === 'brush' ? 5 : 20;
      b.color = activeTool === 'mask' ? 'rgba(255,0,0,0.5)' : activeTool === 'eraser' ? '#000' : '#fff';
      canvas.freeDrawingBrush = b;
    }
    canvas.renderAll();
  }, [activeTool, fabricRef]);

  const tools = [
    { id: 'select', icon: MousePointer2 },
    { id: 'brush', icon: Brush },
    { id: 'mask', icon: Square },
    { id: 'eraser', icon: Eraser },
  ];

  return (
    <div className="flex-1 flex flex-col bg-studio-bg overflow-hidden">
      <div className="h-10 border-b border-studio-border flex items-center px-2 bg-studio-panel gap-1">
        {tools.map(t => (
          <button key={t.id} onClick={() => setActiveTool(t.id)} className={`p-1.5 rounded ${activeTool === t.id ? 'bg-studio-accent text-white' : 'text-studio-text-dim'}`}>
            <t.icon size={16} />
          </button>
        ))}
        <div className="w-px h-4 bg-studio-border mx-1" />
        <button onClick={undo} className="p-1.5 text-studio-text-dim"><Undo2 size={16} /></button>
        <button onClick={redo} className="p-1.5 text-studio-text-dim"><Redo2 size={16} /></button>
        <button onClick={() => {
          const url = fabricRef.current?.toDataURL({ format: 'png', multiplier: 1 });
          if (url) { const a = document.createElement('a'); a.download = 'export.png'; a.href = url; a.click(); toast.success('Exported'); }
        }} className="p-1.5 text-studio-text-dim ml-auto"><Download size={16} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 bg-[#111]">
        <canvas ref={canvasRef} className="border border-studio-border shadow-2xl" />
      </div>
    </div>
  );
};

export default ImageEditor;
