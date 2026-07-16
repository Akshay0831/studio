import React, { useState, useEffect, useRef } from 'react';
import { Canvas, FabricObject } from 'fabric';
import { 
  Palette, Settings, Sun, Moon, Contrast, Droplets, Activity, 
  Sliders, BarChart3, Eye, EyeOff, Download, RotateCcw, Zap,
  Curve, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../i18n/hooks/useTranslation';
import { AdjustmentType, Adjustment, CurvesPoint, ColorToneToolsProps } from './types';

// Color Balance Interface
interface ColorBalance {
  shadows: { red: number; green: number; blue: number };
  midtones: { red: number; green: number; blue: number };
  highlights: { red: number; green: number; blue: number };
}

// Curves Point Interface
interface CurvesPoint {
  x: number;
  y: number;
  input: number;
  output: number;
}

interface ColorToneToolsProps {
  canvas: Canvas | null;
  selectedLayers: FabricObject[];
  onAdjustmentApplied: () => void;
}

const ColorToneTools: React.FC<ColorToneToolsProps> = ({ 
  canvas, 
  selectedLayers, 
  onAdjustmentApplied 
}) => {
  const { t } = useTranslation();
  
  const [activeAdjustment, setActiveAdjustment] = useState<AdjustmentType | null>(null);
  const [adjustments, setAdjustments] = useState<Map<AdjustmentType, number>>(new Map());
  const [colorBalance, setColorBalance] = useState<ColorBalance>({
    shadows: { red: 0, green: 0, blue: 0 },
    midtones: { red: 0, green: 0, blue: 0 },
    highlights: { red: 0, green: 0, blue: 0 }
  });
  const [curvesPoints, setCurvesPoints] = useState<CurvesPoint[]>([
    { x: 0, y: 0, input: 0, output: 0 },
    { x: 255, y: 255, input: 255, output: 255 }
  ]);
  const [showPreview, setShowPreview] = useState(true);
  const [resetConfirmation, setResetConfirmation] = useState(false);

  const adjustmentDefinitions: Adjustment[] = [
    {
      id: AdjustmentType.BRIGHTNESS,
      name: 'Brightness',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Sun,
      description: 'Adjust overall image brightness'
    },
    {
      id: AdjustmentType.CONTRAST,
      name: 'Contrast',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Contrast,
      description: 'Adjust image contrast'
    },
    {
      id: AdjustmentType.SATURATION,
      name: 'Saturation',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Palette,
      description: 'Adjust color saturation'
    },
    {
      id: AdjustmentType.HUE,
      name: 'Hue',
      value: 0,
      min: -180,
      max: 180,
      step: 1,
      unit: '°',
      icon: RotateCcw,
      description: 'Shift hue colors'
    },
    {
      id: AdjustmentType.EXPOSURE,
      name: 'Exposure',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Sun,
      description: 'Adjust exposure'
    },
    {
      id: AdjustmentType.GAMMA,
      name: 'Gamma',
      value: 1,
      min: 0.1,
      max: 3,
      step: 0.1,
      icon: Activity,
      description: 'Adjust gamma curve'
    },
    {
      id: AdjustmentType.SHADOWS,
      name: 'Shadows',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Eye,
      description: 'Adjust shadow areas'
    },
    {
      id: AdjustmentType.HIGHLIGHTS,
      name: 'Highlights',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Sun,
      description: 'Adjust highlight areas'
    },
    {
      id: AdjustmentType.WHITES,
      name: 'Whites',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: Target,
      description: 'Adjust white point'
    },
    {
      id: AdjustmentType.BLACKS,
      name: 'Blacks',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: '',
      icon: EyeOff,
      description: 'Adjust black point'
    }
  ];

  // Initialize adjustments
  useEffect(() => {
    const initialAdjustments = new Map();
    adjustmentDefinitions.forEach(adj => {
      initialAdjustments.set(adj.id, adj.value);
    });
    setAdjustments(initialAdjustments);
  }, []);

  // Apply adjustment to selected layers
  const applyAdjustment = (adjustmentId: AdjustmentType, value: number) => {
    if (!canvas || selectedLayers.length === 0) return;

    const newAdjustments = new Map(adjustments);
    newAdjustments.set(adjustmentId, value);
    setAdjustments(newAdjustments);

    // Apply adjustment to each selected layer
    selectedLayers.forEach((layer, index) => {
      setTimeout(() => {
        applyAdjustmentToLayer(layer, adjustmentId, value);
      }, index * 50); // Staggered application for performance
    });
  };

  // Apply specific adjustment to layer
  const applyAdjustmentToLayer = (layer: FabricObject, adjustmentId: AdjustmentType, value: number) => {
    if (!canvas) return;

    // Create a filter for the adjustment
    const filter = createAdjustmentFilter(adjustmentId, value);
    
    if (!layer.filters) {
      layer.filters = [];
    }
    
    // Apply filter
    layer.filters.push(filter);
    layer.applyFilters();
    canvas.renderAll();
  };

  // Create adjustment filter
  const createAdjustmentFilter = (adjustmentId: AdjustmentType, value: number) => {
    // This would use a real image processing library in production
    // For now, we'll simulate the effect
    return {
      type: adjustmentId,
      value: value,
      apply: (imageData: ImageData) => {
        // Simulated adjustment effect
        const data = imageData.data;
        
        switch (adjustmentId) {
          case AdjustmentType.BRIGHTNESS:
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, Math.max(0, data[i] + value));
              data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + value));
              data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + value));
            }
            break;
          case AdjustmentType.CONTRAST:
            const factor = (259 * (value + 255)) / (255 * (259 - value));
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
              data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
              data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
            }
            break;
          case AdjustmentType.SATURATION:
            for (let i = 0; i < data.length; i += 4) {
              const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
              data[i] = Math.min(255, Math.max(0, gray + value * (data[i] - gray) / 100));
              data[i + 1] = Math.min(255, Math.max(0, gray + value * (data[i + 1] - gray) / 100));
              data[i + 2] = Math.min(255, Math.max(0, gray + value * (data[i + 2] - gray) / 100));
            }
            break;
        }
        
        return imageData;
      }
    };
  };

  // Apply color balance
  const applyColorBalance = () => {
    if (!canvas || selectedLayers.length === 0) return;

    selectedLayers.forEach(layer => {
      if (!layer.filters) {
        layer.filters = [];
      }
      
      const balanceFilter = {
        type: 'colorBalance',
        balance: colorBalance,
        apply: (imageData: ImageData) => {
          const data = imageData.data;
          
          // Apply color balance to different tonal ranges
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            let shadowFactor = 0;
            let midtoneFactor = 0;
            let highlightFactor = 0;
            
            if (brightness < 85) {
              shadowFactor = 1 - brightness / 85;
            } else if (brightness < 170) {
              midtoneFactor = 1 - Math.abs(brightness - 127.5) / 42.5;
            } else {
              highlightFactor = (brightness - 170) / 85;
            }
            
            data[i] = Math.min(255, Math.max(0, data[i] + 
              shadowFactor * colorBalance.shadows.red +
              midtoneFactor * colorBalance.midtones.red +
              highlightFactor * colorBalance.highlights.red));
            
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + 
              shadowFactor * colorBalance.shadows.green +
              midtoneFactor * colorBalance.midtones.green +
              highlightFactor * colorBalance.highlights.green));
            
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + 
              shadowFactor * colorBalance.shadows.blue +
              midtoneFactor * colorBalance.midtones.blue +
              highlightFactor * colorBalance.highlights.blue));
          }
          
          return imageData;
        }
      };
      
      layer.filters.push(balanceFilter);
      layer.applyFilters();
    });
    
    canvas.renderAll();
    onAdjustmentApplied();
    toast.success('Color balance applied');
  };

  // Apply curves adjustment
  const applyCurves = () => {
    if (!canvas || selectedLayers.length === 0 || curvesPoints.length < 2) return;

    selectedLayers.forEach(layer => {
      if (!layer.filters) {
        layer.filters = [];
      }
      
      const curvesFilter = {
        type: 'curves',
        points: curvesPoints,
        apply: (imageData: ImageData) => {
          const data = imageData.data;
          
          // Create lookup table from curves points
          const lookupTable = new Array(256);
          for (let i = 0; i < 256; i++) {
            lookupTable[i] = i; // Default to no change
          }
          
          // Interpolate between curve points
          for (let i = 0; i < curvesPoints.length - 1; i++) {
            const p1 = curvesPoints[i];
            const p2 = curvesPoints[i + 1];
            
            for (let x = Math.floor(p1.x); x <= Math.ceil(p2.x); x++) {
              const t = (x - p1.x) / (p2.x - p1.x);
              const y = p1.y + t * (p2.y - p1.y);
              lookupTable[x] = Math.floor(y);
            }
          }
          
          // Apply curves to each channel
          for (let i = 0; i < data.length; i += 4) {
            data[i] = lookupTable[data[i]];
            data[i + 1] = lookupTable[data[i + 1]];
            data[i + 2] = lookupTable[data[i + 2]];
          }
          
          return imageData;
        }
      };
      
      layer.filters.push(curvesFilter);
      layer.applyFilters();
    });
    
    canvas.renderAll();
    onAdjustmentApplied();
    toast.success('Curves adjustment applied');
  };

  // Reset all adjustments
  const resetAllAdjustments = () => {
    if (!canvas || selectedLayers.length === 0) return;

    selectedLayers.forEach(layer => {
      layer.filters = layer.filters?.filter(f => 
        !adjustmentDefinitions.some(adj => adj.id === f.type)
      );
      layer.applyFilters();
    });
    
    const resetAdjustments = new Map();
    adjustmentDefinitions.forEach(adj => {
      resetAdjustments.set(adj.id, adj.value);
    });
    setAdjustments(resetAdjustments);
    
    // Reset color balance
    setColorBalance({
      shadows: { red: 0, green: 0, blue: 0 },
      midtones: { red: 0, green: 0, blue: 0 },
      highlights: { red: 0, green: 0, blue: 0 }
    });
    
    // Reset curves
    setCurvesPoints([
      { x: 0, y: 0, input: 0, output: 0 },
      { x: 255, y: 255, input: 255, output: 255 }
    ]);
    
    canvas.renderAll();
    onAdjustmentApplied();
    setResetConfirmation(false);
    toast.success('All adjustments reset');
  };

  // Add curves point
  const addCurvesPoint = (x: number, y: number) => {
    const newPoint = { x, y, input: x, output: y };
    const newPoints = [...curvesPoints, newPoint];
    newPoints.sort((a, b) => a.x - b.x);
    setCurvesPoints(newPoints);
  };

  // Remove curves point
  const removeCurvesPoint = (index: number) => {
    if (curvesPoints.length <= 2) return;
    const newPoints = curvesPoints.filter((_, i) => i !== index);
    setCurvesPoints(newPoints);
  };

  // Get adjustment value
  const getAdjustmentValue = (id: AdjustmentType) => {
    return adjustments.get(id) || 0;
  };

  // Render component
  return (
    <div className="h-full flex flex-col bg-studio-panel border-l border-studio-border">
      {/* Header */}
      <div className="p-3 border-b border-studio-border">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Palette size={16} />
          Color & Tone
        </h3>
        <div className="text-xs text-studio-text-dim mt-1">
          {selectedLayers.length} {selectedLayers.length === 1 ? 'layer' : 'layers'} selected
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-3 border-b border-studio-border">
        <h4 className="text-xs font-medium mb-2">Quick Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              applyAdjustment(AdjustmentType.BRIGHTNESS, 20);
              applyAdjustment(AdjustmentType.CONTRAST, 10);
              applyAdjustment(AdjustmentType.SATURATION, 15);
            }}
            className="p-2 bg-studio-panel-hover rounded text-xs hover:bg-studio-panel-selected"
          >
            Vibrant
          </button>
          <button
            onClick={() => {
              applyAdjustment(AdjustmentType.BRIGHTNESS, -10);
              applyAdjustment(AdjustmentType.CONTRAST, 20);
              applyAdjustment(AdjustmentType.SATURATION, -20);
            }}
            className="p-2 bg-studio-panel-hover rounded text-xs hover:bg-studio-panel-selected"
          >
            Film Noir
          </button>
          <button
            onClick={() => {
              applyAdjustment(AdjustmentType.BRIGHTNESS, 15);
              applyAdjustment(AdjustmentType.CONTRAST, -5);
              applyAdjustment(AdjustmentType.SATURATION, -10);
            }}
            className="p-2 bg-studio-panel-hover rounded text-xs hover:bg-studio-panel-selected"
          >
            Pastel
          </button>
          <button
            onClick={() => {
              applyAdjustment(AdjustmentType.BRIGHTNESS, -5);
              applyAdjustment(AdjustmentType.CONTRAST, 15);
              applyAdjustment(AdjustmentType.SATURATION, 25);
            }}
            className="p-2 bg-studio-panel-hover rounded text-xs hover:bg-studio-panel-selected"
          >
            Dramatic
          </button>
        </div>
      </div>

      {/* Adjustment Controls */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeAdjustment ? (
          <div className="space-y-4">
            {adjustmentDefinitions
              .filter(adj => adj.id === activeAdjustment)
              .map(adj => (
                <div key={adj.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <adj.icon size={14} />
                      <span className="text-sm font-medium">{adj.name}</span>
                    </div>
                    <span className="text-xs text-studio-text">
                      {getAdjustmentValue(adj.id)}{adj.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={adj.min}
                    max={adj.max}
                    step={adj.step}
                    value={getAdjustmentValue(adj.id)}
                    onChange={(e) => applyAdjustment(adj.id, parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-studio-text-dim">{adj.description}</p>
                </div>
              ))}
          </div>
        ) : (
          <div className="space-y-2">
            {adjustmentDefinitions.map(adj => (
              <button
                key={adj.id}
                onClick={() => setActiveAdjustment(adj.id)}
                className="w-full p-2 bg-studio-panel-hover rounded-lg text-left hover:bg-studio-panel-selected flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <adj.icon size={14} />
                  <span className="text-sm">{adj.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-studio-text-dim">
                    {getAdjustmentValue(adj.id)}{adj.unit}
                  </span>
                  {getAdjustmentValue(adj.id) !== adj.value && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyAdjustment(adj.id, adj.value);
                      }}
                      className="text-xs text-studio-text-dim hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color Balance Section */}
      <div className="border-t border-studio-border p-3">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Sliders size={14} />
          Color Balance
        </h4>
        <div className="space-y-3">
          {['shadows', 'midtones', 'highlights'].map(range => (
            <div key={range} className="space-y-2">
              <div className="text-xs font-medium capitalize text-studio-text">
                {range}
              </div>
              {['red', 'green', 'blue'].map(channel => (
                <div key={`${range}-${channel}`} className="flex items-center gap-2">
                  <div className="w-8 text-xs text-studio-text-dim">{channel}</div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={colorBalance[range as keyof ColorBalance][channel as keyof { red: number; green: number; blue: number }]}
                    onChange={(e) => {
                      const newColorBalance = { ...colorBalance };
                      newColorBalance[range as keyof ColorBalance][channel as keyof { red: number; green: number; blue: number }] = parseInt(e.target.value);
                      setColorBalance(newColorBalance);
                    }}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            onClick={applyColorBalance}
            className="w-full p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm"
          >
            Apply Color Balance
          </button>
        </div>
      </div>

      {/* Curves Section */}
      <div className="border-t border-studio-border p-3">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Curve size={14} />
          Curves
        </h4>
        <div className="space-y-3">
          <div className="h-32 bg-studio-panel border border-studio-border rounded relative">
            {/* Simple curves visualization */}
            <div className="absolute inset-0 flex items-center justify-center text-xs text-studio-text-dim">
              Curves editor would appear here
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                addCurvesPoint(128, 128);
                addCurvesPoint(192, 64);
              }}
              className="flex-1 p-2 bg-studio-panel-hover rounded text-xs"
            >
              Add Point
            </button>
            <button
              onClick={() => setCurvesPoints([
                { x: 0, y: 0, input: 0, output: 0 },
                { x: 255, y: 255, input: 255, output: 255 }
              ])}
              className="flex-1 p-2 bg-studio-panel-hover rounded text-xs"
            >
              Reset
            </button>
          </div>
          <button
            onClick={applyCurves}
            className="w-full p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm"
          >
            Apply Curves
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-studio-border p-3">
        <div className="flex gap-2">
          <button
            onClick={() => setResetConfirmation(true)}
            className="flex-1 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
          >
            Reset All
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 p-2 bg-studio-panel-hover rounded text-sm"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      {resetConfirmation && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-studio-panel p-4 rounded-lg border border-studio-border">
            <h4 className="text-sm font-medium mb-2">Reset All Adjustments?</h4>
            <p className="text-xs text-studio-text-dim mb-4">
              This will remove all color and tone adjustments from selected layers.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setResetConfirmation(false)}
                className="flex-1 p-2 bg-studio-panel-hover rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={resetAllAdjustments}
                className="flex-1 p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorToneTools;