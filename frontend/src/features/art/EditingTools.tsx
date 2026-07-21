import React, { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { Canvas, FabricObject, Path, Point } from 'fabric';
import { 
  MousePointer2, Square, Circle, Edit2, Scissors, Droplet, Eraser, 
  Move, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, 
  ZoomIn, ZoomOut, Save, Download, Layers, Filter, Palette, Zap,
  Brush, PenTool, Square as SquareIcon, Circle as CircleIcon,
  Triangle, Pentagon, Hexagon, Star, Heart, ArrowUp as Arrow
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { useScalableLayout } from '../../components/layout/ScalableLayout';
import { ToolType, ToolSettings } from './types';

interface SelectionSettings {
  mode: 'normal' | 'add' | 'subtract' | 'intersect';
  type: 'rect' | 'circle' | 'polygon' | 'freeform';
  feather: number;
  expand: number;
}

interface CloneSettings {
  sourcePoint: Point | null;
  targetPoint: Point | null;
  brushSize: number;
  opacity: number;
  sampling: number;
}

interface EditingToolsProps {
  canvas: Canvas | null;
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onSettingsChange: (settings: Partial<ToolSettings>) => void;
}

const EditingTools: React.FC<EditingToolsProps> = ({ 
  canvas, 
  activeTool, 
  onToolChange, 
  onSettingsChange 
}) => {
  const { t } = useTranslation();
  const { config } = useScalableLayout();
  
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    brushSize: 5,
    brushColor: '#ffffff',
    eraserSize: 20,
    fillColor: '#333333',
    maskColor: '#ff0000',
    strokeColor: '#000000',
    strokeWidth: 1,
    opacity: 1,
    blendMode: 'source-over' as GlobalCompositeOperation,
  });

  const [selectionSettings, setSelectionSettings] = useState<SelectionSettings>({
    mode: 'normal',
    type: 'rect',
    feather: 0,
    expand: 0
  });

  const [cloneSettings, setCloneSettings] = useState<CloneSettings>({
    sourcePoint: null,
    targetPoint: null,
    brushSize: 20,
    opacity: 0.8,
    sampling: 5
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Path | null>(null);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);
  const [brushHistory, setBrushHistory] = useState<Point[]>([]);
  const [cloneSource, setCloneSource] = useState<Point | null>(null);

  const toolRef = useRef<HTMLDivElement>(null);

  // Tool Definitions
  const tools = [
    { id: ToolType.SELECT, label: 'Select', icon: MousePointer2, description: 'Select and move objects' },
    { id: ToolType.BRUSH, label: 'Brush', icon: Brush, description: 'Paint with brush' },
    { id: ToolType.PENCIL, label: 'Pencil', icon: PenTool, description: 'Draw freehand lines' },
    { id: ToolType.ERASER, label: 'Eraser', icon: Eraser, description: 'Erase pixels' },
    { id: ToolType.SHAPE, label: 'Shape', icon: Square, description: 'Draw shapes' },
    { id: ToolType.CLONE, label: 'Clone', icon: Move, description: 'Clone areas' },
    { id: ToolType.HEAL, label: 'Heal', icon: Droplet, description: 'Heal imperfections' },
  ];

  useEffect(() => {
    if (canvas) {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.off('mouse:out', handleMouseOut);
      
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
      canvas.on('mouse:out', handleMouseOut);
    }

    return () => {
      if (canvas) {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
        canvas.off('mouse:out', handleMouseOut);
      }
    };
  }, [canvas, activeTool]);

  // Tool change handler
  const handleToolChange = (tool: ToolType) => {
    onToolChange(tool);
  };

  // Generic event handlers
  const handleMouseDown = (e: any) => {
    if (!canvas) return;
    
    switch (activeTool) {
      case ToolType.BRUSH:
      case ToolType.PENCIL:
        setIsDrawing(true);
        setBrushHistory([]);
        
        if (e.pointer) {
          setBrushHistory([new Point(e.pointer.x || 0, e.pointer.y || 0)]);
          
          if (activeTool === ToolType.BRUSH || activeTool === ToolType.PENCIL) {
            createBrushPath(new Point(e.pointer.x || 0, e.pointer.y || 0));
          } else if (activeTool === ToolType.ERASER) {
            startErasing(new Point(e.pointer.x || 0, e.pointer.y || 0));
          }
        }
        break;
      case ToolType.SHAPE:
        if (e.pointer) {
          setShapeStart(new Point(e.pointer.x || 0, e.pointer.y || 0));
          createShape(new Point(e.pointer.x || 0, e.pointer.y || 0));
        }
        break;
      case ToolType.CLONE:
        if (e.pointer) {
          setCloneSource(new Point(e.pointer.x || 0, e.pointer.y || 0));
          performClone(new Point(e.pointer.x || 0, e.pointer.y || 0));
        }
        break;
      case ToolType.HEAL:
        if (e.pointer) {
          startHealing(new Point(e.pointer.x || 0, e.pointer.y || 0));
        }
        break;
      case ToolType.SELECT:
        if (e.pointer) {
          startCrop(new Point(e.pointer.x || 0, e.pointer.y || 0));
        }
        break;
    }
  };

  const handleMouseMove = (e: any) => {
    if (!canvas) return;
    
    switch (activeTool) {
      case ToolType.BRUSH:
      case ToolType.PENCIL:
        if (!isDrawing) return;
        if (e.pointer) {
          setBrushHistory(prev => [...prev, new Point(e.pointer.x || 0, e.pointer.y || 0)]);
          
          if (activeTool === ToolType.BRUSH || activeTool === ToolType.PENCIL) {
            extendBrushPath(new Point(e.pointer.x || 0, e.pointer.y || 0));
          } else if (activeTool === ToolType.ERASER) {
            continueErasing(new Point(e.pointer.x || 0, e.pointer.y || 0));
          }
        }
        break;
      case ToolType.SHAPE:
        if (!isDrawing || !shapeStart) return;
        if (e.pointer) {
          updateShape(new Point(e.pointer.x || 0, e.pointer.y || 0));
        }
        break;
    }
  };

  const handleMouseUp = (e: any) => {
    if (!canvas) return;
    
    switch (activeTool) {
      case ToolType.BRUSH:
      case ToolType.PENCIL:
        if (isDrawing) {
          setIsDrawing(false);
          setCurrentPath(null);
        }
        break;
      case ToolType.SHAPE:
        if (isDrawing) {
          setIsDrawing(false);
          setCurrentPath(null);
          setShapeStart(null);
        }
        break;
    }
  };

  const handleMouseOut = (e: any) => {
    handleMouseUp(e);
  };

  // Brush and eraser methods
  const createBrushPath = (point: Point) => {
    if (!canvas) return;
    
    const path = new fabric.Path(`M ${point.x} ${point.y}`, {
      stroke: toolSettings.brushColor,
      strokeWidth: toolSettings.brushSize,
      fill: '',
      opacity: toolSettings.opacity,
      globalCompositeOperation: 'source-over'
    });
    
    canvas.add(path);
    setCurrentPath(path);
  };

  const extendBrushPath = (point: Point) => {
    if (!canvas || !currentPath) return;
    
    const pathData = currentPath.path || '';
    const newPathData = `${pathData} L ${point.x} ${point.y}`;
    currentPath.set({ path: newPathData });
    canvas.renderAll();
  };

  const startErasing = (point: Point) => {
    if (!canvas) return;
    
    const eraser = new fabric.Circle({
      radius: toolSettings.eraserSize,
      fill: 'transparent',
      stroke: '#ffffff',
      strokeWidth: 1,
      left: point.x,
      top: point.y,
      opacity: toolSettings.opacity,
      globalCompositeOperation: 'destination-out'
    });
    
    canvas.add(eraser);
    setCurrentPath(eraser as any);
  };

  const continueErasing = (point: Point) => {
    if (!canvas || !currentPath) return;
    
    if (currentPath instanceof fabric.Circle) {
      currentPath.set({
        left: point.x,
        top: point.y
      });
      canvas.renderAll();
    }
  };

  // Shape methods
  const createShape = (point: Point) => {
    if (!canvas) return;
    
    const shape = new fabric.Path('M 0 0 L 50 0 L 50 50 L 0 50 Z', {
      left: point.x,
      top: point.y,
      fill: toolSettings.fillColor,
      stroke: toolSettings.strokeColor,
      strokeWidth: toolSettings.strokeWidth,
      opacity: toolSettings.opacity,
      globalCompositeOperation: toolSettings.blendMode
    });
    
    canvas.add(shape);
    setCurrentPath(shape as any);
    setIsDrawing(true);
  };

  const updateShape = (point: Point) => {
    if (!canvas || !currentPath || !shapeStart) return;
    
    const deltaX = point.x - shapeStart.x;
    const deltaY = point.y - shapeStart.y;
    
    currentPath.set({
      width: Math.abs(deltaX),
      height: Math.abs(deltaY),
      left: Math.min(point.x, shapeStart.x),
      top: Math.min(point.y, shapeStart.y)
    });
    
    canvas.renderAll();
  };

  // Clone method
  const performClone = (point: Point) => {
    if (!canvas || !cloneSource) return;
    
    // Clone logic would go here
    toast.success('Clone tool activated');
  };

  // Healing method
  const startHealing = (point: Point) => {
    if (!canvas) return;
    
    // Healing logic would go here
    toast.success('Healing tool activated');
  };

  // Crop method
  const startCrop = (point: Point) => {
    if (!canvas) return;
    
    // Crop logic would go here
    toast.success('Crop tool activated');
  };

  // Settings change handler
  const handleSettingsChange = (key: keyof ToolSettings, value: any) => {
    const newSettings = { ...toolSettings, [key]: value };
    setToolSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <div ref={toolRef} className="editing-tools">
      <div className="tool-grid">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => handleToolChange(tool.id)}
              title={tool.description}
            >
              <Icon className="tool-icon" />
              <span className="tool-label">{tool.label}</span>
            </button>
          );
        })}
      </div>
      
      <div className="tool-settings">
        <div className="setting-group">
          <label>Brush Size</label>
          <input
            type="range"
            min="1"
            max="50"
            value={toolSettings.brushSize}
            onChange={(e) => handleSettingsChange('brushSize', parseInt(e.target.value))}
          />
          <span>{toolSettings.brushSize}</span>
        </div>
        
        <div className="setting-group">
          <label>Brush Color</label>
          <input
            type="color"
            value={toolSettings.brushColor}
            onChange={(e) => handleSettingsChange('brushColor', e.target.value)}
          />
        </div>
        
        <div className="setting-group">
          <label>Fill Color</label>
          <input
            type="color"
            value={toolSettings.fillColor}
            onChange={(e) => handleSettingsChange('fillColor', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default EditingTools;