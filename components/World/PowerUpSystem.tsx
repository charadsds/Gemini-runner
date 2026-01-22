import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { PowerUpType } from '../../types';

const POWERUP_BASE_GEO = new THREE.SphereGeometry(0.6, 16, 16);
const SPEED_ICON_GEO = new THREE.TorusKnotGeometry(0.3, 0.08, 64, 8);
const FRENZY_ICON_GEO = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
const SHIELD_ICON_GEO = new THREE.OctahedronGeometry(0.4, 0);

const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

interface PowerUpProps {
  position: [number, number, number];
  powerUpType: PowerUpType;
  color: string;
}

export const PowerUp: React.FC<PowerUpProps> = ({ position, powerUpType, color }) => {
  const groupRef = useRef<THREE.Group>(null);
  const iconRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 2;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 5) * 0.2;
    }
    if (iconRef.current) {
      iconRef.current.rotation.y -= delta * 4;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={POWERUP_BASE_GEO}>
        <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
      </mesh>
      <group ref={iconRef}>
        {powerUpType === PowerUpType.SPEED && (
          <mesh geometry={SPEED_ICON_GEO}>
            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} />
          </mesh>
        )}
        {powerUpType === PowerUpType.FRENZY && (
          <Center>
            <Text3D font={FONT_URL} size={0.6} height={0.2}>
              x3
              <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} />
            </Text3D>
          </Center>
        )}
        {powerUpType === PowerUpType.SHIELD && (
          <mesh geometry={SHIELD_ICON_GEO}>
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
          </mesh>
        )}
      </group>
    </group>
  );
};
