import React, { useState } from 'react'
import { 
  MousePointer2, Brush, Square, RotateCcw, Star, Circle, Triangle, Pentagon, Heart, X,
  ArrowRight, Type, AlignLeft, AlignCenter, Bold,
  Italic, Underline, Strikethrough, Palette, Droplet, Image, Upload, Copy, Trash2,
  Eye, EyeOff, Layers, Hash, Sliders, Zap, Move,
  Plus, FlipHorizontal, FlipVertical, Sun, Hexagon
} from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  keywords: string[];
  popular?: boolean;
  subTools?: Array<{
    id: string;
    name: string;
    icon: React.ComponentType<any>;
  }>;
}

import ToolLookup from './ToolLookup';
import { MaterialButton } from '../common/MaterialButton';

// Art tool definitions
const artTools: Tool[] = [
  {
    id: 'selection',
    name: 'Selection Tool',
    description: 'Select and move objects on canvas',
    category: 'Selection',
    icon: MousePointer2,
    keywords: ['select', 'move', 'transform', 'resize', 'rotate'],
    popular: true
  },
  {
    id: 'brush',
    name: 'Brush Tool',
    description: 'Draw freehand paths with customizable settings',
    category: 'Drawing',
    icon: Brush,
    keywords: ['draw', 'paint', 'freehand', 'stroke', 'sketch'],
    popular: true
  },
  {
    id: 'pen',
    name: 'Pen Tool',
    description: 'Create precise paths with control points',
    category: 'Drawing',
    icon: Brush,
    keywords: ['vector', 'path', 'bezier', 'curve', 'precise']
  },
  {
    id: 'eraser',
    name: 'Eraser Tool',
    description: 'Remove parts of your drawing',
    category: 'Editing',
    icon: Brush,
    keywords: ['erase', 'remove', 'delete', 'clean'],
    popular: true
  },
  {
    id: 'text',
    name: 'Text Tool',
    description: 'Add text to your canvas',
    category: 'Typography',
    icon: Type,
    keywords: ['text', 'font', 'typography', 'label'],
    popular: true,
    subTools: [
      { id: 'text-style', name: 'Text Style', icon: AlignLeft },
      { id: 'text-bold', name: 'Bold', icon: Bold },
      { id: 'text-italic', name: 'Italic', icon: Italic },
      { id: 'text-underline', name: 'Underline', icon: Underline },
      { id: 'text-strikethrough', name: 'Strikethrough', icon: Strikethrough }
    ]
  },
  {
    id: 'shapes',
    name: 'Shape Tools',
    description: 'Create geometric shapes',
    category: 'Shapes',
    icon: Square,
    keywords: ['shape', 'geometry', 'form'],
    subTools: [
      { id: 'rectangle', name: 'Rectangle', icon: Square },
      { id: 'circle', name: 'Circle', icon: Circle },
      { id: 'triangle', name: 'Triangle', icon: Triangle },
      { id: 'pentagon', name: 'Pentagon', icon: Pentagon },
      { id: 'hexagon', name: 'Hexagon', icon: Hexagon },
      { id: 'star', name: 'Star', icon: Star },
      { id: 'heart', name: 'Heart', icon: Heart },
      { id: 'ellipse', name: 'Ellipse', icon: Circle },
      { id: 'line', name: 'Line', icon: ArrowRight }
    ]
  },
  {
    id: 'lines',
    name: 'Line Tools',
    description: 'Create straight and curved lines',
    category: 'Drawing',
    icon: ArrowRight,
    keywords: ['line', 'straight', 'curved', 'arrow'],
    subTools: [
      { id: 'straight-line', name: 'Straight Line', icon: ArrowRight },
      { id: 'arrow', name: 'Arrow', icon: ArrowRight },
      { id: 'curved-line', name: 'Curved Line', icon: Brush },
      { id: 'bezier-curve', name: 'Bezier Curve', icon: Brush },
      { id: 'spline', name: 'Spline', icon: Brush }
    ]
  },
  {
    id: 'image',
    name: 'Image Tools',
    description: 'Add and manipulate images',
    category: 'Media',
    icon: Image,
    keywords: ['image', 'photo', 'picture', 'import'],
    popular: true,
    subTools: [
      { id: 'place-image', name: 'Place Image', icon: Upload },
      { id: 'crop', name: 'Crop', icon: Square },
      { id: 'resize', name: 'Resize', icon: Square },
      { id: 'rotate-image', name: 'Rotate Image', icon: RotateCcw },
      { id: 'flip-image', name: 'Flip Image', icon: FlipHorizontal },
      { id: 'filter-image', name: 'Filters', icon: Sliders }
    ]
  },
  {
    id: 'transform',
    name: 'Transform Tools',
    description: 'Move, rotate, and scale objects',
    category: 'Transform',
    icon: Move,
    keywords: ['transform', 'move', 'rotate', 'scale', 'flip'],
    popular: true,
    subTools: [
      { id: 'move', name: 'Move', icon: Move },
      { id: 'rotate', name: 'Rotate', icon: RotateCcw },
      { id: 'scale', name: 'Scale', icon: Square },
      { id: 'flip-horizontal', name: 'Flip Horizontal', icon: FlipHorizontal },
      { id: 'flip-vertical', name: 'Flip Vertical', icon: FlipVertical },
      { id: 'skew', name: 'Skew', icon: Square }
    ]
  },
  {
    id: 'effects',
    name: 'Effect Tools',
    description: 'Apply visual effects to your artwork',
    category: 'Effects',
    icon: Zap,
    keywords: ['effect', 'filter', 'style', 'visual'],
    subTools: [
      { id: 'blur', name: 'Blur', icon: Sliders },
      { id: 'sharpen', name: 'Sharpen', icon: Sliders },
      { id: 'color-balance', name: 'Color Balance', icon: Palette },
      { id: 'brightness-contrast', name: 'Brightness & Contrast', icon: Sun },
      { id: 'hue-saturation', name: 'Hue/Saturation', icon: Sliders },
      { id: 'vintage', name: 'Vintage', icon: Palette },
      { id: 'grayscale', name: 'Grayscale', icon: EyeOff },
      { id: 'sepia', name: 'Sepia', icon: Palette }
    ]
  },
  {
    id: 'layers',
    name: 'Layer Management',
    description: 'Organize your artwork with layers',
    category: 'Organization',
    icon: Layers,
    keywords: ['layers', 'organize', 'stack', 'arrange'],
    popular: true,
    subTools: [
      { id: 'new-layer', name: 'New Layer', icon: Plus },
      { id: 'delete-layer', name: 'Delete Layer', icon: Trash2 },
      { id: 'duplicate-layer', name: 'Duplicate Layer', icon: Copy },
      { id: 'merge-layers', name: 'Merge Layers', icon: RotateCcw },
      { id: 'flatten-layers', name: 'Flatten Layers', icon: Layers },
      { id: 'layer-visibility', name: 'Visibility', icon: Eye }
    ]
  },
  {
    id: 'color',
    name: 'Color Tools',
    description: 'Manage colors and palettes',
    category: 'Color',
    icon: Palette,
    keywords: ['color', 'palette', 'hue', 'saturation'],
    popular: true,
    subTools: [
      { id: 'eyedropper', name: 'Eyedropper', icon: Droplet },
      { id: 'fill', name: 'Fill', icon: Square },
      { id: 'gradient', name: 'Gradient', icon: Square },
      { id: 'color-picker', name: 'Color Picker', icon: Palette },
      { id: 'color-palette', name: 'Color Palette', icon: Palette },
      { id: 'color-history', name: 'Color History', icon: Palette }
    ]
  },
  {
    id: 'text-edit',
    name: 'Text Editing',
    description: 'Edit text properties',
    category: 'Typography',
    icon: Type,
    keywords: ['text', 'font', 'style', 'typography'],
    subTools: [
      { id: 'font-size', name: 'Font Size', icon: Hash },
      { id: 'font-family', name: 'Font Family', icon: Type },
      { id: 'text-color', name: 'Text Color', icon: Palette },
      { id: 'text-align', name: 'Text Alignment', icon: AlignCenter },
      { id: 'text-spacing', name: 'Letter Spacing', icon: AlignCenter },
      { id: 'line-spacing', name: 'Line Spacing', icon: AlignCenter }
    ]
  },
  {
    id: 'drawing',
    name: 'Advanced Drawing',
    description: 'Professional drawing tools',
    category: 'Drawing',
    icon: Brush,
    keywords: ['advanced', 'professional', 'expert', 'technical'],
    subTools: [
      { id: 'pencil', name: 'Pencil', icon: Brush },
      { id: 'airbrush', name: 'Airbrush', icon: Brush },
      { id: 'marker', name: 'Marker', icon: Brush },
      { id: 'calligraphy', name: 'Calligraphy', icon: Brush },
      { id: 'ink', name: 'Ink Pen', icon: Brush },
      { id: 'charcoal', name: 'Charcoal', icon: Brush }
    ]
  },
  {
    id: 'selection-modes',
    name: 'Selection Modes',
    description: 'Different selection techniques',
    category: 'Selection',
    icon: MousePointer2,
    keywords: ['selection', 'mask', 'alpha', 'channel'],
    subTools: [
      { id: 'rectangular-selection', name: 'Rectangular', icon: Square },
      { id: 'circular-selection', name: 'Circular', icon: Circle },
      { id: 'lasso', name: 'Lasso', icon: ArrowRight },
      { id: 'magic-wand', name: 'Magic Wand', icon: Square },
      { id: 'color-range', name: 'Color Range', icon: Palette }
    ]
  },
  {
    id: 'adjustments',
    name: 'Image Adjustments',
    description: 'Advanced image editing',
    category: 'Effects',
    icon: Sliders,
    keywords: ['adjustment', 'enhancement', 'correction', 'fix'],
    subTools: [
      { id: 'levels', name: 'Levels', icon: Sliders },
      { id: 'curves', name: 'Curves', icon: Sliders },
      { id: 'exposure', name: 'Exposure', icon: Sun },
      { id: 'shadows-highlights', name: 'Shadows/Highlights', icon: Sliders },
      { id: 'vibrance', name: 'Vibrance', icon: Palette },
      { id: 'saturation', name: 'Saturation', icon: Palette },
      { id: 'temperature', name: 'Temperature', icon: Sun },
      { id: 'tint', name: 'Tint', icon: Palette }
    ]
  },
  {
    id: 'selection-editing',
    name: 'Selection Editing',
    description: 'Modify selections',
    category: 'Selection',
    icon: MousePointer2,
    keywords: ['selection', 'modify', 'expand', 'contract', 'feather'],
    subTools: [
      { id: 'expand-selection', name: 'Expand', icon: Square },
      { id: 'contract-selection', name: 'Contract', icon: Square },
      { id: 'feather', name: 'Feather', icon: Square },
      { id: 'refine', name: 'Refine Edge', icon: MousePointer2 },
      { id: 'invert', name: 'Invert', icon: Square },
      { id: 'deselect', name: 'Deselect', icon: X }
    ]
  },
  {
    id: 'path-editing',
    name: 'Path Editing',
    description: 'Modify vector paths',
    category: 'Drawing',
    icon: Brush,
    keywords: ['path', 'vector', 'edit', 'modify'],
    subTools: [
      { id: 'add-anchor', name: 'Add Anchor Point', icon: Plus },
      { id: 'delete-anchor', name: 'Delete Anchor Point', icon: Trash2 },
      { id: 'convert-anchor', name: 'Convert Anchor', icon: MousePointer2 },
      { id: 'path-direct', name: 'Direct Select', icon: MousePointer2 },
      { id: 'path-edit', name: 'Path Edit', icon: Brush },
      { id: 'stroke-path', name: 'Stroke Path', icon: Brush },
      { id: 'fill-path', name: 'Fill Path', icon: Square }
    ]
  }
];

interface ArtToolLookupProps {
  activeTool?: string;
  onToolSelect: (toolId: string) => void;
  showCompact?: boolean;
}

const ArtToolLookup: React.FC<ArtToolLookupProps> = ({
  activeTool = '',
  onToolSelect = () => {},
  showCompact = false
}) => {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>(activeTool || '');

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    onToolSelect(toolId);
    setExpandedTool(null);
  };

  return (
    <div className="space-y-2">
      <ToolLookup
        tools={artTools}
        selectedTool={selectedTool}
        onToolSelect={handleToolSelect}
        placeholder="Select a tool..."
        showPopular={false}
        showCategories={false}
        compact={showCompact}
      />

      {/* Quick Access Toolbar */}
      {!showCompact && (
        <div className="mt-4 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-text-dim mb-2 uppercase tracking-wider">Quick Access</div>
          <div className="flex flex-wrap gap-1">
            {artTools.filter(tool => tool.popular).map(tool => (
              <MaterialButton
                key={tool.id}
                variant={selectedTool === tool.id ? "outline" : "ghost"}
                size="sm"
                onClick={() => handleToolSelect(tool.id)}
                className="text-xs"
              >
                <tool.icon size={14} />
                <span className="ml-1">{tool.name}</span>
              </MaterialButton>
            ))}
          </div>
          
          {/* Quick Categories */}
          <div className="mt-3 pt-3 border-t border-studio-border">
            <div className="text-xs font-bold text-studio-text-dim mb-2 uppercase tracking-wider">Categories</div>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(artTools.map(tool => tool.category))).slice(0, 6).map(category => (
                <MaterialButton
                  key={category}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const categoryTools = artTools.filter(t => t.category === category);
                    const firstTool = categoryTools[0];
                    handleToolSelect(firstTool.id);
                  }}
                  className="text-xs text-studio-text-dim"
                >
                  {category}
                </MaterialButton>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtools */}
      {!showCompact && expandedTool && (
        <div className="mt-2 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-accent mb-2 uppercase tracking-wider">
            {(() => {
              const parentTool = artTools.find(t => t.id === expandedTool);
              return parentTool ? parentTool.name + ' Tools' : 'Sub-Tools';
            })()}
          </div>
          
          {/* Description */}
          <div className="text-xs text-studio-text-dim mb-3">
            {(() => {
              const parentTool = artTools.find(t => t.id === expandedTool);
              return parentTool ? parentTool.description : '';
            })()}
          </div>
          
          <div className="grid grid-cols-2 gap-1">
            {(() => {
              const parentTool = artTools.find(t => t.id === expandedTool);
              if (!parentTool?.subTools) return null;
              
              return parentTool.subTools.map(subTool => (
                <MaterialButton
                  key={subTool.id}
                  variant={selectedTool === subTool.id ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => handleToolSelect(subTool.id)}
                  className="text-xs h-8"
                >
                  <subTool.icon size={14} />
                  <span className="ml-1 truncate">{subTool.name}</span>
                </MaterialButton>
              ));
            })()}
          </div>
          
          {/* Action Buttons */}
          <div className="mt-3 pt-3 border-t border-studio-border">
            <div className="text-xs font-bold text-studio-text-dim mb-2 uppercase tracking-wider">Actions</div>
            <div className="flex gap-1">
              <MaterialButton
                variant="ghost"
                size="sm"
                onClick={() => setExpandedTool(null)}
                className="text-xs"
              >
                <X size={12} />
                <span className="ml-1">Close</span>
              </MaterialButton>
              <MaterialButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const parentTool = artTools.find(t => t.id === expandedTool);
                  if (parentTool?.popular) {
                    handleToolSelect(parentTool.id);
                    setExpandedTool(null);
                  }
                }}
                className="text-xs"
              >
                <RotateCcw size={12} />
                <span className="ml-1">Main Tool</span>
              </MaterialButton>
            </div>
          </div>
        </div>
      )}

      {/* Tool Info Panel */}
      {!showCompact && selectedTool && (
        <div className="mt-2 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-accent mb-2 uppercase tracking-wider">
            {(() => {
              const tool = artTools.find(t => t.id === selectedTool);
              return tool ? tool.name : 'Selected Tool';
            })()}
          </div>
          
          <div className="text-xs text-studio-text-dim mb-3">
            {(() => {
              const tool = artTools.find(t => t.id === selectedTool);
              return tool ? tool.description : '';
            })()}
          </div>
          
          {(() => {
            const tool = artTools.find(t => t.id === selectedTool);
            if (!tool?.subTools || tool.subTools.length === 0) return null;
            
            return (
              <div>
                <div className="text-xs font-bold text-studio-text-dim mb-2 uppercase tracking-wider">
                  Related Tools
                </div>
                <div className="flex flex-wrap gap-1">
                  {tool.subTools.map(subTool => (
                    <MaterialButton
                      key={subTool.id}
                      variant={selectedTool === subTool.id ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => handleToolSelect(subTool.id)}
                      className="text-xs"
                    >
                      <subTool.icon size={12} />
                      <span className="ml-1">{subTool.name}</span>
                    </MaterialButton>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Recent Tools */}
      {!showCompact && selectedTool && (
        <div className="mt-2 p-3 bg-studio-panel border border-studio-border rounded-lg">
          <div className="text-xs font-bold text-studio-text-dim mb-2 uppercase tracking-wider">Recent Tools</div>
          <div className="flex gap-1">
            {artTools.slice(0, 4).map(tool => (
              <MaterialButton
                key={tool.id}
                variant="ghost"
                size="sm"
                onClick={() => handleToolSelect(tool.id)}
                className="text-xs"
              >
                <tool.icon size={12} />
                <span className="ml-1">{tool.name}</span>
              </MaterialButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtToolLookup;