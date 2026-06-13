import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();

const yImage = doc.getMap('image');
const yAudio = doc.getMap('audio');
const yPrompt = doc.getMap('prompt');
const yCollaboration = doc.getMap('collaboration');

export const useStudioStore = () => {
  const [connected, setStatus] = useState(false);

  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || `ws://${window.location.host}/ws`;
    const provider = new WebsocketProvider(wsUrl, 'studio-project', doc);

    provider.on('status', (event: { status: string }) => {
      setStatus(event.status === 'connected');
    });

    return () => {
      provider.destroy();
    };
  }, []);

  return {
    doc,
    yImage,
    yAudio,
    yPrompt,
    yCollaboration,
    connected
  };
};
