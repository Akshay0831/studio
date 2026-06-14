import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const yDoc = new Y.Doc();

const yImage = yDoc.getMap('image');
const yAudio = yDoc.getMap('audio');
const yPrompt = yDoc.getMap('prompt');
const yCollaboration = yDoc.getMap('collaboration');

export const useStudioStore = () => {
  const [isConnected, setConnectionStatus] = useState(false);
  const [apiSocket, setApiSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || `ws://${window.location.host}/ws`;
    
    // Yjs Provider for CRDT state synchronization
    const provider = new WebsocketProvider(wsUrl, 'studio-project', yDoc);

    // Custom WebSocket for real-time API commands and streaming responses
    const newApiSocket = new WebSocket(wsUrl);
    setApiSocket(newApiSocket);

    newApiSocket.onopen = () => {
      setConnectionStatus(true);
    };

    newApiSocket.onmessage = (event) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        setLastMessage(receivedMessage);
      } catch (error) {
        // Handle non-JSON messages (e.g. binary Yjs updates if intercepted)
      }
    };

    newApiSocket.onclose = () => {
      setConnectionStatus(false);
    };

    return () => {
      provider.destroy();
      newApiSocket.close();
    };
  }, []);

  const sendMessage = (payload: any) => {
    if (apiSocket && apiSocket.readyState === WebSocket.OPEN) {
      apiSocket.send(JSON.stringify(payload));
    }
  };

  return {
    yDoc,
    yImage,
    yAudio,
    yPrompt,
    yCollaboration,
    connected: isConnected,
    sendMessage,
    lastMessage
  };
};
