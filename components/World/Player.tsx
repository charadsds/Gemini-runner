
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Physics Constants
const GRAVITY = 50;
const JUMP_FORCE = 16; 

// Static Geometries
const TORSO_GEO = new THREE.CylinderGeometry(0.25, 0.15, 0.6, 4);
const JETPACK_GEO = new THREE.BoxGeometry(0.3, 0.4, 0.15);
const GLOW_STRIP_GEO = new THREE.PlaneGeometry(0.05, 0.2);
const HEAD_GEO = new THREE.BoxGeometry(0.25, 0.3, 0.3);
const ARM_GEO = new THREE.BoxGeometry(0.12, 0.6, 0.12);
const JOINT_SPHERE_GEO = new THREE.SphereGeometry(0.07);
const HIPS_GEO = new THREE.CylinderGeometry(0.16, 0.16, 0.2);
const LEG_GEO = new THREE.BoxGeometry(0.15, 0.7, 0.15);
const SHADOW_GEO = new THREE.CircleGeometry(0.5, 32);

export const Player: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const { camera } = useThree();
  
  // Limb Refs for Animation
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const { status, laneCount, takeDamage, hasDoubleJump, activateImmortality, isImmortalityActive, isShieldActive, hasDash, activateDash, isDashActive, isSpeedBoosted, isTempInvincible } = useStore();
  
  const [lane, setLane] = useState(0);
  const targetX = useRef(0);
  const [flashIntensity, setFlashIntensity] = useState(0);
  
  const isJumping = useRef(false);
  const velocityY = useRef(0);
  const jumpsPerformed = useRef(0); 
  const spinRotation = useRef(0); 

  const isInvincible = useRef(false);
  const lastDamageTime = useRef(0);

  const { armorMaterial, jointMaterial, glowMaterial, shadowMaterial } = useMemo(() => {
      const isUltra = isImmortalityActive || isTempInvincible;
      const armorColor = isUltra ? '#ffd700' : (isDashActive || isSpeedBoosted ? '#00ffff' : '#00aaff');
      const glowColor = isUltra ? '#ffffff' : '#00ffff';
      
      return {
          armorMaterial: new THREE.MeshStandardMaterial({ color: armorColor, roughness: 0.3, metalness: 0.8 }),
          jointMaterial: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.7, metalness: 0.5 }),
          glowMaterial: new THREE.MeshBasicMaterial({ color: glowColor }),
          shadowMaterial: new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.3, transparent: true }),
      };
  }, [isImmortalityActive, isDashActive, isSpeedBoosted, isTempInvincible]);

  useEffect(() => {
      if (status === GameStatus.PLAYING) {
          isJumping.current = false;
          jumpsPerformed.current = 0;
          velocityY.current = 0;
          spinRotation.current = 0;
          if (groupRef.current) groupRef.current.position.y = 0;
          if (bodyRef.current) bodyRef.current.rotation.x = 0;
      }
  }, [status]);
  
  useEffect(() => {
      const maxLane = Math.floor(laneCount / 2);
      if (Math.abs(lane) > maxLane) {
          setLane(l => Math.max(Math.min(l, maxLane), -maxLane));
      }
  }, [laneCount, lane]);

  useEffect(() => {
      const onCollect = () => setFlashIntensity(1.5);
      window.addEventListener('item-collected', onCollect);
      return () => window.removeEventListener('item-collected', onCollect);
  }, []);

  const triggerJump = () => {
    const maxJumps = hasDoubleJump ? 2 : 1;
    if (!isJumping.current) {
        audio.playJump(false);
        isJumping.current = true;
        jumpsPerformed.current = 1;
        velocityY.current = JUMP_FORCE;
    } else if (jumpsPerformed.current < maxJumps) {
        audio.playJump(true);
        jumpsPerformed.current += 1;
        velocityY.current = JUMP_FORCE; 
        spinRotation.current = 0;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      const maxLane = Math.floor(laneCount / 2);
      if (e.key === 'ArrowLeft') setLane(l => Math.max(l - 1, -maxLane));
      else if (e.key === 'ArrowRight') setLane(l => Math.min(l + 1, maxLane));
      else if (e.key === 'ArrowUp' || e.key === 'w') triggerJump();
      else if (e.key === ' ' || e.key === 'Enter') activateImmortality();
      else if (e.key === 'Shift') activateDash();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, laneCount, hasDoubleJump, activateImmortality, activateDash]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (status !== GameStatus.PLAYING && status !== GameStatus.SHOP) return;

    // 1. Horizontal Position
    targetX.current = lane * LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX.current, delta * 15);

    // 2. Physics (Jump)
    if (isJumping.current) {
        groupRef.current.position.y += velocityY.current * delta;
        velocityY.current -= GRAVITY * delta;
        if (groupRef.current.position.y <= 0) {
            groupRef.current.position.y = 0;
            isJumping.current = false;
            jumpsPerformed.current = 0;
            velocityY.current = 0;
            if (bodyRef.current) bodyRef.current.rotation.x = 0;
        }
        if (jumpsPerformed.current === 2 && bodyRef.current) {
             spinRotation.current -= delta * 15;
             if (spinRotation.current < -Math.PI * 2) spinRotation.current = -Math.PI * 2;
             bodyRef.current.rotation.x = spinRotation.current;
        }
    }

    // Camera FX for Dash/Nitro
    const targetFov = (isDashActive || isSpeedBoosted) ? 85 : 60;
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 10);
    camera.updateProjectionMatrix();

    if (isDashActive || isSpeedBoosted) {
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, -3, delta * 5);
    } else {
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, delta * 5);
    }

    // 3. Animation
    const time = state.clock.elapsedTime * 25; 
    if (!isJumping.current) {
        const moveSpeed = (isDashActive || isSpeedBoosted) ? 2.5 : 1.0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time * moveSpeed) * 0.7;
        if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time * moveSpeed + Math.PI) * 0.7;
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * moveSpeed + Math.PI) * 1.0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time * moveSpeed) * 1.0;
        if (bodyRef.current) bodyRef.current.position.y = 1.1 + Math.abs(Math.sin(time * moveSpeed)) * 0.1;
    }

    // 4. Dynamic Effects
    if (flashIntensity > 0) setFlashIntensity(prev => Math.max(0, prev - delta * 6));
    if (lightRef.current) lightRef.current.intensity = flashIntensity * 10;

    const showFlicker = isInvincible.current;
    if (showFlicker) {
        groupRef.current.visible = Math.floor(Date.now() / 50) % 2 === 0;
        if (Date.now() - lastDamageTime.current > 1500) {
            isInvincible.current = false;
            groupRef.current.visible = true;
        }
    } else {
        groupRef.current.visible = true;
    }
  });

  useEffect(() => {
     const checkHit = (e: any) => {
        if (isInvincible.current || isImmortalityActive || isDashActive || isSpeedBoosted || isTempInvincible) return;
        audio.playDamage();
        takeDamage();
        isInvincible.current = true;
        lastDamageTime.current = Date.now();
     };
     window.addEventListener('player-hit', checkHit);
     return () => window.removeEventListener('player-hit', checkHit);
  }, [takeDamage, isImmortalityActive, isDashActive, isSpeedBoosted, isTempInvincible]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <pointLight ref={lightRef} position={[0, 1.5, 0.5]} color="#00ffff" distance={5} decay={2} intensity={0} />
      
      {(isShieldActive || isTempInvincible) && (
          <mesh position={[0, 1.2, 0]}>
              <sphereGeometry args={[1.3, 16, 16]} />
              <meshBasicMaterial color={isTempInvincible ? "#ffffff" : "#aa00ff"} wireframe transparent opacity={0.3} />
          </mesh>
      )}

      {isSpeedBoosted && (
          <mesh position={[0, 1.1, -0.5]}>
              <boxGeometry args={[1.0, 2.0, 4.0]} />
              <meshBasicMaterial color="#00ffff" transparent opacity={0.1} />
          </mesh>
      )}

      <group ref={bodyRef} position={[0, 1.1, 0]}> 
        <mesh castShadow position={[0, 0.2, 0]} geometry={TORSO_GEO} material={armorMaterial} />
        <mesh position={[0, 0.2, -0.2]} geometry={JETPACK_GEO} material={jointMaterial} />
        <mesh position={[-0.08, 0.1, -0.28]} geometry={GLOW_STRIP_GEO} material={glowMaterial} scale={[1, 1 + flashIntensity, 1]} />
        <mesh position={[0.08, 0.1, -0.28]} geometry={GLOW_STRIP_GEO} material={glowMaterial} scale={[1, 1 + flashIntensity, 1]} />
        <group ref={headRef} position={[0, 0.6, 0]}>
            <mesh castShadow geometry={HEAD_GEO} material={armorMaterial} />
        </group>
        <group position={[0.32, 0.4, 0]} ref={rightArmRef}>
            <mesh position={[0, -0.25, 0]} castShadow geometry={ARM_GEO} material={armorMaterial} />
            <mesh position={[0, -0.55, 0]} geometry={JOINT_SPHERE_GEO} material={glowMaterial} />
        </group>
        <group position={[-0.32, 0.4, 0]} ref={leftArmRef}>
             <mesh position={[0, -0.25, 0]} castShadow geometry={ARM_GEO} material={armorMaterial} />
             <mesh position={[0, -0.55, 0]} geometry={JOINT_SPHERE_GEO} material={glowMaterial} />
        </group>
        <mesh position={[0, -0.15, 0]} geometry={HIPS_GEO} material={jointMaterial} />
        <group position={[0.12, -0.25, 0]} ref={rightLegRef}>
             <mesh position={[0, -0.35, 0]} castShadow geometry={LEG_GEO} material={armorMaterial} />
        </group>
        <group position={[-0.12, -0.25, 0]} ref={leftLegRef}>
             <mesh position={[0, -0.35, 0]} castShadow geometry={LEG_GEO} material={armorMaterial} />
        </group>
      </group>
      
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHADOW_GEO} material={shadowMaterial} />
    </group>
  );
};
