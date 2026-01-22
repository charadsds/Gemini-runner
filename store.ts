
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, PowerUpType } from './types';

interface PowerUpState {
  type: PowerUpType;
  timeLeft: number;
}

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  level: number;
  laneCount: number;
  gemsCollected: number;
  distance: number;
  
  // Inventory / Abilities
  hasDoubleJump: boolean;
  hasImmortality: boolean;
  isImmortalityActive: boolean;
  
  // New Abilities
  hasMagnet: boolean;
  hasShield: boolean;
  isShieldActive: boolean;
  scoreMultiplier: number;
  hasDash: boolean;
  isDashActive: boolean;

  // Level Power-ups
  activePowerUps: PowerUpState[];
  isSpeedBoosted: boolean;
  isFrenzyActive: boolean;
  isTempInvincible: boolean;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  takeDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  
  // Shop / Abilities
  buyItem: (type: string, cost: number) => boolean;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
  activateDash: () => void;
  rechargeShield: () => void;

  // Power-up Actions
  activatePowerUp: (type: PowerUpType) => void;
  updatePowerUps: (delta: number) => void;
}

const GEMINI_TARGET = ['G', 'E', 'M', 'I', 'N', 'I'];
const MAX_LEVEL = 10;

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  level: 1,
  laneCount: 3,
  gemsCollected: 0,
  distance: 0,
  
  hasDoubleJump: false,
  hasImmortality: false,
  isImmortalityActive: false,
  hasMagnet: false,
  hasShield: false,
  isShieldActive: false,
  scoreMultiplier: 1,
  hasDash: false,
  isDashActive: false,

  activePowerUps: [],
  isSpeedBoosted: false,
  isFrenzyActive: false,
  isTempInvincible: false,

  startGame: () => set({ 
    status: GameStatus.PLAYING, 
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false,
    hasMagnet: false,
    hasShield: false,
    isShieldActive: false,
    scoreMultiplier: 1,
    hasDash: false,
    isDashActive: false,
    activePowerUps: [],
    isSpeedBoosted: false,
    isFrenzyActive: false,
    isTempInvincible: false
  }),

  restartGame: () => set({ 
    status: GameStatus.PLAYING, 
    score: 0, 
    lives: 3, 
    maxLives: 3,
    speed: RUN_SPEED_BASE,
    collectedLetters: [],
    level: 1,
    laneCount: 3,
    gemsCollected: 0,
    distance: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false,
    hasMagnet: false,
    hasShield: false,
    isShieldActive: false,
    scoreMultiplier: 1,
    hasDash: false,
    isDashActive: false,
    activePowerUps: [],
    isSpeedBoosted: false,
    isFrenzyActive: false,
    isTempInvincible: false
  }),

  takeDamage: () => {
    const { lives, isImmortalityActive, isShieldActive, isDashActive, isTempInvincible, isSpeedBoosted } = get();
    if (isImmortalityActive || isDashActive || isTempInvincible || isSpeedBoosted) return; 

    if (isShieldActive) {
      set({ isShieldActive: false });
      get().rechargeShield();
      return;
    }

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
    }
  },

  addScore: (amount) => set((state) => {
    const frenzyMult = state.isFrenzyActive ? 3 : 1;
    return { score: state.score + (amount * state.scoreMultiplier * frenzyMult) };
  }),
  
  collectGem: (value) => set((state) => {
    const frenzyMult = state.isFrenzyActive ? 3 : 1;
    return { 
      score: state.score + (value * state.scoreMultiplier * frenzyMult), 
      gemsCollected: state.gemsCollected + 1 
    };
  }),

  setDistance: (dist) => set({ distance: dist }),

  collectLetter: (index) => {
    const { collectedLetters, level, speed, scoreMultiplier, isFrenzyActive } = get();
    
    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      const speedIncrease = RUN_SPEED_BASE * 0.10;
      const nextSpeed = speed + speedIncrease;
      const frenzyMult = isFrenzyActive ? 3 : 1;

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed,
        score: get().score + (500 * scoreMultiplier * frenzyMult)
      });

      if (newLetters.length === GEMINI_TARGET.length) {
        if (level < MAX_LEVEL) {
            get().advanceLevel();
        } else {
            set({
                status: GameStatus.VICTORY,
                score: get().score + (10000 * scoreMultiplier * frenzyMult)
            });
        }
      }
    }
  },

  advanceLevel: () => {
      const { level, laneCount, speed } = get();
      const nextLevel = level + 1;
      const speedIncrease = RUN_SPEED_BASE * 0.40;
      const newSpeed = speed + speedIncrease;

      let nextLaneCount = laneCount;
      if (nextLevel <= 4) {
          nextLaneCount = 3 + (nextLevel - 1) * 2;
      }

      set({
          level: nextLevel,
          laneCount: Math.min(nextLaneCount, 9),
          status: GameStatus.PLAYING,
          speed: newSpeed,
          collectedLetters: [],
          isShieldActive: get().hasShield 
      });
  },

  openShop: () => set({ status: GameStatus.SHOP }),
  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (type, cost) => {
      const { score, maxLives, lives } = get();
      
      if (score >= cost) {
          set({ score: score - cost });
          
          switch (type) {
              case 'DOUBLE_JUMP':
                  set({ hasDoubleJump: true });
                  break;
              case 'MAX_LIFE':
                  set({ maxLives: maxLives + 1, lives: lives + 1 });
                  break;
              case 'HEAL':
                  set({ lives: Math.min(lives + 1, maxLives) });
                  break;
              case 'IMMORTAL':
                  set({ hasImmortality: true });
                  break;
              case 'MAGNET':
                  set({ hasMagnet: true });
                  break;
              case 'SHIELD':
                  set({ hasShield: true, isShieldActive: true });
                  break;
              case 'MULTIPLIER':
                  set({ scoreMultiplier: 2 });
                  break;
              case 'DASH':
                  set({ hasDash: true });
                  break;
          }
          return true;
      }
      return false;
  },

  activateImmortality: () => {
      const { hasImmortality, isImmortalityActive } = get();
      if (hasImmortality && !isImmortalityActive) {
          set({ isImmortalityActive: true });
          setTimeout(() => set({ isImmortalityActive: false }), 5000);
      }
  },

  activateDash: () => {
    const { hasDash, isDashActive } = get();
    if (hasDash && !isDashActive) {
      set({ isDashActive: true });
      setTimeout(() => set({ isDashActive: false }), 800);
    }
  },

  rechargeShield: () => {
    setTimeout(() => {
      if (get().hasShield) set({ isShieldActive: true });
    }, 20000);
  },

  activatePowerUp: (type: PowerUpType) => {
    const durationMap = {
      [PowerUpType.SPEED]: 4,
      [PowerUpType.FRENZY]: 8,
      [PowerUpType.SHIELD]: 6
    };

    set((state) => {
      const existing = state.activePowerUps.find(p => p.type === type);
      let nextPowerUps = [...state.activePowerUps];
      
      if (existing) {
        existing.timeLeft = durationMap[type];
      } else {
        nextPowerUps.push({ type, timeLeft: durationMap[type] });
      }

      return {
        activePowerUps: nextPowerUps,
        isSpeedBoosted: type === PowerUpType.SPEED ? true : state.isSpeedBoosted,
        isFrenzyActive: type === PowerUpType.FRENZY ? true : state.isFrenzyActive,
        isTempInvincible: type === PowerUpType.SHIELD ? true : state.isTempInvincible
      };
    });
  },

  updatePowerUps: (delta: number) => {
    set((state) => {
      if (state.activePowerUps.length === 0) return {};

      const nextPowerUps = state.activePowerUps
        .map(p => ({ ...p, timeLeft: p.timeLeft - delta }))
        .filter(p => p.timeLeft > 0);

      return {
        activePowerUps: nextPowerUps,
        isSpeedBoosted: nextPowerUps.some(p => p.type === PowerUpType.SPEED),
        isFrenzyActive: nextPowerUps.some(p => p.type === PowerUpType.FRENZY),
        isTempInvincible: nextPowerUps.some(p => p.type === PowerUpType.SHIELD)
      };
    });
  },

  setStatus: (status) => set({ status }),
}));
