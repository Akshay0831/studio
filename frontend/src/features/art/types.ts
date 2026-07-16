// Shared type definitions for Art Studio components

import { Canvas, fabric } from 'fabric';

// Point type for canvas coordinates
export interface Point {
  x: number;
  y: number;
}

// Tool Types - consistent across all components
export enum ToolType {
  SELECT = 'select',
  BRUSH = 'brush',
  PENCIL = 'pencil',
  ERASER = 'eraser',
  SHAPE = 'shape',
  TEXT = 'text',
  CLONE = 'clone',
  HEAL = 'heal',
  CROP = 'crop',
  TRANSFORM = 'transform',
  SELECTION = 'selection'
}

// Tool Settings - consistent across all components
export interface ToolSettings {
  brushSize: number;
  brushColor: string;
  eraserSize: number;
  fillColor: string;
  maskColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}

// Layer interface
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  selected: boolean;
  group?: string;
}

// Layer group interface
export interface LayerGroup {
  id: string;
  name: string;
  collapsed: boolean;
  layerIds: string[];
}

// Shape Types
export enum ShapeType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  POLYGON = 'polygon',
  STAR = 'star',
  ARROW = 'arrow',
  LINE = 'line'
}

// Selection Tool Settings
export interface SelectionSettings {
  mode: 'normal' | 'add' | 'subtract' | 'intersect';
  type: 'rect' | 'circle' | 'polygon' | 'freeform';
  feather: number;
  expand: number;
}

// Clone Tool Settings
export interface CloneSettings {
  size: number;
  spacing: number;
  count: number;
  mode: 'single' | 'multiple' | 'pattern';
  cloneArea: 'brush' | 'rect' | 'circle';
}

// Transform Tool Settings
export interface TransformSettings {
  resize: boolean;
  rotate: boolean;
  skew: boolean;
  perspective: boolean;
  constrainRatio: boolean;
  gridSnapping: boolean;
  gridSize: number;
}

// Adjustment Types
export enum AdjustmentType {
  BRIGHTNESS = 'brightness',
  CONTRAST = 'contrast',
  SATURATION = 'saturation',
  HUE = 'hue',
  EXPOSURE = 'exposure',
  GAMMA = 'gamma',
  INVERT = 'invert',
  GRAYSCALE = 'grayscale',
  SEPIA = 'sepia',
  VIGNETTE = 'vignette',
  BLUR = 'blur',
  SHARPEN = 'sharpen',
  NOISE = 'noise',
  LEVELS = 'levels',
  CURVES = 'curves'
}

// Adjustment Settings
export interface AdjustmentSettings {
  [AdjustmentType.BRIGHTNESS]: number;
  [AdjustmentType.CONTRAST]: number;
  [AdjustmentType.SATURATION]: number;
  [AdjustmentType.HUE]: number;
  [AdjustmentType.EXPOSURE]: number;
  [AdjustmentType.GAMMA]: number;
  [AdjustmentType.INVERT]: boolean;
  [AdjustmentType.GRAYSCALE]: boolean;
  [AdjustmentType.SEPIA]: boolean;
  [AdjustmentType.VIGNETTE]: number;
  [AdjustmentType.BLUR]: number;
  [AdjustmentType.SHARPEN]: number;
  [AdjustmentType.NOISE]: number;
  [AdjustmentType.LEVELS]: { black: number; white: number; gamma: number };
  [AdjustmentType.CURVES]: { points: Array<{ x: number; y: number }> };
}

// Filter Presets
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  adjustments: Partial<AdjustmentSettings>;
  thumbnail?: string;
}

// Tool definition
export interface ToolDefinition {
  id: ToolType;
  name: string;
  icon: any;
  category: 'basic' | 'advanced' | 'transform' | 'adjustment';
  description: string;
  settings: any;
  enabled: boolean;
  hotkey?: string;
}

// Dynamic Component Props
export interface DynamicComponentProps {
  id: string;
  type: string;
  data: any;
  settings: any;
  onUpdate: (id: string, data: any) => void;
  onSettingsChange: (id: string, settings: any) => void;
  onDelete?: (id: string) => void;
}

// Adjustment interface
export interface Adjustment {
  id: AdjustmentType;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  icon: any;
  description?: string;
}

// Color Balance Interface
export interface ColorBalance {
  shadows: { red: number; green: number; blue: number };
  midtones: { red: number; green: number; blue: number };
  highlights: { red: number; green: number; blue: number };
}

// Curves Point Interface
export interface CurvesPoint {
  x: number;
  y: number;
  input: number;
  output: number;
}

// ColorToneTools Props
export interface ColorToneToolsProps {
  canvas: Canvas | null;
  selectedLayers: any[];
  onAdjustmentApplied: () => void;
}

// Canvas Context
export interface CanvasContext {
  canvas: Canvas | null;
  activeTool: ToolType;
  selectedLayer: Layer | null;
  toolSettings: ToolSettings;
  history: any[];
  canUndo: boolean;
  canRedo: boolean;
}