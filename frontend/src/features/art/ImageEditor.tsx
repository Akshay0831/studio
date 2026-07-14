import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Canvas, PencilBrush, FabricImage, Path } from 'fabric';
import { MousePointer2, Eraser, Brush, Download, Undo2, Redo2, Layers, Activity, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudioStore } from '../../core/useStudioStore';
import { useWorktree } from '../../core/useWorktree';
import { useImageEditor } from '../../hooks/useImageEditor';
import LayerManager from './LayerManager';

interface ToolSettings {
  brushSize: number;
  brushColor: string;
  eraserSize: number;
  fillColor: string;
  maskColor: string;
}

const ImageEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { yImage, yExperimental } = useStudioStore();
  const { isReviewMode, activeProposalId, proposals } = useWorktree();
  const { fabricRef, activeTool, setActiveTool, syncCanvasToYjs, undo, redo } = useImageEditor(yImage);
  
  const [selectedLayer, setSelectedLayer] = useState<any>(null);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    brushSize: 5,
    brushColor: '#ffffff',
    eraserSize: 20,
    fillColor: '#333333',
    maskColor: 'rgba(255, 0, 0, 0.4)'
  });

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
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = toolSettings.brushSize;
    canvas.freeDrawingBrush.color = toolSettings.brushColor;
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
        // Find the corresponding layer
        const objects = canvas.getObjects();
        const layerIndex = objects.findIndex(obj => obj === activeObject);
        setSelectedLayer(layerIndex);
      }
    };
    
    const handleSelectionUpdated = (e: any) => {
      const activeObject = e.target;
      if (activeObject) {
        // Find the corresponding layer
        const objects = canvas.getObjects();
        const layerIndex = objects.findIndex(obj => obj === activeObject);
        setSelectedLayer(layerIndex);
      }
    };
    
    const handleSelectionCleared = () => {
      setSelectedLayer(null);
    };
    
    // Add event listeners
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:removed', handleObjectRemoved);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);
    
    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionUpdated);
      canvas.off('selection:cleared', handleSelectionCleared);
    };
  }, [syncCanvasToYjs, fabricRef]);

  // Handle tool changes
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    
    switch (activeTool) {
      case 'brush':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = toolSettings.brushSize;
        canvas.freeDrawingBrush.color = toolSettings.brushColor;
        break;
        
      case 'eraser':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = toolSettings.eraserSize;
        canvas.freeDrawingBrush.color = '#000000'; // Eraser uses transparency through clear effect
        break;
        
      case 'mask':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.width = 30; // Larger brush for masking
        canvas.freeDrawingBrush.color = toolSettings.maskColor;
        break;
        
      case 'rectangle':
        canvas.isDrawingMode = false;
        break;
        
      case 'circle':
        canvas.isDrawingMode = false;
        break;
        
      default:
        canvas.isDrawingMode = false;
    }
  }, [activeTool, toolSettings, fabricRef]);

  // Sync tool settings changes
  const updateToolSettings = useCallback((newSettings: Partial<ToolSettings>) => {
    setToolSettings(prev => ({ ...prev, ...newSettings }));
    
    if (fabricRef.current) {
      const canvas = fabricRef.current;
      
      // Apply settings to selected layer if available
      if (selectedLayer !== null && selectedLayer < canvas.getObjects().length) {
        const selectedObj = canvas.getObjects()[selectedLayer];
        if (newSettings.brushSize !== undefined && selectedObj.strokeWidth !== undefined) {
          selectedObj.set({ strokeWidth: newSettings.brushSize });
        }
        if (newSettings.brushColor !== undefined) {
          selectedObj.set({ stroke: newSettings.brushColor });
        }
        if (newSettings.fillColor !== undefined) {
          selectedObj.set({ fill: newSettings.fillColor });
        }
        canvas.renderAll();
      }
      
      // Update canvas drawing settings
      if (canvas.isDrawingMode && activeTool === 'brush' && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = newSettings.brushSize || toolSettings.brushSize;
        canvas.freeDrawingBrush.color = newSettings.brushColor || toolSettings.brushColor;
      } else if (canvas.isDrawingMode && activeTool === 'eraser' && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = newSettings.eraserSize || toolSettings.eraserSize;
        canvas.freeDrawingBrush.color = '#000000'; // Eraser uses transparency through clear effect
      } else if (canvas.isDrawingMode && activeTool === 'mask' && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = 30; // Larger brush for masking
        canvas.freeDrawingBrush.color = newSettings.maskColor || toolSettings.maskColor;
      }
    }
  }, [fabricRef, activeTool, toolSettings, selectedLayer]);

  const handleCanvasUpdate = useCallback(() => {
    if (!fabricRef.current) return;
    
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
      if (canvasData && fabricRef.current && canvasData !== JSON.stringify(fabricRef.current.toJSON())) {
        fabricRef.current.loadFromJSON(JSON.parse(canvasData)).then(() => {
          if (fabricRef.current) {
            fabricRef.current.renderAll();
          }
        });
      }

      if (activeImageData && fabricRef.current) {
        FabricImage.fromURL(`data:image/png;base64,${activeImageData}`).then(loaded => {
          if (fabricRef.current) {
            fabricRef.current.getObjects('image').forEach(o => {
              if (fabricRef.current) {
                fabricRef.current.remove(o);
              }
            });
            loaded.set({ 
              selectable: false, 
              evented: false,
              opacity: isProposalPreview ? 0.9 : 1.0
            });
            fabricRef.current.add(loaded);
            fabricRef.current.sendObjectToBack(loaded);
            fabricRef.current.renderAll();
          }
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
    
    update(); // Initial run

    return () => { 
      yImage.unobserve(update); 
      if (yExperimental) yExperimental.unobserve(update);
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }
    };
  }, [yImage, yExperimental, isReviewMode, activeProposalId, proposals, syncCanvasToYjs, fabricRef]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    
    // Handle drawing mode
    if (activeTool !== 'select') {
      canvas.isDrawingMode = true;
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
    } else {
      canvas.isDrawingMode = false;
    }
    
    canvas.renderAll();
  }, [activeTool, fabricRef, syncCanvasToYjs]);

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'brush', icon: Brush, label: 'Paint' },
    { id: 'mask', icon: Square, label: 'Mask' },
    { id: 'eraser', icon: Eraser, label: 'Erase' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-studio-bg overflow-hidden relative">
    </div>
  );
};

export default ImageEditor;
