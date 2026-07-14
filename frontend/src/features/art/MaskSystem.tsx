import React, { useState, useRef, useEffect } from 'react';
import { Layers, Brush, Eraser, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

import { useScalableLayout } from '../../components/layout/ScalableLayout';

interface MaskLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  data: ImageData;
  opacity: number;
  blendMode: string;
  transformations: {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
  };
}

interface MaskMode {
  type: 'paint' | 'erase' | 'select' | 'feather';
  size: number;
  hardness: number;
  color: string;
  opacity: number;
}

interface MaskSystemProps {
  canvas: any;
  selectedLayer: any;
  onMaskChange: (mask: ImageData) => void;
  onAIOperation: (operation: 'inpaint' | 'outpaint', mask: ImageData) => void;
}

const MaskSystem: React.FC<MaskSystemProps> = ({ canvas, onMaskChange, onAIOperation }) => {
  
  const { config } = useScalableLayout();
  const [maskLayers, setMaskLayers] = useState<MaskLayer[]>([]);
  const [activeMaskLayer, setActiveMaskLayer] = useState<string | null>(null);
  const [maskMode, setMaskMode] = useState<MaskMode>({
    type: 'paint',
    size: 30,
    hardness: 100,
    color: '#ffffff',
    opacity: 100
  });
  const [showMaskCanvas, setShowMaskCanvas] = useState(false);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const activeLayer = maskLayers.find(layer => layer.id === activeMaskLayer);

  useEffect(() => {
    if (maskCanvasRef.current) {
      const ctx = maskCanvasRef.current.getContext('2d');
      if (ctx) {
        // Initialize mask canvas
        maskCanvasRef.current.width = canvas?.width || 512;
        maskCanvasRef.current.height = canvas?.height || 512;
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
  }, [canvas]);

  const startDrawing = (e: React.MouseEvent) => {
    if (!maskCanvasRef.current || !activeLayer) return;
    
    isDrawingRef.current = true;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = maskCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalAlpha = maskMode.opacity / 100;
    ctx.fillStyle = maskMode.color;
    ctx.strokeStyle = maskMode.color;
    ctx.lineWidth = maskMode.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (maskMode.type === 'paint') {
      ctx.beginPath();
      ctx.arc(x, y, maskMode.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (maskMode.type === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, maskMode.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !maskCanvasRef.current || !activeLayer) return;

    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = maskCanvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (maskMode.type === 'paint') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(x, y, maskMode.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (maskMode.type === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, maskMode.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current || !maskCanvasRef.current || !activeLayer) return;

    isDrawingRef.current = false;
    const ctx = maskCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Update mask data
    const imageData = ctx.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
    
    // Update the active mask layer
    setMaskLayers(prev => prev.map(layer => 
      layer.id === activeLayer.id 
        ? { ...layer, data: imageData }
        : layer
    ));

    // Notify parent component of mask change
    onMaskChange(imageData);
  };

  const createMaskLayer = () => {
    const newLayer: MaskLayer = {
      id: `mask_${Date.now()}`,
      name: `Mask ${maskLayers.length + 1}`,
      visible: true,
      locked: false,
      data: new ImageData(canvas?.width || 512, canvas?.height || 512),
      opacity: 100,
      blendMode: 'normal',
      transformations: {
        x: 0,
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      }
    };

    setMaskLayers(prev => [...prev, newLayer]);
    setActiveMaskLayer(newLayer.id);
  };

  const toggleMaskVisibility = (layerId: string) => {
    setMaskLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  const deleteMaskLayer = (layerId: string) => {
    setMaskLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (activeMaskLayer === layerId) {
      setActiveMaskLayer(maskLayers.length > 1 ? maskLayers[0].id : null);
    }
  };

  const applyAIInpaint = () => {
    if (!activeLayer) return;
    onAIOperation('inpaint', activeLayer.data);
  };

  const applyAIOutpaint = () => {
    if (!activeLayer) return;
    onAIOperation('outpaint', activeLayer.data);
  };

  

  return (
    <div className="bg-studio-panel border border-studio-border rounded-lg p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Layers size={config.iconSize} />
          Mask System
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMaskCanvas(!showMaskCanvas)}
            className="p-2 text-studio-text-dim hover:text-white rounded transition-colors"
            title="Toggle Mask View"
          >
            {showMaskCanvas ? <Eye size={config.iconSize} /> : <EyeOff size={config.iconSize} />}
          </button>
          <button
            onClick={createMaskLayer}
            className="p-2 bg-studio-accent text-white rounded transition-colors"
            title="New Mask Layer"
          >
            <Plus size={config.iconSize} />
          </button>
        </div>
      </div>

      {/* Mask Tools */}
      <div className="mb-4 p-3 bg-studio-bg rounded-lg">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setMaskMode(prev => ({ ...prev, type: 'paint' }))}
            className={`p-2 rounded transition-colors ${
              maskMode.type === 'paint' 
                ? 'bg-studio-accent text-white' 
                : 'bg-studio-bg-hover text-studio-text-dim'
            }`}
          >
            <Brush size={config.iconSize} />
          </button>
          <button
            onClick={() => setMaskMode(prev => ({ ...prev, type: 'erase' }))}
            className={`p-2 rounded transition-colors ${
              maskMode.type === 'erase' 
                ? 'bg-studio-accent text-white' 
                : 'bg-studio-bg-hover text-studio-text-dim'
            }`}
          >
            <Eraser size={config.iconSize} />
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-studio-text-dim">Size: {maskMode.size}px</label>
            <input
              type="range"
              min="1"
              max="100"
              value={maskMode.size}
              onChange={(e) => setMaskMode(prev => ({ ...prev, size: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs text-studio-text-dim">Opacity: {maskMode.opacity}%</label>
            <input
              type="range"
              min="1"
              max="100"
              value={maskMode.opacity}
              onChange={(e) => setMaskMode(prev => ({ ...prev, opacity: parseInt(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Mask Layers */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {maskLayers.map(layer => (
          <div
            key={layer.id}
            className={`p-3 rounded-lg border transition-colors ${
              activeMaskLayer === layer.id
                ? 'border-studio-accent bg-studio-accent bg-opacity-10'
                : 'border-studio-border'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-white text-sm font-medium">{layer.name}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleMaskVisibility(layer.id)}
                  className="p-1 text-studio-text-dim hover:text-white rounded transition-colors"
                  title={layer.visible ? 'Hide' : 'Show'}
                >
                  {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => deleteMaskLayer(layer.id)}
                  className="p-1 text-studio-text-dim hover:text-red-400 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="w-full h-16 bg-studio-bg rounded border border-studio-border relative overflow-hidden">
              {layer.visible && (
                <img
                  src={maskCanvasRef.current?.toDataURL()}
                  alt={layer.name}
                  className="w-full h-full object-cover"
                  style={{ opacity: layer.opacity / 100 }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mask Canvas */}
      {showMaskCanvas && (
        <div className="mt-4 border border-studio-border rounded-lg overflow-hidden">
          <canvas
            ref={maskCanvasRef}
            className="w-full h-48 bg-studio-bg cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      )}

      {/* AI Operations */}
      <div className="mt-4 pt-4 border-t border-studio-border">
        <h4 className="text-sm text-studio-text mb-2">AI Operations</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={applyAIInpaint}
            className="p-2 bg-studio-accent text-white rounded text-sm transition-colors hover:bg-studio-accent"
          >
            Inpaint
          </button>
          <button
            onClick={applyAIOutpaint}
            className="p-2 bg-studio-accent text-white rounded text-sm transition-colors hover:bg-studio-accent"
          >
            Outpaint
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaskSystem;