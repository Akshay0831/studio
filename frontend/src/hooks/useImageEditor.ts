import { useState, useCallback, useRef } from 'react';
import { Canvas } from 'fabric';

export const useImageEditor = (yImage: any) => {
  const fabricRef = useRef<Canvas | null>(null);
  const [activeTool, setActiveTool] = useState('select');

  const syncCanvasToYjs = useCallback(() => {
    if (!fabricRef.current) return;
    const canvasJson = fabricRef.current.toJSON();
    const currentYjsData = yImage?.get('canvasData') as string;
    
    if (JSON.stringify(canvasJson) !== currentYjsData) {
      yImage?.set('canvasData', JSON.stringify(canvasJson));
    }
  }, [yImage]);

  const undo = useCallback(() => {
    (fabricRef.current as any)?.undo?.();
  }, []);

  const redo = useCallback(() => {
    (fabricRef.current as any)?.redo?.();
  }, []);

  return {
    fabricRef,
    activeTool,
    setActiveTool,
    syncCanvasToYjs,
    undo,
    redo
  };
};
