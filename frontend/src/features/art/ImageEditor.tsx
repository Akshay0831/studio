import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, PencilBrush, FabricImage, Path } from 'fabric';
import { MousePointer2, Eraser, Brush, Download, Undo2, Redo2, Layers, Activity, Square, Palette } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudioStore } from '../../core/useStudioStore';
import { useWorktree } from '../../core/useWorktree';
import { useImageEditor } from '../../hooks/useImageEditor';
import LayerManager from './LayerManager';
import EditingTools from './EditingTools';
import ColorToneTools from './ColorToneTools';
import DynamicToolRegistry from './DynamicToolRegistry';
import DynamicComponentFactory from './DynamicComponentFactory';
import PluginSystem from './PluginSystem';
import { ToolType, ToolSettings, Point } from './types';

const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { yImage, yExperimental } = useStudioStore();
  const { isReviewMode, activeProposalId, proposals } = useWorktree();
  const { fabricRef, activeTool, setActiveTool, syncCanvasToYjs, undo, redo } = useImageEditor(yImage);
  
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    brushSize: 5,
    brushColor: '#ffffff',
    eraserSize: 20,
    fillColor: '#333333',
    maskColor: 'rgba(255, 0, 0, 0.4)',
    strokeColor: '#000000',
    strokeWidth: 2,
    opacity: 1,
    blendMode: 'source-over'
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Path | null>(null);
  const [shapeStart, setShapeStart] = useState<Point | null>(null);

  // Tool handling
  const handleToolChange = (tool: ToolType) => {
    setActiveTool(tool);
  };

  const handleSettingsChange = (newSettings: Partial<ToolSettings>) => {
    setToolSettings(prev => ({ ...prev, ...newSettings }));
    
    if (fabricRef.current && activeTool === ToolType.BRUSH && fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.width = newSettings.brushSize || toolSettings.brushSize;
      fabricRef.current.freeDrawingBrush.color = newSettings.brushColor || toolSettings.brushColor;
    }
    
    if (fabricRef.current && activeTool === ToolType.ERASER && fabricRef.current.freeDrawingBrush) {
      fabricRef.current.freeDrawingBrush.width = newSettings.eraserSize || toolSettings.eraserSize;
    }
  };

  // Initialize canvas with enhanced settings
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = new Canvas(canvasRef.current, { 
      width: 512, 
      height: 512, 
      backgroundColor: '#000',
      preserveObjectStacking: true,
      selection: true,
      defaultCursor: 'crosshair',
      hoverCursor: 'crosshair'
    });
    
    fabricRef.current = canvas;
    
    // Set up custom brush for smoother drawing
    const pencilBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush = pencilBrush;
    canvas.isDrawingMode = false;
    
    // Enhanced event handling
    const handleObjectModified = () => {
      syncCanvasToYjs();
    };
    
    const handleObjectAdded = () => {
      syncCanvasToYjs();
    };
    
    const handleObjectRemoved = () => {
      syncCanvasToYjs();
    };
    
    const handleSelectionCreated = (e: any) => {
      const activeObject = e.target;
      if (activeObject) {
        const objects = canvas.getObjects();
        const layerIndex = objects.findIndex(obj => obj === activeObject);
        setSelectedLayer(layerIndex);
      }
    };
    
    const handleSelectionUpdated = (e: any) => {
      const activeObject = e.target;
      if (activeObject) {
        const objects = canvas.getObjects();
        const layerIndex = objects.findIndex(obj => obj === activeObject);
        setSelectedLayer(layerIndex);
      }
    };
    
    const handleSelectionCleared = () => {
      setSelectedLayer(null);
    };
    
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);
    
    return () => {
      canvas.dispose();
    };
  }, [syncCanvasToYjs, fabricRef]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    switch (activeTool) {
      case ToolType.BRUSH:
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = toolSettings.brushSize;
          canvas.freeDrawingBrush.color = toolSettings.brushColor;
        }
        break;
        
      case ToolType.ERASER:
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.width = toolSettings.eraserSize;
          canvas.freeDrawingBrush.color = '#000000';
        }
        break;
        
      case ToolType.SELECT:
        canvas.isDrawingMode = false;
        break;
        
      case ToolType.SHAPE:
        canvas.isDrawingMode = false;
        break;
        
      default:
        canvas.isDrawingMode = false;
    }
  }, [activeTool, toolSettings, fabricRef]);

  // Tools array
  const tools = [
    { id: ToolType.SELECT, icon: MousePointer2, label: 'Select' },
    { id: ToolType.BRUSH, icon: Brush, label: 'Paint' },
    { id: ToolType.ERASER, icon: Eraser, label: 'Erase' },
    { id: ToolType.SHAPE, icon: Square, label: 'Shape' }
  ];

  // Sync canvas state to Y.js
  useEffect(() => {
    if (fabricRef.current && yImage) {
      const canvasData = JSON.stringify(fabricRef.current.toJSON());
      yImage.set('canvasData', canvasData);
    }
  }, [fabricRef, yImage, selectedLayer]);

  // Handle canvas update from Y.js
  const handleCanvasUpdate = useCallback(() => {
    if (!fabricRef.current) return;
    
    const update = () => {
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
      if (canvasData && fabricRef.current && canvasData !== JSON.stringify(fabricRef.current.toJSON())) {
        fabricRef.current.loadFromJSON(JSON.parse(canvasData)).then(() => {
          fabricRef.current?.renderAll();
        });
      }

      if (activeImageData && fabricRef.current) {
        FabricImage.fromURL(`data:image/png;base64,${activeImageData}`).then(loaded => {
          fabricRef.current?.getObjects('image').forEach(o => {
            fabricRef.current?.remove(o);
          });
          loaded.set({ 
            selectable: false, 
            evented: false,
            opacity: isProposalPreview ? 0.9 : 1.0
          });
          fabricRef.current?.add(loaded);
          fabricRef.current?.sendObjectToBack(loaded);
          fabricRef.current?.renderAll();
        });
      }
    };

    yImage.observe(update);
    if (yExperimental) yExperimental.observe(update);
    
    if (fabricRef.current) {
      fabricRef.current.on('object:added', syncCanvasToYjs);
      fabricRef.current.on('object:modified', syncCanvasToYjs);
      fabricRef.current.on('object:removed', syncCanvasToYjs);
      fabricRef.current.on('path:created', syncCanvasToYjs);
    }
    
    update();

    return () => { 
      yImage.unobserve(update); 
      if (yExperimental) yExperimental.unobserve(update);
    };
  }, [yImage, yExperimental, isReviewMode, activeProposalId, proposals, syncCanvasToYjs, fabricRef]);

  // Handle adjustment application
  const handleAdjustmentApplied = useCallback(() => {
    if (fabricRef.current) {
      syncCanvasToYjs();
    }
  }, [syncCanvasToYjs, fabricRef]);

  return (
    <div className="flex-1 flex bg-studio-bg overflow-hidden">
      {/* Left Sidebar - Layer Management */}
      <div className="w-64 border-r border-studio-panel-border bg-studio-panel">
        <LayerManager 
          canvas={fabricRef.current || null}
          onLayerSelect={(layer) => {
            if (layer) {
              setSelectedLayer(parseInt(layer.id.replace('layer-', '')));
            } else {
              setSelectedLayer(null);
            }
          }}
          selectedTool={activeTool as ToolType}
          toolSettings={toolSettings}
        />
      </div>

      {/* Center - Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-12 border-b border-studio-panel-bg bg-studio-panel">
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as any)}
                  className={`p-2 rounded-lg flex items-center gap-2 transition-colors ${
                    activeTool === tool.id 
                      ? 'bg-studio-panel-selected text-white' 
                      : 'bg-studio-panel-hover hover:bg-studio-panel-selected text-studio-text'
                  }`}
                  title={tool.label}
                >
                  <tool.icon size={16} />
                  <span className="text-sm">{tool.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={undo}
                className="p-2 hover:bg-studio-panel-hover rounded-lg"
                title="Undo"
              >
                <Undo2 size={16} />
              </button>
              <button 
                onClick={redo}
                className="p-2 hover:bg-studio-panel-hover rounded-lg"
                title="Redo"
              >
                <Redo2 size={16} />
              </button>
              <button 
                onClick={() => {
                  if (fabricRef.current) {
                    const dataURL = fabricRef.current.toDataURL();
                    const link = document.createElement('a');
                    link.download = 'edited-image.png';
                    link.href = dataURL;
                    link.click();
                    toast.success('Image exported');
                  }
                }}
                className="p-2 hover:bg-studio-panel-hover rounded-lg"
                title="Export"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center bg-studio-panel p-4">
          <div className="relative">
            <canvas 
              ref={canvasRef}
              width={512}
              height={512}
              className="border border-studio-panel-border rounded-lg bg-black"
            />
            {/* Canvas Info Overlay */}
            <div className="absolute top-2 left-2 text-xs text-studio-text-dim bg-studio-panel/80 px-2 py-1 rounded">
              {selectedLayer !== null ? `Layer ${selectedLayer + 1}` : 'No layer selected'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Editing Tools */}
      <div className="w-64 border-l border-studio-panel-border bg-studio-panel">
        <EditingTools 
          canvas={fabricRef.current || null}
          activeTool={activeTool as ToolType}
          onToolChange={setActiveTool}
          onSettingsChange={handleSettingsChange}
        />
      </div>
    </div>
  );
};

export default ImageEditor;
