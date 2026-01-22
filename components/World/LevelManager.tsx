
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, GEMINI_COLORS, PowerUpType } from '../../types';
import { audio } from '../System/Audio';

// Geometry Constants
const OBSTACLE_HEIGHT = 1.6;
const OBSTACLE_GEOMETRY = new THREE.ConeGeometry(0.9, OBSTACLE_HEIGHT, 6);
const OBSTACLE_GLOW_GEO = new THREE.ConeGeometry(0.9, OBSTACLE_HEIGHT, 6);
const OBSTACLE_RING_GEO = new THREE.RingGeometry(0.6, 0.9, 6);

const GEM_GEOMETRY = new THREE.IcosahedronGeometry(0.3, 0);

// Alien Geometries
const ALIEN_BODY_GEO = new THREE.CylinderGeometry(0.6, 0.3, 0.3, 8);
const ALIEN_DOME_GEO = new THREE.SphereGeometry(0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
const ALIEN_EYE_GEO = new THREE.SphereGeometry(0.1);

// Missile Geometries
const MISSILE_CORE_GEO = new THREE.CylinderGeometry(0.08, 0.08, 3.0, 8);
const MISSILE_RING_GEO = new THREE.TorusGeometry(0.15, 0.02, 16, 32);

// New Obstacle Geometries
const SPINNER_POLE_GEO = new THREE.CylinderGeometry(0.15, 0.15, 3.0, 8);
const SPINNER_ARM_GEO = new THREE.BoxGeometry(4.0, 0.1, 0.1);
const PULSER_CORE_GEO = new THREE.OctahedronGeometry(0.5);
const PULSER_FIELD_GEO = new THREE.SphereGeometry(1, 16, 16);

// Powerup Geometries
const POWERUP_BASE_GEO = new THREE.SphereGeometry(0.6, 16, 16);
const SPEED_ICON_GEO = new THREE.TorusKnotGeometry(0.3, 0.08, 64, 8);
const FRENZY_ICON_GEO = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
const SHIELD_ICON_GEO = new THREE.OctahedronGeometry(0.4, 0);

// Shadow Geometries
const SHADOW_LETTER_GEO = new THREE.PlaneGeometry(2, 0.6);
const SHADOW_GEM_GEO = new THREE.CircleGeometry(0.6, 32);
const SHADOW_ALIEN_GEO = new THREE.CircleGeometry(0.8, 32);
const SHADOW_MISSILE_GEO = new THREE.PlaneGeometry(0.15, 3);
const SHADOW_DEFAULT_GEO = new THREE.CircleGeometry(0.8, 6);

// Shop Geometries
const SHOP_FRAME_GEO = new THREE.BoxGeometry(1, 7, 1);
const SHOP_BACK_GEO = new THREE.BoxGeometry(1, 5, 1.2);
const SHOP_OUTLINE_GEO = new THREE.BoxGeometry(1, 7.2, 0.8);
const SHOP_FLOOR_GEO = new THREE.PlaneGeometry(1, 4);

const PARTICLE_COUNT = 800; 
const BASE_LETTER_INTERVAL = 150; 

const getLetterInterval = (level: number) => {
    return BASE_LETTER_INTERVAL * Math.pow(1.3, Math.max(0, level - 1));
};

const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

// --- Particle System ---
const ParticleSystem: React.FC = () => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => new Array(PARTICLE_COUNT).fill(0).map(() => ({
        life: 0,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        rotVel: new THREE.Vector3(),
        color: new THREE.Color(),
        baseScale: 0.2
    })), []);

    useEffect(() => {
        const handleExplosion = (e: CustomEvent) => {
            const { position, color, isHit } = e.detail;
            let spawned = 0;
            const burstAmount = isHit ? 30 : 50; 

            for(let i = 0; i < PARTICLE_COUNT; i++) {
                const p = particles[i];
                if (p.life <= 0) {
                    p.life = 0.8 + Math.random() * 0.4; 
                    p.pos.set(position[0], position[1], position[2]);
                    
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = isHit ? (1 + Math.random() * 5) : (5 + Math.random() * 12);
                    
                    p.vel.set(
                        Math.sin(phi) * Math.cos(theta),
                        Math.sin(phi) * Math.sin(theta),
                        Math.cos(phi)
                    ).multiplyScalar(speed);

                    p.rot.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                    p.rotVel.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(10);
                    
                    const col = new THREE.Color(color);
                    p.color.set(col).multiplyScalar(1.5); 
                    p.baseScale = isHit ? 0.15 : 0.25;
                    
                    spawned++;
                    if (spawned >= burstAmount) break;
                }
            }
        };
        
        window.addEventListener('particle-burst', handleExplosion as any);
        return () => window.removeEventListener('particle-burst', handleExplosion as any);
    }, [particles]);

    useFrame((state, delta) => {
        if (!mesh.current) return;
        const safeDelta = Math.min(delta, 0.1);

        particles.forEach((p, i) => {
            if (p.life > 0) {
                p.life -= safeDelta * 2.0; 
                p.pos.addScaledVector(p.vel, safeDelta);
                p.vel.y -= safeDelta * 4; 
                p.vel.multiplyScalar(0.96);

                p.rot.x += p.rotVel.x * safeDelta;
                p.rot.y += p.rotVel.y * safeDelta;
                
                dummy.position.copy(p.pos);
                const scale = Math.max(0, p.life * p.baseScale);
                dummy.scale.set(scale, scale, scale);
                
                dummy.rotation.set(p.rot.x, p.rot.y, p.rot.z);
                dummy.updateMatrix();
                
                mesh.current!.setMatrixAt(i, dummy.matrix);
                mesh.current!.setColorAt(i, p.color);
            } else {
                dummy.scale.set(0,0,0);
                dummy.updateMatrix();
                mesh.current!.setMatrixAt(i, dummy.matrix);
            }
        });
        
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, PARTICLE_COUNT]}>
            <octahedronGeometry args={[1, 0]} />
            <meshBasicMaterial toneMapped={false} transparent opacity={1.0} />
        </instancedMesh>
    );
};


const getRandomLane = (laneCount: number) => {
    const max = Math.floor(laneCount / 2);
    return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const LevelManager: React.FC = () => {
  const { 
    status, 
    speed, 
    collectGem, 
    collectLetter, 
    collectedLetters,
    laneCount,
    setDistance,
    openShop,
    level,
    hasMagnet,
    activatePowerUp,
    updatePowerUps,
    isSpeedBoosted
  } = useStore();
  
  const objectsRef = useRef<GameObject[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const prevStatus = useRef(status);
  const prevLevel = useRef(level);

  const playerObjRef = useRef<THREE.Object3D | null>(null);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(BASE_LETTER_INTERVAL);

  useEffect(() => {
    const isRestart = status === GameStatus.PLAYING && prevStatus.current === GameStatus.GAME_OVER;
    const isMenuReset = status === GameStatus.MENU;
    const isLevelUp = level !== prevLevel.current && status === GameStatus.PLAYING;
    const isVictoryReset = status === GameStatus.PLAYING && prevStatus.current === GameStatus.VICTORY;

    if (isMenuReset || isRestart || isVictoryReset) {
        objectsRef.current = [];
        setRenderTrigger(t => t + 1);
        distanceTraveled.current = 0;
        nextLetterDistance.current = getLetterInterval(1);
    } else if (isLevelUp && level > 1) {
        objectsRef.current = objectsRef.current.filter(obj => obj.position[2] > -80);
        objectsRef.current.push({
            id: uuidv4(),
            type: ObjectType.SHOP_PORTAL,
            position: [0, 0, -100], 
            active: true,
        });
        nextLetterDistance.current = distanceTraveled.current - SPAWN_DISTANCE + getLetterInterval(level);
        setRenderTrigger(t => t + 1);
    } else if (status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        setDistance(Math.floor(distanceTraveled.current));
    }
    prevStatus.current = status;
    prevLevel.current = level;
  }, [status, level, setDistance]);

  useFrame((state) => {
      if (!playerObjRef.current) {
          const group = state.scene.getObjectByName('PlayerGroup');
          if (group && group.children.length > 0) {
              playerObjRef.current = group.children[0];
          }
      }
  });

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;

    const safeDelta = Math.min(delta, 0.05); 
    const effectiveSpeed = isSpeedBoosted ? speed * 1.5 : speed;
    const dist = effectiveSpeed * safeDelta;
    
    distanceTraveled.current += dist;
    updatePowerUps(safeDelta);

    let hasChanges = false;
    let playerPos = new THREE.Vector3(0, 0, 0);
    if (playerObjRef.current) playerObjRef.current.getWorldPosition(playerPos);

    const currentObjects = objectsRef.current;
    const keptObjects: GameObject[] = [];
    const newSpawns: GameObject[] = [];

    const missileSpeed = 30 + (level * 2.5);

    for (const obj of currentObjects) {
        let moveAmount = dist;
        if (obj.type === ObjectType.MISSILE) moveAmount += missileSpeed * safeDelta;

        // Magnet Logic
        if (hasMagnet && (obj.type === ObjectType.GEM || obj.type === ObjectType.LETTER || obj.type === ObjectType.POWERUP)) {
            const dx = obj.position[0] - playerPos.x;
            const dz = obj.position[2] - playerPos.z;
            const horizontalDist = Math.sqrt(dx*dx + dz*dz);
            if (horizontalDist < 12) {
                obj.position[0] = THREE.MathUtils.lerp(obj.position[0], playerPos.x, delta * 8);
                obj.position[1] = THREE.MathUtils.lerp(obj.position[1], playerPos.y + 0.5, delta * 8);
                obj.position[2] = THREE.MathUtils.lerp(obj.position[2], playerPos.z, delta * 8);
            }
        }

        const prevZ = obj.position[2];
        obj.position[2] += moveAmount;
        
        if (obj.type === ObjectType.ALIEN && obj.active && !obj.hasFired) {
             if (obj.position[2] > -90) {
                 obj.hasFired = true;
                 newSpawns.push({
                     id: uuidv4(),
                     type: ObjectType.MISSILE,
                     position: [obj.position[0], 1.0, obj.position[2] + 2], 
                     active: true,
                     color: '#ff0000'
                 });
                 hasChanges = true;
                 window.dispatchEvent(new CustomEvent('particle-burst', { 
                    detail: { position: obj.position, color: '#ff00ff' } 
                 }));
             }
        }

        let keep = true;
        if (obj.active) {
            const zThreshold = 2.0; 
            const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);
            
            if (obj.type === ObjectType.SHOP_PORTAL) {
                const dz = Math.abs(obj.position[2] - playerPos.z);
                if (dz < 2) { 
                     openShop();
                     obj.active = false;
                     hasChanges = true;
                     keep = false; 
                }
            } else if (inZZone) {
                const dx = Math.abs(obj.position[0] - playerPos.x);
                
                const isDamageSource = 
                    obj.type === ObjectType.OBSTACLE || 
                    obj.type === ObjectType.ALIEN || 
                    obj.type === ObjectType.MISSILE ||
                    obj.type === ObjectType.SPINNER ||
                    obj.type === ObjectType.PULSER;
                     
                if (isDamageSource) {
                    const playerBottom = playerPos.y;
                    const playerTop = playerPos.y + 1.8;
                    let objBottom = obj.position[1] - 0.5;
                    let objTop = obj.position[1] + 0.5;
                    let isHit = false;

                    if (obj.type === ObjectType.OBSTACLE) {
                        objBottom = 0;
                        objTop = OBSTACLE_HEIGHT;
                        isHit = (dx < 0.9) && (playerBottom < objTop) && (playerTop > objBottom);
                    } else if (obj.type === ObjectType.MISSILE) {
                        objBottom = 0.5;
                        objTop = 1.5;
                        isHit = (dx < 0.6) && (playerBottom < objTop) && (playerTop > objBottom);
                    } else if (obj.type === ObjectType.ALIEN) {
                        objBottom = 1.0;
                        objTop = 2.5;
                        isHit = (dx < 1.0) && (playerBottom < objTop) && (playerTop > objBottom);
                    } else if (obj.type === ObjectType.PULSER) {
                        const pulseScale = 1.0 + Math.sin(state.clock.elapsedTime * 6) * 0.4;
                        const pulseRadius = 1.1 * pulseScale;
                        const distToPlayer = playerPos.distanceTo(new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]));
                        isHit = distToPlayer < pulseRadius;
                    } else if (obj.type === ObjectType.SPINNER) {
                        const spinRotation = state.clock.elapsedTime * (3.0 + level * 0.2);
                        const isArmHorizontal = Math.abs(Math.cos(spinRotation)) > 0.8;
                        const hitPole = dx < 0.3;
                        let hitArms = false;
                        if (isArmHorizontal && Math.abs(playerPos.y - obj.position[1]) < 0.4) {
                            if (dx < 2.2) hitArms = true;
                        }
                        isHit = hitPole || hitArms;
                    }

                    if (isHit) { 
                        window.dispatchEvent(new Event('player-hit'));
                        obj.active = false; 
                        hasChanges = true;
                        window.dispatchEvent(new CustomEvent('particle-burst', { 
                            detail: { position: obj.position, color: '#ff4400', isHit: true } 
                        }));
                    }
                } else {
                    const dy = Math.abs(obj.position[1] - playerPos.y);
                    const collectionRadius = (hasMagnet || obj.type === ObjectType.POWERUP) ? 1.5 : 0.9;
                    if (dx < collectionRadius && dy < 2.5) { 
                        if (obj.type === ObjectType.GEM) {
                            collectGem(obj.points || 50);
                            audio.playGemCollect();
                        } else if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                            collectLetter(obj.targetIndex);
                            audio.playLetterCollect();
                        } else if (obj.type === ObjectType.POWERUP && obj.powerUpType) {
                            activatePowerUp(obj.powerUpType);
                            audio.playLetterCollect(); // Reuse sound for now
                        }
                        
                        window.dispatchEvent(new Event('item-collected'));
                        window.dispatchEvent(new CustomEvent('particle-burst', { 
                            detail: { 
                                position: obj.position, 
                                color: obj.color || '#ffffff' 
                            } 
                        }));

                        obj.active = false;
                        hasChanges = true;
                    }
                }
            }
        }

        if (obj.position[2] > REMOVE_DISTANCE) {
            keep = false;
            hasChanges = true;
        }

        if (keep) keptObjects.push(obj);
    }

    if (newSpawns.length > 0) keptObjects.push(...newSpawns);

    let furthestZ = 0;
    const staticObjects = keptObjects.filter(o => o.type !== ObjectType.MISSILE);
    if (staticObjects.length > 0) furthestZ = Math.min(...staticObjects.map(o => o.position[2]));
    else furthestZ = -20;

    if (furthestZ > -SPAWN_DISTANCE) {
         const minGap = 10 + (speed * 0.35); 
         const spawnZ = Math.min(furthestZ - minGap, -SPAWN_DISTANCE);
         const isLetterDue = distanceTraveled.current >= nextLetterDistance.current;

         if (isLetterDue) {
             const lane = getRandomLane(laneCount);
             const target = ['G','E','M','I','N','I'];
             const availableIndices = target.map((_, i) => i).filter(i => !collectedLetters.includes(i));

             if (availableIndices.length > 0) {
                 const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                 const val = target[chosenIndex];
                 const color = GEMINI_COLORS[chosenIndex];
                 keptObjects.push({
                    id: uuidv4(),
                    type: ObjectType.LETTER,
                    position: [lane * LANE_WIDTH, 1.0, spawnZ], 
                    active: true,
                    color: color,
                    value: val,
                    targetIndex: chosenIndex
                 });
                 nextLetterDistance.current += getLetterInterval(level);
                 hasChanges = true;
             }
         } else if (Math.random() > 0.08) { 
            const spawnTypeRoll = Math.random();
            const lane = getRandomLane(laneCount);

            if (spawnTypeRoll < 0.6) {
                const advancedRoll = Math.random();
                if (level >= 6 && advancedRoll < 0.3) {
                    keptObjects.push({ id: uuidv4(), type: ObjectType.SPINNER, position: [lane * LANE_WIDTH, 1.5, spawnZ], active: true, color: '#00ffff' });
                } else if (level >= 3 && advancedRoll < 0.6) {
                    keptObjects.push({ id: uuidv4(), type: ObjectType.PULSER, position: [lane * LANE_WIDTH, 1.5, spawnZ], active: true, color: '#aa00ff' });
                } else {
                    keptObjects.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [lane * LANE_WIDTH, OBSTACLE_HEIGHT / 2, spawnZ], active: true, color: '#ff0054' });
                }
            } else {
                // Chance to spawn power-up instead of gem
                const powerUpRoll = Math.random();
                if (powerUpRoll < 0.03) {
                    const puTypes = [PowerUpType.SPEED, PowerUpType.FRENZY, PowerUpType.SHIELD];
                    const chosenType = puTypes[Math.floor(Math.random() * puTypes.length)];
                    const puColor = chosenType === PowerUpType.SPEED ? '#00ffff' : (chosenType === PowerUpType.FRENZY ? '#ffcc00' : '#ffffff');
                    
                    keptObjects.push({
                        id: uuidv4(),
                        type: ObjectType.POWERUP,
                        powerUpType: chosenType,
                        position: [lane * LANE_WIDTH, 1.5, spawnZ],
                        active: true,
                        color: puColor
                    });
                } else {
                    keptObjects.push({ id: uuidv4(), type: ObjectType.GEM, position: [lane * LANE_WIDTH, 1.2, spawnZ], active: true, color: '#00ffff', points: 50 });
                }
            }
            hasChanges = true;
         }
    }

    if (hasChanges) {
        objectsRef.current = keptObjects;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      <ParticleSystem />
      {objectsRef.current.map(obj => {
        if (!obj.active) return null;
        return <GameEntity key={obj.id} data={obj} />;
      })}
    </group>
  );
};

const GameEntity: React.FC<{ data: GameObject }> = React.memo(({ data }) => {
    const groupRef = useRef<THREE.Group>(null);
    const visualRef = useRef<THREE.Group>(null);
    const shadowRef = useRef<THREE.Mesh>(null);
    const iconRef = useRef<THREE.Group>(null);
    const { laneCount, level } = useStore();
    
    useFrame((state, delta) => {
        if (groupRef.current) groupRef.current.position.set(data.position[0], 0, data.position[2]);
        if (visualRef.current) {
            const baseHeight = data.position[1];
            if (data.type === ObjectType.SHOP_PORTAL) {
                 visualRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.02);
            } else if (data.type === ObjectType.MISSILE) {
                 visualRef.current.rotation.z += delta * 20; 
                 visualRef.current.position.y = baseHeight;
            } else if (data.type === ObjectType.ALIEN) {
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 3) * 0.2;
                 visualRef.current.rotation.y += delta;
            } else if (data.type === ObjectType.SPINNER) {
                 visualRef.current.rotation.y = state.clock.elapsedTime * (3.0 + level * 0.2);
            } else if (data.type === ObjectType.PULSER) {
                 const s = 1.0 + Math.sin(state.clock.elapsedTime * 6) * 0.4;
                 visualRef.current.scale.set(s, s, s);
                 visualRef.current.rotation.x += delta * 2;
                 visualRef.current.rotation.z += delta * 3;
            } else if (data.type === ObjectType.POWERUP) {
                 visualRef.current.rotation.y += delta * 2;
                 visualRef.current.position.y = baseHeight + Math.sin(state.clock.elapsedTime * 5) * 0.2;
                 if (iconRef.current) {
                     iconRef.current.rotation.y -= delta * 4;
                 }
            } else if (data.type !== ObjectType.OBSTACLE) {
                visualRef.current.rotation.y += delta * 3;
                const bobOffset = Math.sin(state.clock.elapsedTime * 4 + data.position[0]) * 0.1;
                visualRef.current.position.y = baseHeight + bobOffset;
                if (shadowRef.current) {
                    const shadowScale = 1 - bobOffset; 
                    shadowRef.current.scale.setScalar(shadowScale);
                }
            } else {
                visualRef.current.position.y = baseHeight;
            }
        }
    });

    const shadowGeo = useMemo(() => {
        if (data.type === ObjectType.LETTER) return SHADOW_LETTER_GEO;
        if (data.type === ObjectType.GEM) return SHADOW_GEM_GEO;
        if (data.type === ObjectType.SHOP_PORTAL) return null;
        if (data.type === ObjectType.ALIEN) return SHADOW_ALIEN_GEO;
        if (data.type === ObjectType.MISSILE) return SHADOW_MISSILE_GEO;
        return SHADOW_DEFAULT_GEO; 
    }, [data.type]);

    return (
        <group ref={groupRef} position={[data.position[0], 0, data.position[2]]}>
            {data.type !== ObjectType.SHOP_PORTAL && shadowGeo && (
                <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} geometry={shadowGeo}>
                    <meshBasicMaterial color="#000000" opacity={0.3} transparent />
                </mesh>
            )}

            <group ref={visualRef} position={[0, data.position[1], 0]}>
                {data.type === ObjectType.POWERUP && (
                    <group>
                        <mesh geometry={POWERUP_BASE_GEO}>
                             <meshBasicMaterial color={data.color} transparent opacity={0.2} wireframe />
                        </mesh>
                        <group ref={iconRef}>
                            {data.powerUpType === PowerUpType.SPEED && (
                                <mesh geometry={SPEED_ICON_GEO}>
                                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={3} />
                                </mesh>
                            )}
                            {data.powerUpType === PowerUpType.FRENZY && (
                                <Center>
                                    <Text3D font={FONT_URL} size={0.6} height={0.2}>
                                        x3
                                        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={3} />
                                    </Text3D>
                                </Center>
                            )}
                            {data.powerUpType === PowerUpType.SHIELD && (
                                <mesh geometry={SHIELD_ICON_GEO}>
                                    <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
                                </mesh>
                            )}
                        </group>
                    </group>
                )}

                {data.type === ObjectType.SHOP_PORTAL && (
                    <group>
                         <mesh position={[0, 3, 0]} geometry={SHOP_FRAME_GEO} scale={[laneCount * LANE_WIDTH + 2, 1, 1]}>
                             <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
                         </mesh>
                         <mesh position={[0, 2, 0]} geometry={SHOP_BACK_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                              <meshBasicMaterial color="#000000" />
                         </mesh>
                         <mesh position={[0, 3, 0]} geometry={SHOP_OUTLINE_GEO} scale={[laneCount * LANE_WIDTH + 2.2, 1, 1]}>
                             <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.3} />
                         </mesh>
                         <Center position={[0, 5, 0.6]}>
                             <Text3D font={FONT_URL} size={1.2} height={0.2}>
                                 CYBER SHOP
                                 <meshBasicMaterial color="#ffff00" />
                             </Text3D>
                         </Center>
                         <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHOP_FLOOR_GEO} scale={[laneCount * LANE_WIDTH, 1, 1]}>
                             <meshBasicMaterial color="#00ffff" transparent opacity={0.3} />
                         </mesh>
                    </group>
                )}

                {data.type === ObjectType.SPINNER && (
                    <group>
                        <mesh geometry={SPINNER_POLE_GEO}>
                             <meshStandardMaterial color="#222222" metalness={0.9} roughness={0.1} />
                        </mesh>
                        <mesh position={[0, 0, 0]} geometry={SPINNER_ARM_GEO}>
                             <meshBasicMaterial color="#00ffff" />
                        </mesh>
                        <mesh position={[0, 0.5, 0]} geometry={SPINNER_ARM_GEO} rotation={[0, Math.PI/2, 0]}>
                             <meshBasicMaterial color="#00ffff" />
                        </mesh>
                    </group>
                )}

                {data.type === ObjectType.PULSER && (
                    <group>
                        <mesh geometry={PULSER_CORE_GEO}>
                             <meshStandardMaterial color="#aa00ff" emissive="#aa00ff" emissiveIntensity={2} />
                        </mesh>
                        <mesh geometry={PULSER_FIELD_GEO}>
                             <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.2} />
                        </mesh>
                    </group>
                )}

                {data.type === ObjectType.OBSTACLE && (
                    <group>
                        <mesh geometry={OBSTACLE_GEOMETRY} castShadow receiveShadow>
                             <meshStandardMaterial color="#330011" roughness={0.3} metalness={0.8} flatShading={true} />
                        </mesh>
                        <mesh scale={[1.02, 1.02, 1.02]} geometry={OBSTACLE_GLOW_GEO}>
                             <meshBasicMaterial color={data.color} wireframe transparent opacity={0.3} />
                        </mesh>
                         <mesh position={[0, -OBSTACLE_HEIGHT/2 + 0.05, 0]} rotation={[-Math.PI/2,0,0]} geometry={OBSTACLE_RING_GEO}>
                             <meshBasicMaterial color={data.color} transparent opacity={0.4} side={THREE.DoubleSide} />
                         </mesh>
                    </group>
                )}

                {data.type === ObjectType.ALIEN && (
                    <group>
                        <mesh castShadow geometry={ALIEN_BODY_GEO}>
                            <meshStandardMaterial color="#4400cc" metalness={0.8} roughness={0.2} />
                        </mesh>
                        <mesh position={[0, 0.2, 0]} geometry={ALIEN_DOME_GEO}>
                            <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} transparent opacity={0.8} />
                        </mesh>
                        <mesh position={[0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO}>
                             <meshBasicMaterial color="#ff00ff" />
                        </mesh>
                        <mesh position={[-0.3, 0, 0.3]} geometry={ALIEN_EYE_GEO}>
                             <meshBasicMaterial color="#ff00ff" />
                        </mesh>
                    </group>
                )}

                {data.type === ObjectType.MISSILE && (
                    <group rotation={[Math.PI / 2, 0, 0]}>
                        <mesh geometry={MISSILE_CORE_GEO}>
                            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} />
                        </mesh>
                        <mesh position={[0, 1.0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                        <mesh position={[0, 0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                        <mesh position={[0, -1.0, 0]} geometry={MISSILE_RING_GEO}>
                            <meshBasicMaterial color="#ffff00" />
                        </mesh>
                    </group>
                )}

                {data.type === ObjectType.GEM && (
                    <mesh castShadow geometry={GEM_GEOMETRY}>
                        <meshStandardMaterial color={data.color} roughness={0} metalness={1} emissive={data.color} emissiveIntensity={2} />
                    </mesh>
                )}

                {data.type === ObjectType.LETTER && (
                    <group scale={[1.5, 1.5, 1.5]}>
                         <Center>
                             <Text3D font={FONT_URL} size={0.8} height={0.5} bevelEnabled bevelThickness={0.02} bevelSize={0.02} bevelSegments={5} >
                                {data.value}
                                <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={1.5} />
                             </Text3D>
                         </Center>
                    </group>
                )}
            </group>
        </group>
    );
});
