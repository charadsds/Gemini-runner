
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

const DynamicSkybox: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { 
    isSpeedBoosted, 
    isChronoActive, 
    isImmortalityActive, 
    isTempInvincible, 
    isPhotosensitiveMode,
    status 
  } = useStore();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uIntensity: { value: 0 },
    uPhotosensitive: { value: 0 },
    uColorNormal: { value: new THREE.Color('#050011') },
    uColorBoost: { value: new THREE.Color('#003344') },
    uColorChrono: { value: new THREE.Color('#220033') },
    uColorImmortal: { value: new THREE.Color('#332200') },
    uActiveMode: { value: 0 }, // 0: Normal, 1: Boost, 2: Chrono, 3: Immortal
  }), []);

  useFrame((state, delta) => {
    if (!matRef.current) return;

    // Music Beat Calculation
    const bps = audio.tempo / 60;
    const beatProgress = (state.clock.elapsedTime * bps) % 1;
    const beatPulse = Math.pow(1.0 - beatProgress, 4.0);
    const finalIntensity = isPhotosensitiveMode ? beatPulse * 0.15 : beatPulse;

    // Determine target mode
    let targetMode = 0;
    if (isImmortalityActive || isTempInvincible) targetMode = 3;
    else if (isChronoActive) targetMode = 2;
    else if (isSpeedBoosted) targetMode = 1;

    // Smooth transition between modes
    matRef.current.uniforms.uActiveMode.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uActiveMode.value, 
      targetMode, 
      delta * (isPhotosensitiveMode ? 1.0 : 3.0)
    );

    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    matRef.current.uniforms.uIntensity.value = finalIntensity;
    matRef.current.uniforms.uPhotosensitive.value = isPhotosensitiveMode ? 1 : 0;
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[200, 32, 32]} />
      <shaderMaterial
        ref={matRef}
        side={THREE.BackSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uIntensity;
          uniform float uPhotosensitive;
          uniform float uActiveMode;
          uniform vec3 uColorNormal;
          uniform vec3 uColorBoost;
          uniform vec3 uColorChrono;
          uniform vec3 uColorImmortal;
          varying vec3 vPosition;
          varying vec2 vUv;

          // Simple Noise Function
          float noise(vec3 p) {
            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
          }

          void main() {
            // Blend colors based on active mode
            vec3 color = uColorNormal;
            float m = uActiveMode;
            
            if (m < 1.0) color = mix(uColorNormal, uColorBoost, m);
            else if (m < 2.0) color = mix(uColorBoost, uColorChrono, m - 1.0);
            else color = mix(uColorChrono, uColorImmortal, clamp(m - 2.0, 0.0, 1.0));

            // Procedural Nebula Stars/Dust
            vec3 ray = normalize(vPosition);
            float n = noise(ray * 5.0 + uTime * 0.05);
            float stars = pow(noise(ray * 100.0), 20.0) * 0.5;
            
            // Subtle pulse on the nebula dust
            float nebula = smoothstep(0.4, 0.6, noise(ray * 2.0 - uTime * 0.02));
            vec3 nebulaColor = color * (1.0 + uIntensity * 0.5);
            
            vec3 finalColor = mix(color, nebulaColor, nebula * 0.3);
            finalColor += stars * (1.0 + uIntensity * 1.5);

            // Add a horizon glow
            float horizon = smoothstep(0.0, -50.0, vPosition.y);
            finalColor = mix(finalColor, vec3(0.0), horizon * 0.5);

            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
      />
    </mesh>
  );
};

const StarField: React.FC = () => {
  const speed = useStore(state => state.speed);
  const status = useStore(state => state.status);
  const count = 3000; // Increased star count for better density
  const meshRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      let x = (Math.random() - 0.5) * 400;
      let y = (Math.random() - 0.5) * 200 + 50; // Keep mostly above horizon
      
      // Distribute Z randomly along the entire travel path plus buffer
      // Range: -550 to 100 to ensure full coverage from start
      let z = -550 + Math.random() * 650;

      // Exclude stars from the central play area
      if (Math.abs(x) < 15 && y > -5 && y < 20) {
          if (x < 0) x -= 15;
          else x += 15;
      }

      pos[i * 3] = x;     
      pos[i * 3 + 1] = y; 
      pos[i * 3 + 2] = z; 
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || status !== GameStatus.PLAYING) return;
    
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const activeSpeed = speed > 0 ? speed : 2; // Always move slightly even when stopped

    for (let i = 0; i < count; i++) {
        let z = positions[i * 3 + 2];
        z += activeSpeed * delta * 2.0; // Parallax effect
        
        // Reset when it passes the camera (z > 100 gives plenty of buffer behind camera)
        if (z > 100) {
            // Reset far back with a random buffer to prevent "walls" of stars
            z = -550 - Math.random() * 50; 
            
            // Re-randomize X/Y on respawn with exclusion logic
            let x = (Math.random() - 0.5) * 400;
            let y = (Math.random() - 0.5) * 200 + 50;
            
            if (Math.abs(x) < 15 && y > -5 && y < 20) {
                if (x < 0) x -= 15;
                else x += 15;
            }

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
        }
        positions[i * 3 + 2] = z;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

const LaneGuides: React.FC = () => {
    const { laneCount } = useStore();
    
    const separators = useMemo(() => {
        const lines: number[] = [];
        const startX = -(laneCount * LANE_WIDTH) / 2;
        
        for (let i = 0; i <= laneCount; i++) {
            lines.push(startX + (i * LANE_WIDTH));
        }
        return lines;
    }, [laneCount]);

    return (
        <group position={[0, 0.02, 0]}>
            {/* Lane Floor - Lowered slightly to -0.02 */}
            <mesh position={[0, -0.02, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[laneCount * LANE_WIDTH, 200]} />
                <meshBasicMaterial color="#1a0b2e" transparent opacity={0.9} />
            </mesh>

            {/* Lane Separators - Glowing Lines */}
            {separators.map((x, i) => (
                <mesh key={`sep-${i}`} position={[x, 0, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[0.05, 200]} /> 
                    <meshBasicMaterial 
                        color="#00ffff" 
                        transparent 
                        opacity={0.4} 
                    />
                </mesh>
            ))}
        </group>
    );
};

const RetroSun: React.FC = () => {
    const matRef = useRef<THREE.ShaderMaterial>(null);
    const sunGroupRef = useRef<THREE.Group>(null);
    const { status, isPhotosensitiveMode } = useStore();

    useFrame((state) => {
        if (status !== GameStatus.PLAYING) return;

        // Calculate beat pulse intensity (0 to 1)
        const bps = audio.tempo / 60;
        const beatProgress = (state.clock.elapsedTime * bps) % 1;
        const beatPulse = Math.pow(1.0 - beatProgress, 4.0); // Sharp peak, exponential decay
        
        // Dampen pulse in Safe Mode
        const finalIntensity = isPhotosensitiveMode ? beatPulse * 0.1 : beatPulse;

        if (matRef.current) {
            matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            matRef.current.uniforms.uPhotosensitive.value = isPhotosensitiveMode ? 1.0 : 0.0;
            matRef.current.uniforms.uIntensity.value = finalIntensity;
        }

        // Sun throbbing and bobbing
        if (sunGroupRef.current) {
            sunGroupRef.current.position.y = 30 + Math.sin(state.clock.elapsedTime * 0.2) * 1.0;
            sunGroupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
            
            // Subtle scale pulse
            const s = 1.0 + finalIntensity * 0.05;
            sunGroupRef.current.scale.set(s, s, s);
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uPhotosensitive: { value: 0.0 },
        uIntensity: { value: 0.0 },
        uColorTop: { value: new THREE.Color('#ffe600') }, // Bright Yellow
        uColorBottom: { value: new THREE.Color('#ff0077') } // Magenta/Pink
    }), []);

    return (
        <group ref={sunGroupRef} position={[0, 30, -180]}>
            <mesh>
                <sphereGeometry args={[35, 32, 32]} />
                <shaderMaterial
                    ref={matRef}
                    uniforms={uniforms}
                    transparent
                    vertexShader={`
                        varying vec2 vUv;

                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `}
                    fragmentShader={`
                        varying vec2 vUv;
                        uniform float uTime;
                        uniform float uPhotosensitive;
                        uniform float uIntensity;
                        uniform vec3 uColorTop;
                        uniform vec3 uColorBottom;

                        void main() {
                            // 1. Basic Vertical Gradient with intensity boost
                            vec3 baseColor = mix(uColorBottom, uColorTop, vUv.y);
                            vec3 color = baseColor + (uIntensity * baseColor * 0.4);
                            
                            if (uPhotosensitive > 0.5) {
                                gl_FragColor = vec4(color, 1.0);
                                return;
                            }

                            // 2. Synthwave Scanlines
                            float stripeFreq = 40.0;
                            float stripeSpeed = 1.0;
                            // Shift scanlines based on intensity for a more dynamic look
                            float stripes = sin((vUv.y * stripeFreq) - (uTime * stripeSpeed) + (uIntensity * 0.2));
                            
                            // Create sharp bands
                            float stripeMask = smoothstep(0.2, 0.3, stripes);
                            
                            // Fade scanlines out towards the top of the sun
                            float scanlineFade = smoothstep(0.7, 0.3, vUv.y); 
                            
                            // Apply dark bands (scanlines)
                            vec3 finalColor = mix(color, color * 0.1, (1.0 - stripeMask) * scanlineFade);

                            gl_FragColor = vec4(finalColor, 1.0);
                        }
                    `}
                />
            </mesh>
        </group>
    );
};

const MovingGrid: React.FC = () => {
    const speed = useStore(state => state.speed);
    const status = useStore(state => state.status);
    const isPhotosensitiveMode = useStore(state => state.isPhotosensitiveMode);
    const meshRef = useRef<THREE.Mesh>(null);
    const matRef = useRef<THREE.MeshBasicMaterial>(null);
    const offsetRef = useRef(0);
    
    useFrame((state, delta) => {
        if (meshRef.current && status === GameStatus.PLAYING) {
             const activeSpeed = speed > 0 ? speed : 5;
             offsetRef.current += activeSpeed * delta;
             
             // Grid cell size = 400 (length) / 40 (segments) = 10 units
             const cellSize = 10;
             
             // Move mesh forward (+Z) to simulate travel, then snap back
             const zPos = -100 + (offsetRef.current % cellSize);
             meshRef.current.position.z = zPos;

             // Grid Visualizer Pulse
             if (matRef.current) {
                const bps = audio.tempo / 60;
                const beatProgress = (state.clock.elapsedTime * bps) % 1;
                const beatPulse = Math.pow(1.0 - beatProgress, 6.0);
                const finalIntensity = isPhotosensitiveMode ? beatPulse * 0.05 : beatPulse;
                
                // Pulse the grid opacity and slightly brighten color
                matRef.current.opacity = 0.15 + finalIntensity * 0.25;
             }
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -100]}>
            <planeGeometry args={[300, 400, 30, 40]} />
            <meshBasicMaterial 
                ref={matRef}
                color="#8800ff" 
                wireframe 
                transparent 
                opacity={0.15} 
            />
        </mesh>
    );
};

export const Environment: React.FC = () => {
  return (
    <>
      <color attach="background" args={['#050011']} />
      <fog attach="fog" args={['#050011', 40, 160]} />
      
      <ambientLight intensity={0.2} color="#400080" />
      <directionalLight position={[0, 20, -10]} intensity={1.5} color="#00ffff" />
      <pointLight position={[0, 25, -150]} intensity={2} color="#ff00aa" distance={200} decay={2} />
      
      <DynamicSkybox />
      <StarField />
      <MovingGrid />
      <LaneGuides />
      
      <RetroSun />
    </>
  );
};
