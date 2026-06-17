import React, { useEffect, useRef, useState } from 'react';
import { Canvas, PencilBrush, FabricImage } from 'fabric';
import { MousePointer2, Eraser, Brush, Square, Download, Undo2, Redo2, Layers, Eye, EyeOff, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudioStore } from '../../core/useStudioStore';
import { useWorktree } from '../../core/useWorktree';
import { useImageEditor } from '../../hooks/useImageEditor';

const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { yImage, yExperimental } = useStudioStore();
  const { isReviewMode, activeProposalId, proposals } = useWorktree();
  const { fabricRef, activeTool, setActiveTool, syncCanvasToYjs, undo, redo } = useImageEditor(yImage);
  const [showLayers, setShowLayers] = useState(true);
  const [layers, setLayers] = useState<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new Canvas(canvasRef.current, { width: 512, height: 512, backgroundColor: '#000' });
    fabricRef.current = canvas;
    
    const update = () => {
      // Check for active proposal in review mode
      let activeImageData = yImage.get('baseImageData');
      let isProposalPreview = false;

      if (isReviewMode && activeProposalId) {
        const proposal = (proposals as any)?.get(activeProposalId);
        if (proposal && (proposal.type === 'image_generate' || proposal.type === 'image_inpaint')) {
          activeImageData = proposal.data;
          isProposalPreview = true;
        }
      }

      const canvasData = yImage.get('canvasData');
      if (canvasData && canvasData !== JSON.stringify(canvas.toJSON())) {
        canvas.loadFromJSON(JSON.parse(canvasData)).then(() => {
          canvas.renderAll();
          updateLayersList(canvas);
        });
      }

      if (activeImageData) {
        FabricImage.fromURL(`data:image/png;base64,${activeImageData}`).then(loaded => {
          canvas.getObjects('image').forEach(o => canvas.remove(o));
          loaded.set({ 
            selectable: false, 
            evented: false,
            opacity: isProposalPreview ? 0.9 : 1.0
          });
          canvas.add(loaded);
          canvas.sendObjectToBack(loaded);
          canvas.renderAll();
          updateLayersList(canvas);
        });
      }
    };

    const updateLayersList = (c: Canvas) => {
      setLayers(c.getObjects().map((o, i) => ({ id: i, type: o.type, visible: o.visible, obj: o })));
    };

    yImage.observe(update);
    if (yExperimental) yExperimental.observe(update);
    
    canvas.on('object:added', () => { syncCanvasToYjs(); updateLayersList(canvas); });
    canvas.on('object:modified', syncCanvasToYjs);
    canvas.on('object:removed', () => { syncCanvasToYjs(); updateLayersList(canvas); });
    canvas.on('path:created', syncCanvasToYjs);
    
    update(); // Initial run

    return () => { 
      yImage.unobserve(update); 
      if (yExperimental) yExperimental.unobserve(update);
      canvas.dispose(); 
    };
  }, [yImage, yExperimental, isReviewMode, activeProposalId, proposals, syncCanvasToYjs, fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = activeTool !== 'select';
    if (canvas.isDrawingMode) {
      const b = new PencilBrush(canvas);
      if (activeTool === 'brush') {
        b.width = 5;
        b.color = '#fff';
      } else if (activeTool === 'mask') {
        b.width = 30;
        b.color = 'rgba(255, 0, 0, 0.4)';
      } else if (activeTool === 'eraser') {
        b.width = 20;
        b.color = '#000';
      }
      canvas.freeDrawingBrush = b;
    }
    canvas.renderAll();
  }, [activeTool, fabricRef]);

  const toggleLayer = (index: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[index];
    if (obj) {
      obj.visible = !obj.visible;
      canvas.renderAll();
      setLayers(canvas.getObjects().map((o, i) => ({ id: i, type: o.type, visible: o.visible, obj: o })));
      syncCanvasToYjs();
    }
  };

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'brush', icon: Brush, label: 'Paint' },
    { id: 'mask', icon: Square, label: 'Mask' },
    { id: 'eraser', icon: Eraser, label: 'Erase' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-studio-bg overflow-hidden relative">
      <div className="h-12 border-b border-studio-border flex items-center px-4 bg-studio-panel justify-between shadow-md z-10">
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-studio-border">
          {tools.map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTool(t.id)} 
              title={t.label}
              className={`p-2 rounded-md transition-all ${activeTool === t.id ? 'bg-studio-accent text-white shadow-lg' : 'text-studio-text-dim hover:text-white hover:bg-white/5'}`}
            >
              <t.icon size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-studio-border">
            <button onClick={undo} className="p-2 text-studio-text-dim hover:text-white transition-colors" title="Undo"><Undo2 size={16} /></button>
            <button onClick={redo} className="p-2 text-studio-text-dim hover:text-white transition-colors" title="Redo"><Redo2 size={16} /></button>
          </div>
          <div className="w-px h-6 bg-studio-border/30" />
          <button 
            onClick={() => setShowLayers(!showLayers)} 
            className={`p-2 rounded-md transition-all ${showLayers ? 'bg-studio-accent/20 text-studio-accent' : 'text-studio-text-dim hover:text-white'}`}
            title="Toggle Layers"
          >
            <Layers size={18} />
          </button>
          <button 
            onClick={() => {
              const url = fabricRef.current?.toDataURL({ format: 'png', multiplier: 1 });
              if (url) { const a = document.createElement('a'); a.download = `studio_export_${Date.now()}.png`; a.href = url; a.click(); toast.success('Exported successfully'); }
            }} 
            className="flex items-center gap-2 px-3 py-1.5 bg-studio-accent text-white rounded-lg font-bold text-[10px] hover:bg-studio-accent/80 transition-all shadow-lg shadow-studio-accent/20"
          >
            <Download size={14} />
            <span>EXPORT PNG</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-[#050505]">
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto custom-scrollbar">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-studio-accent to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative">
              <canvas ref={canvasRef} className="border border-studio-border shadow-2xl bg-black" />
              {isReviewMode && (
                <div className="absolute top-2 left-2 bg-studio-accent-orange text-white text-[8px] font-black px-2 py-0.5 rounded shadow-lg animate-pulse z-20 flex items-center gap-1">
                  <Activity size={10} />
                  <span>REVIEWING PROPOSAL</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {showLayers && (
          <div className="w-64 border-l border-studio-border bg-studio-panel flex flex-col shadow-2xl">
            <div className="h-10 border-b border-studio-border flex items-center px-4 bg-black/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-studio-text-dim">Layers</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
              {layers.slice().reverse().map((layer, idx) => (
                <div key={layer.id} className="flex items-center justify-between p-2 rounded bg-black/20 border border-studio-border/30 hover:border-studio-accent/30 group transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black/40 border border-studio-border flex items-center justify-center overflow-hidden">
                      <div className="w-4 h-4 rounded-sm border border-white/20 bg-studio-accent/20" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase">{layer.type === 'path' ? 'Stroke' : layer.type}</span>
                      <span className="text-[8px] text-studio-text-dim font-mono">#{layer.id}</span>
                    </div>
                  </div>
                  <button onClick={() => toggleLayer(layers.length - 1 - idx)} className="text-studio-text-dim hover:text-studio-accent transition-colors">
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} className="opacity-40" />}
                  </button>
                </div>
              ))}
              {layers.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center p-8 gap-2">
                  <Layers size={32} />
                  <span className="text-[10px] font-bold">NO OBJECTS</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
