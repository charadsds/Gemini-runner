
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useStore } from '../../store';

export const Effects: React.FC = () => {
  const isPhotosensitiveMode = useStore(state => state.isPhotosensitiveMode);

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <Bloom 
        luminanceThreshold={0.75} 
        mipmapBlur 
        intensity={isPhotosensitiveMode ? 0.2 : 1.0} 
        radius={isPhotosensitiveMode ? 0.2 : 0.6}
        levels={8}
      />
      <Noise opacity={isPhotosensitiveMode ? 0.02 : 0.05} blendFunction={BlendFunction.OVERLAY} />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  );
};
