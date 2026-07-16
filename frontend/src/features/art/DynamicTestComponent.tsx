import React from 'react';
import { DynamicComponentProps } from './types';

// A simple test component to demonstrate dynamic loading
export const DynamicTestComponent: React.FC<DynamicComponentProps> = ({
  id,
  type,
  data,
  settings,
  onUpdate,
  onSettingsChange,
  onDelete
}) => {
  React.useEffect(() => {
    console.log('DynamicTestComponent mounted:', { id, type, data, settings });
  }, [id, type, data, settings]);

  const handleDataChange = () => {
    const newData = {
      ...data,
      counter: (data.counter || 0) + 1,
      timestamp: new Date().toISOString()
    };
    onUpdate(id, newData);
  };

  const handleSettingsChange = (newSettings: any) => {
    onSettingsChange(id, newSettings);
  };

  return (
    <div className="dynamic-test-component p-4 border border-blue-500 rounded-lg bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-800">
          Dynamic Test Component
        </h3>
        <button
          onClick={() => onDelete?.(id)}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Delete
        </button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Component ID: {id}
          </label>
          <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
            {id}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type: {type}
          </label>
          <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
            {type}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Counter: {data.counter || 0}
          </label>
          <button
            onClick={handleDataChange}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Increment Counter
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Settings
          </label>
          <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
            {JSON.stringify(settings, null, 2)}
          </div>
          <button
            onClick={() => handleSettingsChange({ ...settings, updated: true })}
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Update Settings
          </button>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        This demonstrates dynamic component loading and state management.
      </div>
    </div>
  );
};

export default DynamicTestComponent;