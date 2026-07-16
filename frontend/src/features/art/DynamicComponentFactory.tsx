import React, { useState, useCallback, useMemo } from 'react';
import { DynamicComponentProps, ToolDefinition } from './types';
import { useDynamicToolRegistry } from './DynamicToolRegistry';

interface DynamicComponentFactoryProps {
  components: Array<{
    id: string;
    type: string;
    data: any;
    settings: any;
    onUpdate: (id: string, data: any) => void;
    onSettingsChange: (id: string, settings: any) => void;
    onDelete?: (id: string) => void;
  }>;
}

const DynamicComponentFactory: React.FC<DynamicComponentFactoryProps> = ({ components }) => {
  const { registry } = useDynamicToolRegistry();
  const [componentStates, setComponentStates] = useState<Map<string, any>>(new Map());

  // Create a component instance
  const createComponent = useCallback((component: DynamicComponentProps) => {
    const Component = loadComponent(component.type);
    
    if (!Component) {
      console.error(`Component type ${component.type} not found in registry`);
      return null;
    }

    return {
      id: component.id,
      type: component.type,
      Component,
      data: component.data,
      settings: component.settings,
      key: `component-${component.id}-${Date.now()}`
    };
  }, [registry]);

  // Load a component type dynamically
  const loadComponent = useCallback((type: string): React.ComponentType<any> | null => {
    const tool = registry[type];
    if (!tool || !tool.settings.componentPath) {
      return null;
    }

    try {
      // In a real implementation, this would be dynamic import
      // For now, we'll return a placeholder component
      return ({ data, settings, onUpdate }: any) => {
        return (
          <div className="dynamic-component p-4 border border-studio-panel-border rounded">
            <h3 className="text-sm font-medium mb-2">{tool.name}</h3>
            <div className="text-xs text-studio-text-secondary mb-2">
              {tool.description}
            </div>
            {/* Component would render here */}
            <div className="mt-2 p-2 bg-studio-bg rounded text-xs">
              Data: {JSON.stringify(data, null, 2)}
            </div>
            <div className="mt-2 p-2 bg-studio-bg rounded text-xs">
              Settings: {JSON.stringify(settings, null, 2)}
            </div>
          </div>
        );
      };
    } catch (error) {
      console.error(`Failed to load component ${type}:`, error);
      return null;
    }
  }, [registry]);

  // Update component data
  const updateComponentData = useCallback((componentId: string, newData: any) => {
    setComponentStates(prev => {
      const newStates = new Map(prev);
      const component = newStates.get(componentId);
      if (component) {
        newStates.set(componentId, { ...component, data: newData });
      }
      return newStates;
    });
  }, []);

  // Update component settings
  const updateComponentSettings = useCallback((componentId: string, newSettings: any) => {
    setComponentStates(prev => {
      const newStates = new Map(prev);
      const component = newStates.get(componentId);
      if (component) {
        newStates.set(componentId, { ...component, settings: newSettings });
      }
      return newStates;
    });
  }, []);

  // Delete component
  const deleteComponent = useCallback((componentId: string) => {
    setComponentStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(componentId);
      return newStates;
    });
  }, []);

  // Render all components
  const renderedComponents = useMemo(() => {
    return components.map((component) => {
      const instance = createComponent(component);
      if (!instance) {
        return null;
      }

      const state = componentStates.get(component.id);
      const currentData = state?.data || component.data;
      const currentSettings = state?.settings || component.settings;

      return (
        <instance.Component
          key={instance.key}
          id={instance.id}
          type={instance.type}
          data={currentData}
          settings={currentSettings}
          onUpdate={(data: any) => {
            component.onUpdate(instance.id, data);
            updateComponentData(instance.id, data);
          }}
          onSettingsChange={(settings: any) => {
            component.onSettingsChange(instance.id, settings);
            updateComponentSettings(instance.id, settings);
          }}
          onDelete={component.onDelete}
        />
      );
    }).filter(Boolean);
  }, [components, componentStates, createComponent, updateComponentData, updateComponentSettings]);

  return (
    <div className="dynamic-component-factory space-y-4">
      {renderedComponents}
    </div>
  );
};

// Hook for dynamically managing components
export const useDynamicComponents = () => {
  const [components, setComponents] = useState<DynamicComponentProps[]>([]);
  
  const addComponent = useCallback((component: Omit<DynamicComponentProps, 'id'>) => {
    const newComponent = {
      ...component,
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    setComponents(prev => [...prev, newComponent as DynamicComponentProps]);
    return newComponent.id;
  }, []);

  const removeComponent = useCallback((componentId: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== componentId));
  }, []);

  const updateComponent = useCallback((componentId: string, updates: Partial<DynamicComponentProps>) => {
    setComponents(prev => prev.map(comp => 
      comp.id === componentId ? { ...comp, ...updates } : comp
    ));
  }, []);

  const getComponent = useCallback((componentId: string): DynamicComponentProps | undefined => {
    return components.find(comp => comp.id === componentId);
  }, [components]);

  const getComponentsByType = useCallback((type: string): DynamicComponentProps[] => {
    return components.filter(comp => comp.type === type);
  }, [components]);

  return {
    components,
    addComponent,
    removeComponent,
    updateComponent,
    getComponent,
    getComponentsByType
  };
};

export default DynamicComponentFactory;