import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, RotateCw, Rotate3D, Move, Grid, GripVertical } from 'lucide-react';


interface TransformControlsProps {
  layer: any;
  onTransform: (transforms: { x: number; y: number; rotation: number; scaleX: number; scaleY: number; skewX: number; skewY: number }) => void;
  onCancel: () => void;
  canvas: any;
}

interface TransformState {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  skewX: number;
  skewY: number;
  isDragging: boolean;
  dragStart: { x: number; y: number };
  transformStart: { x: number; y: number; rotation: number; scaleX: number; scaleY: number };
}

const LayerTransformControls: React.FC<TransformControlsProps> = ({ layer, onTransform, onCancel, canvas }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [transformState, setTransformState] = useState<TransformState>({
    x: layer.left || 0,
    y: layer.top || 0,
    rotation: layer.angle || 0,
    scaleX: layer.scaleX || 1,
    scaleY: layer.scaleY || 1,
    skewX: layer.skewX || 0,
    skewY: layer.skewY || 0,
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    transformStart: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
  });

  const controlPointsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize transform state from layer
    setTransformState(prev => ({
      ...prev,
      x: layer.left || 0,
      y: layer.top || 0,
      rotation: layer.angle || 0,
      scaleX: layer.scaleX || 1,
      scaleY: layer.scaleY || 1,
      skewX: layer.skewX || 0,
      skewY: layer.skewY || 0
    }));
  }, [layer]);

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'rotate' | 'scale' | 'skew') => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    setTransformState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { x: startX, y: startY },
      transformStart: {
        x: prev.x,
        y: prev.y,
        rotation: prev.rotation,
        scaleX: prev.scaleX,
        scaleY: prev.scaleY
      }
    }));

    const handleMouseMove = (e: MouseEvent) => {
      if (!transformState.isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      switch (type) {
        case 'move':
          setTransformState(prev => ({
            ...prev,
            x: prev.transformStart.x + deltaX,
            y: prev.transformStart.y + deltaY
          }));
          break;
          
        case 'rotate':
          const centerX = layer.left || 0;
          const centerY = layer.top || 0;
          const startAngle = Math.atan2(startY - centerY, startX - centerX);
          const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const rotationDiff = (currentAngle - startAngle) * (180 / Math.PI);
          
          setTransformState(prev => ({
            ...prev,
            rotation: prev.transformStart.rotation + rotationDiff
          }));
          break;
          
        case 'scale':
          const scaleFactor = Math.max(0.1, 1 + (deltaX + deltaY) / 200);
          setTransformState(prev => ({
            ...prev,
            scaleX: prev.transformStart.scaleX * scaleFactor,
            scaleY: prev.transformStart.scaleY * scaleFactor
          }));
          break;
          
        case 'skew':
          const skewFactor = (deltaX + deltaY) / 100;
          setTransformState(prev => ({
            ...prev,
            skewX: prev.skewX + skewFactor,
            skewY: prev.skewY + skewFactor
          }));
          break;
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Apply final transforms
      onTransform({
        x: transformState.x,
        y: transformState.y,
        rotation: transformState.rotation,
        scaleX: transformState.scaleX,
        scaleY: transformState.scaleY,
        skewX: transformState.skewX,
        skewY: transformState.skewY
      });
      
      setTransformState(prev => ({ ...prev, isDragging: false }));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleScaleInput = (axis: 'x' | 'y', value: number) => {
    setTransformState(prev => ({
      ...prev,
      scaleX: axis === 'x' ? value : prev.scaleX,
      scaleY: axis === 'y' ? value : prev.scaleY
    }));
  };

  const handleRotationInput = (value: number) => {
    setTransformState(prev => ({
      ...prev,
      rotation: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-studio-panel border border-studio-border rounded-lg p-4 shadow-2xl max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-bold">Layer Transform Controls</h3>
          <div className="flex gap-2">
            <button 
              onClick={onCancel}
              className="p-2 text-studio-text-dim hover:text-white rounded transition-colors"
              title="Cancel"
            >
              <RotateCw size={16} />
            </button>
            <button 
              onClick={() => onTransform({
                x: transformState.x,
                y: transformState.y,
                rotation: transformState.rotation,
                scaleX: transformState.scaleX,
                scaleY: transformState.scaleY,
                skewX: transformState.skewX,
                skewY: transformState.skewY
              })}
              className="p-2 bg-studio-accent text-white rounded transition-colors"
              title="Apply Transform"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm text-studio-text">Position</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={transformState.x.toFixed(1)}
                onChange={(e) => setTransformState(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                className="bg-studio-bg border border-studio-border rounded px-2 py-1 text-sm text-white w-24"
              />
              <span className="text-studio-text-dim self-center">X</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={transformState.y.toFixed(1)}
                onChange={(e) => setTransformState(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                className="bg-studio-bg border border-studio-border rounded px-2 py-1 text-sm text-white w-24"
              />
              <span className="text-studio-text-dim self-center">Y</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-studio-text">Scale</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={transformState.scaleX.toFixed(1)}
                onChange={(e) => handleScaleInput('x', parseFloat(e.target.value))}
                className="bg-studio-bg border border-studio-border rounded px-2 py-1 text-sm text-white w-24"
              />
              <span className="text-studio-text-dim self-center">X</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={transformState.scaleY.toFixed(1)}
                onChange={(e) => handleScaleInput('y', parseFloat(e.target.value))}
                className="bg-studio-bg border border-studio-border rounded px-2 py-1 text-sm text-white w-24"
              />
              <span className="text-studio-text-dim self-center">Y</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-studio-text mb-2 block">Rotation</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-180"
              max="180"
              value={transformState.rotation}
              onChange={(e) => handleRotationInput(parseInt(e.target.value))}
              className="flex-1"
            />
            <span className="text-white w-16 text-center">{transformState.rotation}°</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onMouseDown={(e) => handleMouseDown(e, 'move')}
            className="p-3 bg-studio-bg border border-studio-border rounded hover:bg-studio-accent hover:bg-opacity-20 transition-colors"
            title="Move Layer"
          >
            <Move size={20} />
          </button>
          <button
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            className="p-3 bg-studio-bg border border-studio-border rounded hover:bg-studio-accent hover:bg-opacity-20 transition-colors"
            title="Rotate Layer"
          >
            <Rotate3D size={20} />
          </button>
          <button
            onMouseDown={(e) => handleMouseDown(e, 'scale')}
            className="p-3 bg-studio-bg border border-studio-border rounded hover:bg-studio-accent hover:bg-opacity-20 transition-colors"
            title="Scale Layer"
          >
            <Grid size={20} />
          </button>
          <button
            onMouseDown={(e) => handleMouseDown(e, 'skew')}
            className="p-3 bg-studio-bg border border-studio-border rounded hover:bg-studio-accent hover:bg-opacity-20 transition-colors"
            title="Skew Layer"
          >
            <GripVertical size={20} />
          </button>
        </div>

        {controlPointsRef.current && (
          <div className="relative">
            <div className="absolute inset-0 border-2 border-studio-accent border-dashed rounded pointer-events-none" />
            <div
              ref={controlPointsRef}
              className="absolute w-32 h-32 border border-studio-accent"
              style={{
                left: transformState.x,
                top: transformState.y,
                transform: `translate(-50%, -50%) rotate(${transformState.rotation}deg) scale(${transformState.scaleX}, ${transformState.scaleY}) skew(${transformState.skewX}rad, ${transformState.skewY}rad)`
              }}
            >
              {/* Corner handles for precise manipulation */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-studio-accent rounded-full cursor-nw-resize" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-studio-accent rounded-full cursor-ne-resize" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-studio-accent rounded-full cursor-sw-resize" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-studio-accent rounded-full cursor-se-resize" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerTransformControls;