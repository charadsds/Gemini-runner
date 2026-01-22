import { v4 as uuidv4 } from 'uuid';
import { GameObject, ObjectType, LANE_WIDTH, PowerUpType, GEMINI_COLORS } from '../../types';

const BASE_LETTER_INTERVAL = 150;

export const getLetterInterval = (level: number) => {
  return BASE_LETTER_INTERVAL * Math.pow(1.3, Math.max(0, level - 1));
};

export const getRandomLane = (laneCount: number) => {
  const max = Math.floor(laneCount / 2);
  return Math.floor(Math.random() * (max * 2 + 1)) - max;
};

export const spawnLetter = (
  laneCount: number,
  level: number,
  collectedLetters: number[],
  spawnZ: number
): GameObject | null => {
  const lane = getRandomLane(laneCount);
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];
  const availableIndices = target.map((_, i) => i).filter(i => !collectedLetters.includes(i));

  if (availableIndices.length > 0) {
    const chosenIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const val = target[chosenIndex];
    const color = GEMINI_COLORS[chosenIndex];
    return {
      id: uuidv4(),
      type: ObjectType.LETTER,
      position: [lane * LANE_WIDTH, 1.0, spawnZ],
      active: true,
      color: color,
      value: val,
      targetIndex: chosenIndex
    };
  }
  return null;
};

export const spawnRandomObstacle = (
  laneCount: number,
  level: number,
  spawnZ: number
): GameObject => {
  const spawnTypeRoll = Math.random();
  const lane = getRandomLane(laneCount);

  if (spawnTypeRoll < 0.6) {
    const advancedRoll = Math.random();
    if (level >= 6 && advancedRoll < 0.3) {
      return {
        id: uuidv4(),
        type: ObjectType.SPINNER,
        position: [lane * LANE_WIDTH, 1.5, spawnZ],
        active: true,
        color: '#00ffff'
      };
    } else if (level >= 3 && advancedRoll < 0.6) {
      return {
        id: uuidv4(),
        type: ObjectType.PULSER,
        position: [lane * LANE_WIDTH, 1.5, spawnZ],
        active: true,
        color: '#aa00ff'
      };
    } else {
      return {
        id: uuidv4(),
        type: ObjectType.OBSTACLE,
        position: [lane * LANE_WIDTH, 0.8, spawnZ],
        active: true,
        color: '#ff0054'
      };
    }
  } else {
    const powerUpRoll = Math.random();
    if (powerUpRoll < 0.03) {
      const puTypes = [PowerUpType.SPEED, PowerUpType.FRENZY, PowerUpType.SHIELD];
      const chosenType = puTypes[Math.floor(Math.random() * puTypes.length)];
      const puColor = chosenType === PowerUpType.SPEED ? '#00ffff' : (chosenType === PowerUpType.FRENZY ? '#ffcc00' : '#ffffff');

      return {
        id: uuidv4(),
        type: ObjectType.POWERUP,
        powerUpType: chosenType,
        position: [lane * LANE_WIDTH, 1.5, spawnZ],
        active: true,
        color: puColor
      };
    } else {
      return {
        id: uuidv4(),
        type: ObjectType.GEM,
        position: [lane * LANE_WIDTH, 1.2, spawnZ],
        active: true,
        color: '#00ffff',
        points: 50
      };
    }
  }
};
