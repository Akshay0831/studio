import React, { useEffect, useState, useCallback } from 'react';
import { Canvas } from 'fabric';
import * as fabric from 'fabric';
import { 
  Folder, 
  FolderOpen, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Layer, LayerGroup, ToolType } from './types';

// Props interface
interface LayerManagerProps {
  canvas: Canvas | null;
  onLayerSelect?: (layer: Layer | null) => void;
  selectedTool?: ToolType;
  toolSettings?: any;
}

const LayerManager: React.FC<LayerManagerProps> = ({ canvas, onLayerSelect, selectedTool, toolSettings }) => {
  const { t } = useTranslation();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [showLayers, setShowLayers] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartIndex, setDragStartIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null);
  const [editingLayer, setEditingLayer] = useState<string | null>(null);
  const [tempLayerName, setTempLayerName] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    layerId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    layerId: null
  });
  const [transformControlsOpen, setTransformControlsOpen] = useState(false);
  const [currentTransformLayer, setCurrentTransformLayer] = useState<{
    id: string;
    obj: fabric.Object;
  } | null>(null);

  // Initialize layers
  useEffect(() => {
    if (!canvas) return;

    const updateLayers = () => {
      const canvasLayers: Layer[] = [];
      const objects = canvas.getObjects();
      
      objects.forEach((obj, index) => {
        canvasLayers.push({
          id: `layer-${index}`,
          name: `Layer ${index + 1}`,
          visible: obj.visible !== false,
          locked: false,
          opacity: obj.opacity || 1,
          blendMode: obj.globalCompositeOperation || 'source-over',
          selected: false
        });
      });

      setLayers(canvasLayers);
    };

    updateLayers();
    canvas.on('object:added', updateLayers);
    canvas.on('object:modified', updateLayers);
    canvas.on('object:removed', updateLayers);

    return () => {
      canvas.off('object:added', updateLayers);
      canvas.off('object:modified', updateLayers);
      canvas.off('object:removed', updateLayers);
    };
  }, [canvas]);

  // Layer operations
  const createLayer = () => {
    if (!canvas) return;

    const rect = new fabric.Rect({
      width: 100,
      height: 100,
      fill: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      left: 50,
      top: 50
    });

    canvas.add(rect);
    canvas.renderAll();
  };

  const deleteLayer = (layerId: string) => {
    if (!canvas) return;

    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    if (layerIndex >= 0 && layerIndex < canvas.getObjects().length) {
      canvas.remove(canvas.getObjects()[layerIndex]);
      canvas.renderAll();
    }
  };

  const toggleLayerVisibility = (layerId: string) => {
    if (!canvas) return;

    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    if (layerIndex >= 0 && layerIndex < canvas.getObjects().length) {
      const obj = canvas.getObjects()[layerIndex];
      obj.set({ visible: !obj.visible });
      canvas.renderAll();
    }
  };

  const toggleLayerLock = (layerId: string) => {
    if (!canvas) return;

    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    if (layerIndex >= 0 && layerIndex < canvas.getObjects().length) {
      const obj = canvas.getObjects()[layerIndex];
      obj.set({ selectable: false });
      canvas.renderAll();
    }
  };

  const selectLayer = (layerId: string) => {
    const updatedLayers = layers.map(layer => ({
      ...layer,
      selected: layer.id === layerId
    }));
    setLayers(updatedLayers);

    if (onLayerSelect) {
      const selectedLayer = layers.find(layer => layer.id === layerId);
      onLayerSelect(selectedLayer || null);
    }
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    if (!canvas) return;

    const layerIndex = layers.findIndex(layer => layer.id === layerId);
    if (layerIndex < 0 || layerIndex >= canvas.getObjects().length) return;

    const objects = canvas.getObjects();
    const obj = objects[layerIndex];

    if (direction === 'up' && layerIndex > 0) {
      const objects = canvas.getObjects();
      objects.splice(layerIndex, 1);
      objects.splice(layerIndex - 1, 0, obj);
      canvas.clear();
      objects.forEach(obj => canvas.add(obj));
    } else if (direction === 'down' && layerIndex < objects.length - 1) {
      const objects = canvas.getObjects();
      objects.splice(layerIndex, 1);
      objects.splice(layerIndex + 1, 0, obj);
      canvas.clear();
      objects.forEach(obj => canvas.add(obj));
    }

    canvas.renderAll();
  };

  const showContextMenu = (e: React.MouseEvent, layerId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      layerId
    });
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartIndex(index);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragDirection(null);
  };

  // Render individual layer item
  const renderLayerItem = (layer: Layer, index: number) => {
    return (
      <div
        key={layer.id}
        className={`flex items-center justify-between p-2 border-b border-studio-border hover:bg-studio-panel-hover ${
          layer.selected ? 'bg-studio-panel-selected' : ''
        }`}
        onClick={() => selectLayer(layer.id)}
      >
        <div className="flex items-center gap-2 flex-1">
          {/* Layer Selection */}
          <input
            type="checkbox"
            checked={layer.selected}
            onChange={(e) => {
              e.stopPropagation();
              const updatedLayers = layers.map(l => ({
                ...l,
                selected: l.id === layer.id ? e.target.checked : l.selected
              }));
              setLayers(updatedLayers);
              
              if (onLayerSelect) {
                onLayerSelect(layer.id === layer.id ? layer : null);
              }
            }}
            className="rounded border-studio-border"
          />

          {/* Layer Visibility */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLayerVisibility(layer.id);
            }}
            className="p-1 hover:bg-studio-panel-hover rounded"
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {/* Layer Name */}
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
            </div>
          )}

          {/* Layer Controls */}
          <div className="flex items-center gap-1">
            {/* Lock */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLayerLock(layer.id);
              }}
              className="p-1 hover:bg-studio-panel-hover rounded"
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
            </button>

            {/* Move Controls */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                moveLayer(layer.id, 'up');
              }}
              className="p-1 hover:bg-studio-panel-hover rounded"
              disabled={index === 0}
              title="Move up"
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
              title="Move down"
            >
              <ArrowDown size={14} />
            </button>

            {/* More Actions */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                showContextMenu(e, layer.id);
              }}
              className="p-1 hover:bg-studio-panel-hover rounded"
              title="More options"
            >
              <MoreVertical size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const saveLayerName = () => {
    if (!editingLayer) return;
    
    const updatedLayers = layers.map(layer => 
      layer.id === editingLayer ? { ...layer, name: tempLayerName } : layer
    );
    
    setLayers(updatedLayers);
    setEditingLayer(null);
  };

  const blendModes = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'hard-light',
    'soft-light',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity'
  ];

  return (
    <div className="w-full h-full bg-studio-bg flex flex-col">
      {/* Enhanced Layer Management Header */}
      <div className="flex items-center justify-between p-3 border-b border-studio-border bg-studio-panel-hover">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="p-2 hover:bg-studio-panel-hover rounded-lg"
          >
            {showLayers ? <FolderOpen size={18} /> : <Folder size={18} />}
          </button>
          <span className="text-sm font-medium text-studio-text">Layers</span>
          <span className="text-xs text-studio-text-dim bg-studio-panel px-2 py-1 rounded-full">
            {layers.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={createLayer}
            className="p-2 hover:bg-studio-panel-hover rounded-lg text-green-400"
            title="New layer"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer, index) => renderLayerItem(layer, index))}
      </div>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.layerId !== null && (
        <div 
          className="absolute bg-studio-bg border border-studio-border rounded shadow-lg z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                deleteLayer(contextMenu.layerId! as string);
                setContextMenu({ visible: false, x: 0, y: 0, layerId: null as string | null });
              }}
              className="w-full text-left px-4 py-2 hover:bg-studio-panel-hover cursor-pointer text-xs text-red-400"
            >
              Delete Layer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerManager;