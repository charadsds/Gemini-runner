import * as THREE from 'three';
import { GameObject, ObjectType } from '../../types';

const OBSTACLE_HEIGHT = 1.6;

export const checkShopPortalCollision = (
  obj: GameObject,
  playerPos: THREE.Vector3
): boolean => {
  const dz = Math.abs(obj.position[2] - playerPos.z);
  return dz < 2;
};

export const checkDamageCollision = (
  obj: GameObject,
  playerPos: THREE.Vector3,
  elapsedTime: number,
  level: number
): boolean => {
  const zThreshold = 2.0;
  const prevZ = obj.position[2];
  const inZZone = (prevZ < playerPos.z + zThreshold) && (obj.position[2] > playerPos.z - zThreshold);

  if (!inZZone) return false;

  const dx = Math.abs(obj.position[0] - playerPos.x);

  if (obj.type === ObjectType.OBSTACLE) {
    const objBottom = 0;
    const objTop = OBSTACLE_HEIGHT;
    const playerBottom = playerPos.y;
    const playerTop = playerPos.y + 1.8;
    return dx < 0.9 && playerBottom < objTop && playerTop > objBottom;
  }

  if (obj.type === ObjectType.MISSILE) {
    const objBottom = 0.5;
    const objTop = 1.5;
    const playerBottom = playerPos.y;
    const playerTop = playerPos.y + 1.8;
    return dx < 0.6 && playerBottom < objTop && playerTop > objBottom;
  }

  if (obj.type === ObjectType.ALIEN) {
    const objBottom = 1.0;
    const objTop = 2.5;
    const playerBottom = playerPos.y;
    const playerTop = playerPos.y + 1.8;
    return dx < 1.0 && playerBottom < objTop && playerTop > objBottom;
  }

  if (obj.type === ObjectType.PULSER) {
    const pulseScale = 1.0 + Math.sin(elapsedTime * 6) * 0.4;
    const pulseRadius = 1.1 * pulseScale;
    const distToPlayer = playerPos.distanceTo(new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]));
    return distToPlayer < pulseRadius;
  }

  if (obj.type === ObjectType.SPINNER) {
    const spinRotation = elapsedTime * (3.0 + level * 0.2);
    const isArmHorizontal = Math.abs(Math.cos(spinRotation)) > 0.8;
    const hitPole = dx < 0.3;
    let hitArms = false;
    if (isArmHorizontal && Math.abs(playerPos.y - obj.position[1]) < 0.4) {
      if (dx < 2.2) hitArms = true;
    }
    return hitPole || hitArms;
  }

  return false;
};

export const checkCollectionCollision = (
  obj: GameObject,
  playerPos: THREE.Vector3,
  hasMagnet: boolean
): boolean => {
  const dx = Math.abs(obj.position[0] - playerPos.x);
  const dy = Math.abs(obj.position[1] - playerPos.y);
  const collectionRadius = (hasMagnet || obj.type === ObjectType.POWERUP) ? 1.5 : 0.9;
  return dx < collectionRadius && dy < 2.5;
};
