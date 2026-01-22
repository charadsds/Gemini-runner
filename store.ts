
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, PowerUpType } from './types';
import { audio } from './components/System/Audio';

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
  distanceSinceDamage: number;
  
  // Accessibility
  isPhotosensitiveMode: boolean;

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

  // Shop Upgrade Modifiers
  powerUpDurationMod: number; // Duration multiplier for level power-ups
  cooldownMod: number;        // Cooldown duration multiplier (lower is faster)

  // Expanded Shop Abilities
  hasSonicPulse: boolean;
  sonicPulseCooldown: number;
  hasRebirth: boolean;
  rebirthUsed: boolean;
  hasChronoDriver: boolean;
  isChronoActive: boolean;
  chronoCooldown: number;

  // Level Power-ups
  activePowerUps: PowerUpState[];
  isSpeedBoosted: boolean;
  isFrenzyActive: boolean;
  isTempInvincible: boolean;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  takeDamage: () => void;
  resetDistanceSinceDamage: () => void;
  addScore: (amount: number) => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  setStatus: (status: GameStatus) => void;
  setDistance: (dist: number) => void;
  incrementDistances: (delta: number) => void;
  togglePhotosensitiveMode: () => void;
  
  // Shop / Abilities
  buyItem: (type: string, cost: number) => boolean;
  advanceLevel: () => void;
  openShop: () => void;
  closeShop: () => void;
  activateImmortality: () => void;
  activateDash: () => void;
  activateSonicPulse: () => void;
  activateChronoDriver: () => void;
  rechargeShield: () => void;
  instantRefresh: () => void;

  // Power-up Actions
  activatePowerUp: (type: PowerUpType) => void;
  updatePowerUps: (delta: number) => void;
  tickCooldowns: (delta: number) => void;
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
  distanceSinceDamage: 0,
  isPhotosensitiveMode: false,
  
  hasDoubleJump: false,
  hasImmortality: false,
  isImmortalityActive: false,
  hasMagnet: false,
  hasShield: false,
  isShieldActive: false,
  scoreMultiplier: 1,
  hasDash: false,
  isDashActive: false,

  powerUpDurationMod: 1.0,
  cooldownMod: 1.0,

  hasSonicPulse: false,
  sonicPulseCooldown: 0,
  hasRebirth: false,
  rebirthUsed: false,
  hasChronoDriver: false,
  isChronoActive: false,
  chronoCooldown: 0,

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
    distanceSinceDamage: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false,
    hasMagnet: false,
    hasShield: false,
    isShieldActive: false,
    scoreMultiplier: 1,
    hasDash: false,
    isDashActive: false,
    powerUpDurationMod: 1.0,
    cooldownMod: 1.0,
    hasSonicPulse: false,
    sonicPulseCooldown: 0,
    hasRebirth: false,
    rebirthUsed: false,
    hasChronoDriver: false,
    isChronoActive: false,
    chronoCooldown: 0,
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
    distanceSinceDamage: 0,
    hasDoubleJump: false,
    hasImmortality: false,
    isImmortalityActive: false,
    hasMagnet: false,
    hasShield: false,
    isShieldActive: false,
    scoreMultiplier: 1,
    hasDash: false,
    isDashActive: false,
    powerUpDurationMod: 1.0,
    cooldownMod: 1.0,
    hasSonicPulse: false,
    sonicPulseCooldown: 0,
    hasRebirth: false,
    rebirthUsed: false,
    hasChronoDriver: false,
    isChronoActive: false,
    chronoCooldown: 0,
    activePowerUps: [],
    isSpeedBoosted: false,
    isFrenzyActive: false,
    isTempInvincible: false
  }),

  pauseGame: () => {
    const { status } = get();
    if (status === GameStatus.PLAYING) {
      set({ status: GameStatus.PAUSED });
    }
  },

  resumeGame: () => {
    const { status } = get();
    if (status === GameStatus.PAUSED) {
      set({ status: GameStatus.PLAYING });
    }
  },

  takeDamage: () => {
    const { lives, isImmortalityActive, isShieldActive, isDashActive, isTempInvincible, isSpeedBoosted, status, hasRebirth, rebirthUsed } = get();
    if (status !== GameStatus.PLAYING || isImmortalityActive || isDashActive || isTempInvincible || isSpeedBoosted) return; 

    set({ distanceSinceDamage: 0 });

    if (isShieldActive) {
      set({ isShieldActive: false });
      audio.playShieldBreak();
      get().rechargeShield();
      return;
    }

    if (lives > 1) {
      set({ lives: lives - 1 });
      audio.playDamage();
    } else if (hasRebirth && !rebirthUsed) {
      set({ rebirthUsed: true, lives: 1 });
      audio.playImmortality(); 
      window.dispatchEvent(new Event('rebirth-triggered'));
    } else {
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
      audio.playDamage();
    }
  },

  resetDistanceSinceDamage: () => set({ distanceSinceDamage: 0 }),

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
  incrementDistances: (delta) => set((state) => ({ 
    distance: state.distance + delta,
    distanceSinceDamage: state.distanceSinceDamage + delta 
  })),

  togglePhotosensitiveMode: () => set(state => ({ isPhotosensitiveMode: !state.isPhotosensitiveMode })),

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
            audio.playLevelComplete();
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

      audio.playLevelComplete();
      
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
              case 'SONIC_PULSE':
                  set({ hasSonicPulse: true });
                  break;
              case 'REBIRTH':
                  set({ hasRebirth: true });
                  break;
              case 'CHRONO':
                  set({ hasChronoDriver: true });
                  break;
              case 'EXTENDER':
                  set({ powerUpDurationMod: 1.5 });
                  break;
              case 'RECHARGE':
                  set({ cooldownMod: 0.7 });
                  break;
              case 'REFRESH':
                  get().instantRefresh();
                  break;
          }
          audio.playLetterCollect(); 
          return true;
      }
      return false;
  },

  instantRefresh: () => {
    set({
        sonicPulseCooldown: 0,
        chronoCooldown: 0,
        isShieldActive: get().hasShield
    });
    audio.playPowerUpCollect();
  },

  activateImmortality: () => {
      const { hasImmortality, isImmortalityActive, status } = get();
      if (status === GameStatus.PLAYING && hasImmortality && !isImmortalityActive) {
          set({ isImmortalityActive: true });
          audio.playImmortality();
          setTimeout(() => set({ isImmortalityActive: false }), 5000);
      }
  },

  activateDash: () => {
    const { hasDash, isDashActive, status } = get();
    if (status === GameStatus.PLAYING && hasDash && !isDashActive) {
      set({ isDashActive: true });
      audio.playDash();
      setTimeout(() => set({ isDashActive: false }), 800);
    }
  },

  activateSonicPulse: () => {
    const { hasSonicPulse, sonicPulseCooldown, status, cooldownMod } = get();
    if (status === GameStatus.PLAYING && hasSonicPulse && sonicPulseCooldown <= 0) {
      set({ sonicPulseCooldown: 30 * cooldownMod });
      audio.playDash(); 
      window.dispatchEvent(new Event('sonic-pulse'));
    }
  },

  activateChronoDriver: () => {
    const { hasChronoDriver, chronoCooldown, status, cooldownMod } = get();
    if (status === GameStatus.PLAYING && hasChronoDriver && chronoCooldown <= 0) {
      set({ isChronoActive: true, chronoCooldown: 45 * cooldownMod });
      audio.playImmortality();
      setTimeout(() => set({ isChronoActive: false }), 5000);
    }
  },

  rechargeShield: () => {
    const { cooldownMod } = get();
    setTimeout(() => {
      if (get().hasShield) {
          set({ isShieldActive: true });
          audio.playPowerUpCollect();
      }
    }, 20000 * cooldownMod);
  },

  activatePowerUp: (type: PowerUpType) => {
    const { powerUpDurationMod } = get();
    const durationMap = {
      [PowerUpType.SPEED]: 4 * powerUpDurationMod,
      [PowerUpType.FRENZY]: 8 * powerUpDurationMod,
      [PowerUpType.SHIELD]: 6 * powerUpDurationMod
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
      if (state.status !== GameStatus.PLAYING || state.activePowerUps.length === 0) return {};

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

  tickCooldowns: (delta: number) => {
    set((state) => {
      if (state.status !== GameStatus.PLAYING) return {};
      return {
        sonicPulseCooldown: Math.max(0, state.sonicPulseCooldown - delta),
        chronoCooldown: Math.max(0, state.chronoCooldown - delta)
      };
    });
  },

  setStatus: (status) => set({ status }),
}));
