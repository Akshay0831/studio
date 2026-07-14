import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas, Rect, FabricObject } from 'fabric';
import { Layers, Plus, Trash2, Copy, ArrowUp, ArrowDown, ChevronRight, ChevronDown, MoreVertical, GripVertical, MousePointer2, Edit2, Save, RotateCcw, Square, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { toast } from 'react-hot-toast';
import ContextMenu, { createContextItems } from '../../components/common/ContextMenu';
import LayerTransformControls from './LayerTransformControls';
import { useScalableLayout } from '../../components/layout/ScalableLayout';

interface Layer {
  id: number;
  type: string;
  visible: boolean;
  obj: FabricObject;
  name: string;
  opacity: number;
  selected: boolean;
  locked: boolean;
  blendMode: string;
  blendOptions: string[];
}

// Extended FabricObject interface to include custom properties
interface ExtendedFabricObject extends FabricObject {
  name?: string;
  blendMode?: string;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  layerId: number | null;
  action: string | null;
}

interface LayerManagerProps {
  canvas: Canvas | null;
  onLayerSelect?: (layer: Layer | null) => void;
  selectedTool?: string;
  toolSettings?: any;
}

const LayerManager: React.FC<LayerManagerProps> = ({ canvas, onLayerSelect, selectedTool, toolSettings }) => {
  const { t } = useTranslation();
  const { config } = useScalableLayout();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [showLayers, setShowLayers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartIndex, setDragStartIndex] = useState(0);
  const [editingLayer, setEditingLayer] = useState<number | null>(null);
  const [tempLayerName, setTempLayerName] = useState('');
  const [transformControlsOpen, setTransformControlsOpen] = useState(false);
  const [currentTransformLayer, setCurrentTransformLayer] = useState<Layer | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, layerId: null, action: null });
  const canvasRef = useRef<Canvas | null>(null);

  // Blend modes available for layers
  const blendModes = [
    'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
    'exclusion', 'hue', 'saturation', 'color', 'luminosity'
  ];

  // Initialize canvas ref
  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

  // Enhanced layer update with more comprehensive state tracking
  const updateLayersList = useCallback(() => {
    if (!canvas) return;
    
    const canvasInstance = canvas;
    const objects = canvasInstance.getObjects();
    const newLayers = objects.map((obj, i) => ({
      id: i,
      type: obj.type || 'unknown',
      visible: obj.visible !== false,
      obj: obj as ExtendedFabricObject,
      name: (obj as ExtendedFabricObject).name || generateLayerName(obj, i),
      opacity: obj.opacity || 1,
      selected: obj === canvasInstance.getActiveObject(),
      locked: obj.lockMovementX && obj.lockMovementY,
      blendMode: (obj as ExtendedFabricObject).blendMode || 'source-over',
      blendOptions: blendModes
    }));
    setLayers(newLayers);
  }, [canvas]);

  // Set up event listeners with better persistence
  useEffect(() => {
    if (!canvas) return;
    
    const canvasInstance = canvas;
    
    // Core object events
    const objectEvents = [
      'object:added', 'object:modified', 'object:removed', 
      'selection:created', 'selection:updated', 'selection:cleared'
    ];
    
    objectEvents.forEach(eventName => {
      canvasInstance.off(eventName as any, updateLayersList);
    });

    // Update when selection changes
    canvasInstance.on('selection:created', () => {
      const activeObject = canvasInstance.getActiveObject();
      if (activeObject) {
        selectLayer(layers.findIndex(l => l.obj === activeObject), false);
      }
    });

    // Initial update
    updateLayersList();

    return () => {
      objectEvents.forEach(eventName => {
        canvasInstance.off(eventName as any, updateLayersList);
      });
    };
  }, [canvas, updateLayersList]);

  // Persist layer changes to canvas
  const persistLayerChanges = useCallback(() => {
    if (!canvas) return;
    canvas.renderAll();
    // Trigger any persistence mechanisms
    canvas.fire('object:modified' as any, { target: null });
  }, [canvas]);

  // Enhanced layer visibility with persistence
  const toggleLayerVisibility = (layerId: number) => {
    if (!canvas) return;
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    layer.obj.visible = !layer.obj.visible;
    persistLayerChanges();
    updateLayersList();
    toast.success(`Layer ${layer.visible ? 'shown' : 'hidden'}`);
  };

  // Improved layer selection with active state management
  const selectLayer = (layerId: number, multiSelect = false) => {
    if (!canvas) return;
    
    const newLayers = layers.map(layer => ({
      ...layer,
      selected: multiSelect ? layer.selected : layer.id === layerId
    }));
    
    setLayers(newLayers);
    
    // Select objects on canvas
    const selectedLayer = newLayers.find(l => l.id === layerId);
    if (selectedLayer) {
      canvas.discardActiveObject();
      canvas.setActiveObject(selectedLayer.obj);
      canvas.renderAll();
      
      // Notify parent component
      if (onLayerSelect) {
        onLayerSelect(selectedLayer);
      }
    } else if (onLayerSelect) {
      onLayerSelect(null);
    }
  };

  // Enhanced delete with confirmation and cleanup
  const deleteLayers = () => {
    if (!canvas) return;
    
    const selectedLayers = layers.filter(l => l.selected);
    if (selectedLayers.length === 0) {
      toast.error('No layers selected');
      return;
    }
    
    if (selectedLayers.length > 1) {
      const confirmed = window.confirm(`Delete ${selectedLayers.length} layers? This action cannot be undone.`);
      if (!confirmed) return;
    }
    
    selectedLayers.forEach(layer => {
      canvas.remove(layer.obj);
    });
    
    setLayers(layers.filter(l => !l.selected));
    persistLayerChanges();
    toast.success(`Deleted ${selectedLayers.length} layer(s)`);
    hideContextMenu();
  };

  // Enhanced duplicate with proper cloning
  const duplicateLayers = async () => {
    if (!canvas) return;
    
    const selectedLayers = layers.filter(l => l.selected);
    if (selectedLayers.length === 0) {
      toast.error('No layers selected');
      return;
    }
    
    const clonedObjects: FabricObject[] = [];
    for (const layer of selectedLayers) {
      const clone = await layer.obj.clone(['selectable', 'evented']); // clone with properties
      clone.set({
        left: (layer.obj.left || 0) + 10,
        top: (layer.obj.top || 0) + 10,
        name: `${layer.name} (Copy)`,
        visible: true
      });
      canvas.add(clone);
      clonedObjects.push(clone);
    }
    
    updateLayersList();
    persistLayerChanges();
    toast.success(`Duplicated ${selectedLayers.length} layer(s)`);
    hideContextMenu();
  };

  // Enhanced layer movement with proper z-index management
  const moveLayer = (layerId: number, direction: 'up' | 'down') => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const currentIndex = layers.findIndex(l => l.id === layerId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= layers.length) return;
    
    // Move in array
    const newLayers = [...layers];
    newLayers.splice(currentIndex, 1);
    newLayers.splice(newIndex, 0, layer);
    setLayers(newLayers);
    
    // Move on canvas with proper z-index
    if (direction === 'up') {
      canvas.sendObjectBackwards(layer.obj);
    } else {
      canvas.bringObjectForward(layer.obj);
    }
    
    persistLayerChanges();
  };

  // Enhanced merge with proper blending
  const mergeLayers = () => {
    if (!canvas) return;
    
    const selectedLayers = layers.filter(l => l.selected);
    if (selectedLayers.length < 2) {
      toast.error('Select at least 2 layers to merge');
      return;
    }
    
    // Keep the first selected layer and remove others
    const baseLayer = selectedLayers[0];
    const layersToRemove = selectedLayers.slice(1);
    
    // Copy properties from all selected layers to base layer
    layersToRemove.forEach(layer => {
      // If both are paths, merge the paths
      if (baseLayer.obj.type === 'path' && layer.obj.type === 'path') {
        const basePath = baseLayer.obj as any;
        const mergePath = layer.obj as any;
        
        if (basePath.path && mergePath.path) {
          // Simple path merging - extend the path data
          basePath.path = basePath.path + mergePath.path;
        }
      }
      
      // Remove the layer
      canvas.remove(layer.obj);
    });
    
    setLayers(layers.filter(l => !layersToRemove.includes(l)));
    persistLayerChanges();
    toast.success(`Merged ${selectedLayers.length} layers`);
    hideContextMenu();
  };

  // Enhanced opacity control
  const setLayerOpacity = (layerId: number, opacity: number) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layer.obj.set('opacity', opacity);
      persistLayerChanges();
      setLayers([...layers]);
    }
  };

  // Lock/unlock layer functionality
  const toggleLayerLock = (layerId: number) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const locked = !layer.locked;
    layer.obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked
    });
    
    updateLayersList();
    persistLayerChanges();
    toast.success(`Layer ${locked ? 'locked' : 'unlocked'}`);
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, layer: Layer) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      layerId: layer.id,
      action: null
    });
  };

  // Context menu actions
  const handleContextMenuAction = (action: string, layerId: number) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    switch (action) {
      case 'visibility':
        toggleLayerVisibility(layerId);
        break;
      case 'lock':
        toggleLayerLock(layerId);
        break;
      case 'duplicate':
        duplicateLayers();
        break;
      case 'move-up':
        moveLayer(layerId, 'up');
        break;
      case 'move-down':
        moveLayer(layerId, 'down');
        break;
      case 'transform':
        setCurrentTransformLayer(layer);
        setTransformControlsOpen(true);
        break;
      case 'blend':
        // Show blend mode options - this would need a sub-menu
        break;
    }
    hideContextMenu();
  };

  // Set blend mode
  const setLayerBlendMode = (layerId: number, blendMode: string) => {
    if (!canvas) return;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layer.obj.set('blendMode', blendMode);
      persistLayerChanges();
      updateLayersList();
      hideContextMenu();
    }
  };

  // Save layer name
  const saveLayerName = () => {
    if (editingLayer !== null) {
      const layer = layers.find(l => l.id === editingLayer);
      if (layer) {
        layer.name = tempLayerName;
        persistLayerChanges();
        updateLayersList();
        toast.success('Layer name updated');
      }
    }
    setEditingLayer(null);
    setTempLayerName('');
  };

  // Transform controls
  const handleTransform = (transforms: { x: number; y: number; rotation: number; scaleX: number; scaleY: number; skewX: number; skewY: number }) => {
    if (!currentTransformLayer || !canvas) return;
    
    currentTransformLayer.obj.set({
      left: transforms.x,
      top: transforms.y,
      angle: transforms.rotation,
      scaleX: transforms.scaleX,
      scaleY: transforms.scaleY,
      skewX: transforms.skewX,
      skewY: transforms.skewY
    });
    
    canvas.renderAll();
    persistLayerChanges();
    setTransformControlsOpen(false);
    setCurrentTransformLayer(null);
    updateLayersList();
  };

  const handleDragOver = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    
    const deltaY = e.clientY - dragStartY;
    const newIndex = dragStartIndex + Math.round(deltaY / 40); // 40px per item
    
    if (newIndex >= 0 && newIndex < layers.length) {
      const draggedLayer = layers[dragStartIndex];
      const newLayers = [...layers];
      newLayers.splice(dragStartIndex, 1);
      newLayers.splice(newIndex, 0, draggedLayer);
      setLayers(newLayers);
    }
  };

  const generateLayerName = (obj: FabricObject, index: number): string => {
    const type = obj.type === 'path' ? 'Stroke' : 
                 obj.type === 'rect' ? 'Rectangle' :
                 obj.type === 'circle' ? 'Circle' :
                 obj.type === 'image' ? 'Image' :
                 obj.type === 'text' ? 'Text' :
                 obj.type.charAt(0).toUpperCase() + obj.type.slice(1);
    return `${type} ${index + 1}`;
  };

  const hideContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleDragStart = (e: React.MouseEvent, _layerId: number, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragDirection(null);
  };

  return (
    <div className="w-full h-full bg-studio-bg flex flex-col">
      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer, index) => (
          <div
            key={layer.id}
            className={`flex items-center justify-between p-2 border-b border-studio-border hover:bg-studio-panel-hover ${
              layer.selected ? 'bg-studio-panel-selected' : ''
            }`}
            onClick={() => selectLayer(layer.id)}
          >
            <div className="flex items-center gap-2 flex-1">
              <input
                type="checkbox"
                checked={layer.selected}
                onChange={(e) => {
                  e.stopPropagation();
                  const newLayers = layers.map(l => ({
                    ...l,
                    selected: l.id === layer.id ? e.target.checked : l.selected
                  }));
                  setLayers(newLayers);
                }}
                className="w-4 h-4 rounded border-studio-border"
              />
              {editingLayer === layer.id ? (
                <input
                  type="text"
                  value={tempLayerName}
                  onChange={(e) => setTempLayerName(e.target.value)}
                  onBlur={saveLayerName}
                  onKeyDown={(e) => e.key === 'Enter' && saveLayerName()}
                  className="flex-1 bg-studio-bg border border-studio-border rounded px-2 py-1 text-xs text-white"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-1 flex-1">
                  <span 
                    className="text-sm flex-1 cursor-pointer hover:bg-studio-panel-hover rounded px-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingLayer(layer.id);
                      setTempLayerName(layer.name);
                    }}
                  >
                    {layer.name}
                  </span>
                  {/* Blend Mode Indicator */}
                  <div className="text-[8px] text-studio-text-dim/50">
                    {layer.blendMode.replace('-', ' ')}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                className="p-1 hover:bg-studio-panel-hover rounded"
              >
                {layer.obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(layer.id, 'up');
                }}
                className="p-1 hover:bg-studio-panel-hover rounded"
                disabled={index === 0}
              >
                <ArrowUp size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(layer.id, 'down');
                }}
                className="p-1 hover:bg-studio-panel-hover rounded"
                disabled={index === layers.length - 1}
              >
                <ArrowDown size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteLayers();
                }}
                className="p-1 hover:bg-studio-panel-hover rounded text-red-400"
              >
                <Trash2 size={14} />
              </button>
              {/* Right-click context menu trigger */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContextMenu(e, layer);
                }}
                className="p-1 hover:bg-studio-panel-hover rounded"
              >
                <MoreVertical size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Transform Controls Modal */}
      {transformControlsOpen && currentTransformLayer && (
        <LayerTransformControls
          layer={currentTransformLayer.obj}
          onTransform={handleTransform}
          onCancel={() => {
            setTransformControlsOpen(false);
            setCurrentTransformLayer(null);
          }}
          canvas={canvas}
        />
      )}

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.layerId !== null && (
        <div 
          className="absolute bg-studio-bg border border-studio-border rounded shadow-lg z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="py-1">
            {blendModes.map((mode) => (
              <div
                key={mode}
                className="px-4 py-2 hover:bg-studio-panel-hover cursor-pointer text-xs"
                onClick={() => setLayerBlendMode(contextMenu.layerId!, mode)}
              >
                {mode.replace('-', ' ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerManager;
