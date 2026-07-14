import React, { useState, useEffect, createContext, useContext } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

interface LayoutConfig {
  padding: number;
  borderRadius: number;
  spacing: number;
  iconSize: number;
  buttonSize: number;
  panelWidth: number;
  toolPanelWidth: number;
  layerPanelWidth: number;
}

interface ScalableLayoutProps {
  children: React.ReactNode;
  initialConfig?: Partial<LayoutConfig>;
}

const defaultConfig: LayoutConfig = {
  padding: 8,
  borderRadius: 8,
  spacing: 12,
  iconSize: 16,
  buttonSize: 32,
  panelWidth: 300,
  toolPanelWidth: 60,
  layerPanelWidth: 280,
};

const LayoutContext = createContext<{
  config: LayoutConfig;
  updateConfig: (updates: Partial<LayoutConfig>) => void;
  scale: number;
  setScale: (scale: number) => void;
}>({
  config: defaultConfig,
  updateConfig: () => {},
  scale: 1,
  setScale: () => {},
});

export const useScalableLayout = () => useContext(LayoutContext);

const ScalableLayout: React.FC<ScalableLayoutProps> = ({ children, initialConfig }) => {
  const [config, setConfig] = useState<LayoutConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [scale, setScale] = useState(1);

  const updateConfig = (updates: Partial<LayoutConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const increaseScale = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  const decreaseScale = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const resetScale = () => {
    setScale(1);
  };

  const appliedConfig = {
    padding: config.padding * scale,
    borderRadius: config.borderRadius * scale,
    spacing: config.spacing * scale,
    iconSize: config.iconSize * scale,
    buttonSize: config.buttonSize * scale,
    panelWidth: config.panelWidth * scale,
    toolPanelWidth: config.toolPanelWidth * scale,
    layerPanelWidth: config.layerPanelWidth * scale,
  };

  // Create CSS variables for consistent spacing
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--layout-padding', `${appliedConfig.padding}px`);
    root.style.setProperty('--layout-border-radius', `${appliedConfig.borderRadius}px`);
    root.style.setProperty('--layout-spacing', `${appliedConfig.spacing}px`);
    root.style.setProperty('--layout-icon-size', `${appliedConfig.iconSize}px`);
    root.style.setProperty('--layout-button-size', `${appliedConfig.buttonSize}px`);
    root.style.setProperty('--layout-panel-width', `${appliedConfig.panelWidth}px`);
    root.style.setProperty('--layout-tool-panel-width', `${appliedConfig.toolPanelWidth}px`);
    root.style.setProperty('--layout-layer-panel-width', `${appliedConfig.layerPanelWidth}px`);
  }, [appliedConfig]);

  return (
    <LayoutContext.Provider value={{ config: appliedConfig, updateConfig, scale, setScale }}>
      <div className="relative h-screen overflow-hidden">
        {/* Scale controls */}
        <div className="absolute top-4 right-4 z-50 bg-studio-panel border border-studio-border rounded-lg shadow-xl p-2">
          <div className="flex items-center gap-2">
            <button
              onClick={decreaseScale}
              className="p-1 text-studio-text-dim hover:text-white rounded transition-colors"
              title="Decrease Scale"
            >
              <Minus size={14} />
            </button>
            <span className="text-xs text-white w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={increaseScale}
              className="p-1 text-studio-text-dim hover:text-white rounded transition-colors"
              title="Increase Scale"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={resetScale}
              className="p-1 text-studio-text-dim hover:text-white rounded transition-colors"
              title="Reset Scale"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="h-full">
          {children}
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default ScalableLayout;