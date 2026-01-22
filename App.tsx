
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Environment } from './components/World/Environment';
import { Player } from './components/World/Player';
import { LevelManager } from './components/World/LevelManager';
import { Effects } from './components/World/Effects';
import { HUD } from './components/UI/HUD';
import { useStore } from './store';
import { GameStatus, RUN_SPEED_BASE } from './types';
import { audio } from './components/System/Audio';

// Dynamic Camera Controller with Juice (Shake)
const CameraController = () => {
  const { camera, size } = useThree();
  const { laneCount, status, isPhotosensitiveMode } = useStore();
  const shakeIntensity = useRef(0);
  
  useEffect(() => {
    const triggerHitShake = () => { shakeIntensity.current = isPhotosensitiveMode ? 0.1 : 0.5; };
    const triggerCollectShake = () => { shakeIntensity.current = Math.max(shakeIntensity.current, isPhotosensitiveMode ? 0.01 : 0.05); };
    const triggerSonicShake = () => { shakeIntensity.current = isPhotosensitiveMode ? 0.2 : 0.8; };

    window.addEventListener('player-hit', triggerHitShake);
    window.addEventListener('item-collected', triggerCollectShake);
    window.addEventListener('sonic-pulse', triggerSonicShake);
    
    return () => {
      window.removeEventListener('player-hit', triggerHitShake);
      window.removeEventListener('item-collected', triggerCollectShake);
      window.removeEventListener('sonic-pulse', triggerSonicShake);
    };
  }, [isPhotosensitiveMode]);

  useFrame((state, delta) => {
    // Determine if screen is narrow (mobile portrait)
    const aspect = size.width / size.height;
    const isMobile = aspect < 1.2; 

    const heightFactor = isMobile ? 2.0 : 0.5;
    const distFactor = isMobile ? 4.5 : 1.0;

    const extraLanes = Math.max(0, laneCount - 3);

    const targetY = 5.5 + (extraLanes * heightFactor);
    const targetZ = 8.0 + (extraLanes * distFactor);

    const targetPos = new THREE.Vector3(0, targetY, targetZ);
    
    // Smooth camera movement
    camera.position.lerp(targetPos, delta * 2.0);

    // Apply Shake
    if (shakeIntensity.current > 0) {
      const shake = shakeIntensity.current;
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      shakeIntensity.current = THREE.MathUtils.lerp(shakeIntensity.current, 0, delta * 10);
    }

    camera.lookAt(0, 0, -30); 
  });
  
  return null;
};

// Procedural Music Manager
const MusicManager = () => {
    const { status, speed, isChronoActive } = useStore();
    
    useEffect(() => {
        if (status === GameStatus.PLAYING) {
            audio.startMusic();
        } else {
            audio.stopMusic();
        }
    }, [status]);

    useFrame(() => {
        if (status === GameStatus.PLAYING) {
            // Calculate speed factor relative to base speed
            let speedFactor = Math.max(0, (speed - RUN_SPEED_BASE) / RUN_SPEED_BASE);
            // Chrono slows down music tempo and pitch
            if (isChronoActive) speedFactor *= 0.5;
            audio.updateMusicParams(speedFactor);
        }
    });

    return null;
};

function Scene() {
  return (
    <>
        <Environment />
        <group>
            <group userData={{ isPlayer: true }} name="PlayerGroup">
                 <Player />
            </group>
            <LevelManager />
        </group>
        <Effects />
        <MusicManager />
    </>
  );
}

function App() {
  const { pauseGame, resumeGame, status } = useStore();

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (status === GameStatus.PLAYING) pauseGame();
        else if (status === GameStatus.PAUSED) resumeGame();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [status, pauseGame, resumeGame]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <HUD />
      <Canvas
        shadows
        dpr={[1, 1.5]} 
        gl={{ antialias: false, stencil: false, depth: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 5.5, 8], fov: 60 }}
      >
        <CameraController />
        <Suspense fallback={null}>
            <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
