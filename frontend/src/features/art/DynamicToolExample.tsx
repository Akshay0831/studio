import React, { useState, useEffect, useCallback } from 'react';
import { ToolType, ToolSettings, Point } from './types';
import { useDynamicToolRegistry } from './DynamicToolRegistry';
import { useDynamicComponents } from './DynamicComponentFactory';

interface DynamicToolProps {
  toolType: ToolType;
  settings: ToolSettings;
  onSettingsChange: (settings: ToolSettings) => void;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}

// Example: A dynamic brush tool that can be customized
export const DynamicBrushTool: React.FC<DynamicToolProps> = ({
  toolType,
  settings,
  onSettingsChange,
  isActive,
  onActivate,
  onDeactivate
}) => {
  const { registry } = useDynamicToolRegistry();
  const { addComponent, removeComponent, getComponent } = useDynamicComponents();
  
  const [brushSize, setBrushSize] = useState(settings.brushSize);
  const [brushColor, setBrushColor] = useState(settings.brushColor);
  const [opacity, setOpacity] = useState(settings.opacity);
  const [blendMode, setBlendMode] = useState(settings.blendMode);
  const [previewMode, setPreviewMode] = useState(false);
  const [brushPresets, setBrushPresets] = useState<Array<{
    id: string;
    name: string;
    size: number;
    color: string;
    opacity: number;
    blendMode: GlobalCompositeOperation;
  }>>([]);

  // Load brush presets
  useEffect(() => {
    const presets = [
      { id: 'soft', name: 'Soft Brush', size: 15, color: '#000000', opacity: 0.8, blendMode: 'source-over' },
      { id: 'hard', name: 'Hard Brush', size: 25, color: '#000000', opacity: 1, blendMode: 'source-over' },
      { id: 'eraser', name: 'Eraser', size: 30, color: 'transparent', opacity: 1, blendMode: 'destination-out' },
      { id: 'multiply', name: 'Multiply', size: 20, color: '#666666', opacity: 0.6, blendMode: 'multiply' },
      { id: 'screen', name: 'Screen', size: 25, color: '#ffffff', opacity: 0.6, blendMode: 'screen' }
    ];
    setBrushPresets(presets);
  }, []);

  // Update settings when they change
  useEffect(() => {
    onSettingsChange({
      brushSize,
      brushColor,
      eraserSize: brushSize,
      fillColor: brushColor,
      maskColor: 'rgba(255, 0, 0, 0.4)',
      strokeColor: brushColor,
      strokeWidth: 1,
      opacity,
      blendMode
    });
  }, [brushSize, brushColor, opacity, blendMode, onSettingsChange]);

  // Handle brush preset selection
  const handlePresetSelect = useCallback((preset: typeof brushPresets[0]) => {
    setBrushSize(preset.size);
    setBrushColor(preset.color);
    setOpacity(preset.opacity);
    setBlendMode(preset.blendMode);
  }, []);

  // Add custom brush preset
  const handleAddPreset = useCallback(() => {
    const newPreset = {
      id: `preset-${Date.now()}`,
      name: `Custom ${brushPresets.length + 1}`,
      size: brushSize,
      color: brushColor,
      opacity,
      blendMode
    };
    setBrushPresets(prev => [...prev, newPreset]);
    
    // Add as a dynamic component
    addComponent({
      type: 'brush-preset',
      data: newPreset,
      settings: { toolType },
      onUpdate: (id, data) => console.log('Preset updated:', id, data),
      onSettingsChange: (id, settings) => console.log('Settings changed:', id, settings)
    });
  }, [brushSize, brushColor, opacity, blendMode, addComponent, brushPresets.length, toolType]);

  // Remove brush preset
  const handleRemovePreset = useCallback((presetId: string) => {
    setBrushPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  // Tool-specific configurations
  const renderToolConfig = useCallback(() => {
    switch (toolType) {
      case ToolType.BRUSH:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brush Size: {brushSize}px</label>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Brush Color</label>
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="w-full h-8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opacity: {opacity * 100}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blend Mode</label>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as GlobalCompositeOperation)}
                className="w-full p-2 border border-studio-panel-border rounded"
              >
                <option value="source-over">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="screen">Screen</option>
                <option value="overlay">Overlay</option>
                <option value="destination-out">Erase</option>
              </select>
            </div>
          </div>
        );
      case ToolType.ERASER:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Eraser Size: {brushSize}px</label>
              <input
                type="range"
                min="1"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opacity: {opacity * 100}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        );
      default:
        return <div className="text-sm text-studio-text-secondary">No specific settings for this tool</div>;
    }
  }, [toolType, brushSize, brushColor, opacity, blendMode]);

  return (
    <div className={`dynamic-tool ${isActive ? 'active' : ''} p-4 border border-studio-panel-border rounded`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          {toolType === ToolType.BRUSH ? 'Dynamic Brush' : toolType === ToolType.ERASER ? 'Dynamic Eraser' : 'Dynamic Tool'}
        </h3>
        <button
          onClick={isActive ? onDeactivate : onActivate}
          className={`px-3 py-1 rounded text-sm ${
            isActive
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {/* Tool Configuration */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Tool Settings</h4>
        {renderToolConfig()}
      </div>

      {/* Brush Presets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Brush Presets</h4>
          <button
            onClick={handleAddPreset}
            className="text-xs bg-green-500 text-white px-2 py-1 rounded"
          >
            Add Preset
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {brushPresets.map((preset) => (
            <div key={preset.id} className="p-2 bg-studio-bg rounded border border-studio-panel-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{preset.name}</span>
                <button
                  onClick={() => handleRemovePreset(preset.id)}
                  className="text-red-500 text-xs"
                >
                  ×
                </button>
              </div>
              <button
                onClick={() => handlePresetSelect(preset)}
                className="w-full text-xs bg-studio-bg border border-studio-panel-border rounded p-1"
              >
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Mode */}
      <div className="mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={previewMode}
            onChange={(e) => setPreviewMode(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">Preview Mode</span>
        </label>
      </div>

      {/* Preview Canvas */}
      {previewMode && (
        <div className="border border-studio-panel-border rounded p-2">
          <canvas
            ref={(canvas) => {
              if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  // Draw brush preview
                  ctx.globalAlpha = opacity;
                  ctx.globalCompositeOperation = blendMode;
                  ctx.fillStyle = brushColor;
                  ctx.beginPath();
                  ctx.arc(50, 50, brushSize / 2, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }}
            width="100"
            height="100"
            className="border border-studio-panel-border"
          />
        </div>
      )}

      {/* Tool Status */}
      <div className="text-xs text-studio-text-secondary">
        Status: {isActive ? 'Active' : 'Inactive'} | 
        Mode: {toolType} | 
        Settings: {brushSize}px, {brushColor}, {opacity * 100}%
      </div>
    </div>
  );
};

// Example: A dynamic shape tool
export const DynamicShapeTool: React.FC<DynamicToolProps> = ({
  toolType,
  settings,
  onSettingsChange,
  isActive,
  onActivate,
  onDeactivate
}) => {
  const [shapeType, setShapeType] = useState('rectangle');
  const [fillColor, setFillColor] = useState(settings.fillColor);
  const [strokeColor, setStrokeColor] = useState(settings.strokeColor);
  const [strokeWidth, setStrokeWidth] = useState(settings.strokeWidth);
  const [rotation, setRotation] = useState(0);

  // Update settings when they change
  useEffect(() => {
    onSettingsChange({
      ...settings,
      fillColor,
      strokeColor,
      strokeWidth
    });
  }, [fillColor, strokeColor, strokeWidth, settings, onSettingsChange]);

  return (
    <div className={`dynamic-tool ${isActive ? 'active' : ''} p-4 border border-studio-panel-border rounded`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Dynamic Shape Tool</h3>
        <button
          onClick={isActive ? onDeactivate : onActivate}
          className={`px-3 py-1 rounded text-sm ${
            isActive
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Shape Type</label>
          <select
            value={shapeType}
            onChange={(e) => setShapeType(e.target.value)}
            className="w-full p-2 border border-studio-panel-border rounded"
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="triangle">Triangle</option>
            <option value="line">Line</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fill Color</label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-full h-8"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stroke Color</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-full h-8"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stroke Width: {strokeWidth}px</label>
          <input
            type="range"
            min="0"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rotation: {rotation}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DynamicBrushTool;