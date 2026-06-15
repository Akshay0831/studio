import React from 'react';
import ImageEditor from './art/ImageEditor';
import { ArtControls } from './art/ArtControls';
import AudioMixer from './audio/AudioMixer';
import { AudioControls } from './audio/AudioControls';

export interface ExtensionManifest {
  id: string;
  name: string;
  primaryView: React.ComponentType;
  sidebarControls: React.ComponentType;
  stateKey: string;
}

export const EXTENSION_REGISTRY: ExtensionManifest[] = [
  {
    id: 'art',
    name: 'Art Extension',
    primaryView: ImageEditor,
    sidebarControls: ArtControls,
    stateKey: 'image'
  },
  {
    id: 'audio',
    name: 'Audio Extension',
    primaryView: AudioMixer,
    sidebarControls: AudioControls,
    stateKey: 'audio'
  }
];
