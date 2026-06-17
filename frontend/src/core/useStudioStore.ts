import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { EXTENSION_REGISTRY } from '../features/registry';

const yDoc = new Y.Doc();
const featureMaps: Record<string, Y.Map<any>> = {};
EXTENSION_REGISTRY.forEach(ext => {
  const map = yDoc.getMap(ext.stateKey);
  featureMaps[ext.stateKey] = map;
  
  // Initialize default state if map is empty
  if (ext.initialState && map.size === 0) {
    Object.entries(ext.initialState).forEach(([key, val]) => {
      map.set(key, val);
    });
  }
});

const yCollaboration = yDoc.getMap('collaboration');
const yPrompt = yDoc.getMap('prompt');
const yHistory = yDoc.getArray('history');
const yExperimental = yDoc.getMap('experimental');
const yReviewMode = yDoc.getMap('review_mode');
const yProjectConfig = yDoc.getMap('project_config');

// Initialize experimental proposals
if (yExperimental.size === 0) {
  yExperimental.set('proposals', new Y.Map());
  yExperimental.set('activeProposalId', null);
}

if (yReviewMode.size === 0) {
  yReviewMode.set('active', false);
}

// Initialize project configuration
if (yProjectConfig.size === 0) {
  yProjectConfig.set('stylePreset', 'fantasy');
  yProjectConfig.set('autoSyncAudio', true);
  yProjectConfig.set('sceneMetadata', new Y.Map());
}


// Limit history size to prevent memory bloat
const MAX_HISTORY = 50;
yHistory.observe(() => {
  if (yHistory.length > MAX_HISTORY) {
    yHistory.delete(0, yHistory.length - MAX_HISTORY);
  }
});

let provider: WebsocketProvider | null = null;
let apiSocket: WebSocket | null = null;
const listeners: Set<() => void> = new Set();
let lastMessage: any = null;
let metrics: any = null;
let users: Record<number, any> = {};
let isConnected = false;

const notify = () => listeners.forEach(l => l());

const startConnection = () => {
  if (provider) return;
  const wsUrl = (import.meta.env.VITE_WS_URL as string) || `ws://${window.location.host}/ws`;
  provider = new WebsocketProvider(wsUrl, 'studio-project', yDoc);
  const name = `User ${Math.floor(Math.random() * 1000)}`;
  const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  provider.awareness.setLocalStateField('user', { name, color });
  provider.awareness.on('change', () => {
    const states = provider!.awareness.getStates();
    const currentUsers: Record<number, any> = {};
    states.forEach((state: any, id: number) => { if (state.user) currentUsers[id] = state.user; });
    users = currentUsers;
    notify();
  });
  
  const connectApi = () => {
    apiSocket = new WebSocket(wsUrl);
    apiSocket.onopen = () => { isConnected = true; notify(); };
    apiSocket.onmessage = (e) => { 
      try { 
        const msg = JSON.parse(e.data);
        if (msg.type === 'system_status') {
          metrics = msg;
        } else {
          lastMessage = msg;
        }
        notify(); 
      } catch (err) {
        // Silently ignore non-JSON messages
      } 
    };
    apiSocket.onclose = () => { 
      isConnected = false; 
      notify();
      setTimeout(connectApi, 2000); // Reconnect after 2 seconds
    };
    apiSocket.onerror = () => { apiSocket?.close(); };
  };
  connectApi();
};

export const useStudioStore = () => {
  const [, setUpdate] = useState(0);
  useEffect(() => {
    startConnection();
    const l = () => setUpdate(v => v + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return {
    yDoc,
    featureMaps,
    yImage: featureMaps['image'],
    yAudio: featureMaps['audio'],
    yPrompt,
    yHistory,
    yCollaboration,
    yExperimental,
    yReviewMode,
    yProjectConfig,
    connected: isConnected,
    users,
    lastMessage,
    metrics,
    sendMessage: (msg: any) => { if (apiSocket?.readyState === WebSocket.OPEN) apiSocket.send(JSON.stringify(msg)); }
  };
};
