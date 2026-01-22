
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { Suspense, useEffect } from 'react';
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

// Dynamic Camera Controller
const CameraController = () => {
  const { camera, size } = useThree();
  const { laneCount } = useStore();
  
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
    
    camera.position.lerp(targetPos, delta * 2.0);
    camera.lookAt(0, 0, -30); 
  });
  
  return null;
};

// Procedural Music Manager
const MusicManager = () => {
    const { status, speed } = useStore();
    
    useEffect(() => {
        if (status === GameStatus.PLAYING) {
            audio.startMusic();
        } else if (status === GameStatus.GAME_OVER || status === GameStatus.MENU || status === GameStatus.VICTORY) {
            audio.stopMusic();
        }
    }, [status]);

    useFrame(() => {
        if (status === GameStatus.PLAYING) {
            // Calculate speed factor relative to base speed (0 to infinity, usually caps around 2-3)
            const speedFactor = Math.max(0, (speed - RUN_SPEED_BASE) / RUN_SPEED_BASE);
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
