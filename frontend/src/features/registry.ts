import React from 'react';
import { Image, Music, Layers } from 'lucide-react';
import ImageEditor from './art/ImageEditor';
import { ArtControls } from './art/ArtControls';
import AudioMixer from './audio/AudioMixer';
import { AudioControls } from './audio/AudioControls';

export interface ExtensionManifest {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  primaryView: React.ComponentType;
  sidebarControls: React.ComponentType;
  stateKey: string;
  initialState?: Record<string, any>;
}

export const EXTENSION_REGISTRY: ExtensionManifest[] = [
  {
    id: 'art',
    name: 'Art Studio',
    icon: Image,
    primaryView: ImageEditor,
    sidebarControls: ArtControls,
    stateKey: 'image',
    initialState: {
      steps: 20,
      model: 'sdxl',
      ultra_detail: false,
      fast_mode: true
    }
  },
  {
    id: 'audio',
    name: 'Audio Mixer',
    icon: Music,
    primaryView: AudioMixer,
    sidebarControls: AudioControls,
    stateKey: 'audio',
    initialState: {
      bpm: 120,
      key: 'C',
      scale: 'Major',
      mood: 'Neutral',
      composer: 'standard',
      effects: { eq: true, reverb: false, delay: false, compression: true },
      layers: [
        { name: 'Bass', volume: 0, pan: 0, active: true },
        { name: 'Lead', volume: 0, pan: 0, active: true },
        { name: 'Drums', volume: 0, pan: 0, active: true },
        { name: 'Ambient', volume: 0, pan: 0, active: false },
      ]
    }
  }
];
