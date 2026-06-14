import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
  Square, 
  MousePointer2, 
  Eraser, 
  Brush, 
  RotateCcw, 
  RotateCw,
  Maximize,
  Layers,
  Undo2,
  Redo2
} from 'lucide-react';
import { useStudioStore } from '../../core/useStudioStore';

const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState('select');
  const { yImage } = useStudioStore();

  const syncCanvasToYjs = useCallback(() => {
    if (!fabricRef.current) return;
    const canvasJson = fabricRef.current.toJSON();
    yImage.set('canvasData', JSON.stringify(canvasJson));
  }, [yImage]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 512,
      height: 512,
      backgroundColor: '#000000',
    });

    fabricRef.current = canvas;

    // Handle incoming Yjs updates
    const handleYjsUpdate = () => {
      const receivedCanvasData = yImage.get('canvasData') as string;
      if (receivedCanvasData && receivedCanvasData !== JSON.stringify(canvas.toJSON())) {
        canvas.loadFromJSON(JSON.parse(receivedCanvasData), () => {
          canvas.renderAll();
        });
      }

      // Handle base image update
      const base64ImageData = yImage.get('baseImageData') as string;
      if (base64ImageData) {
        fabric.Image.fromURL(`data:image/png;base64,${base64ImageData}`, (loadedImage) => {
          // Clear previous base image if any
          const previousImages = canvas.getObjects('image');
          previousImages.forEach(imageObject => canvas.remove(imageObject));
          
          loadedImage.set({
            selectable: false,
            evented: false,
          });
          canvas.add(loadedImage);
          canvas.sendToBack(loadedImage);
          canvas.renderAll();
        });
      }
    };

    yImage.observe(handleYjsUpdate);

    // Sync to Yjs on changes
    canvas.on('object:added', syncCanvasToYjs);
    canvas.on('object:modified', syncCanvasToYjs);
    canvas.on('object:removed', syncCanvasToYjs);
    canvas.on('path:created', syncCanvasToYjs);

    return () => {
      yImage.unobserve(handleYjsUpdate);
      canvas.dispose();
    };
  }, [yImage, syncCanvasToYjs]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = activeTool === 'select';

    if (activeTool === 'brush' || activeTool === 'mask') {
      canvas.isDrawingMode = true;
      const brush = new fabric.PencilBrush(canvas);
      brush.width = activeTool === 'mask' ? 20 : 5;
      brush.color = activeTool === 'mask' ? 'rgba(255, 0, 0, 0.5)' : '#ffffff';
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === 'eraser') {
      canvas.isDrawingMode = true;
      // Eraser brush implementation (using destination-out or specialized brush)
      const eraser = new fabric.PencilBrush(canvas);
      eraser.width = 20;
      eraser.color = '#000000'; // Simple eraser for black background
      canvas.freeDrawingBrush = eraser;
    }

    canvas.renderAll();
  }, [activeTool]);

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
          <button 
            onClick={() => (fabricRef.current as any)?.undo?.()}
            className="p-1.5 text-studio-text-dim hover:text-studio-text rounded hover:bg-studio-border"
          >
            <Undo2 size={16} />
          </button>
          <button 
            onClick={() => (fabricRef.current as any)?.redo?.()}
            className="p-1.5 text-studio-text-dim hover:text-studio-text rounded hover:bg-studio-border"
          >
            <Redo2 size={16} />
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
