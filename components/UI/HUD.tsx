
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Magnet, TrendingUp, FastForward, Timer, Pause, RotateCcw, Radio, HeartPulse, Clock, Flame, ShieldAlert, Sparkles, BatteryCharging, BatteryFull } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, GEMINI_COLORS, ShopItem, RUN_SPEED_BASE, PowerUpType } from '../../types';
import { audio } from '../System/Audio';

const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'DOUBLE_JUMP',
        name: 'DOUBLE JUMP',
        description: 'Jump again in mid-air. Essential for high obstacles.',
        cost: 1000,
        icon: ArrowUpCircle,
        oneTime: true
    },
    {
        id: 'MAX_LIFE',
        name: 'MAX LIFE UP',
        description: 'Permanently adds a heart slot and heals you.',
        cost: 1500,
        icon: Activity
    },
    {
        id: 'HEAL',
        name: 'REPAIR KIT',
        description: 'Restores 1 Life point instantly.',
        cost: 1000,
        icon: PlusCircle
    },
    {
        id: 'IMMORTAL',
        name: 'IMMORTALITY',
        description: 'Unlock Ability: Press Space/Tap to be invincible for 5s.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    },
    {
        id: 'MAGNET',
        name: 'GEM MAGNET',
        description: 'Passive: Pulls gems from all lanes towards you.',
        cost: 2500,
        icon: Magnet,
        oneTime: true
    },
    {
        id: 'SHIELD',
        name: 'PLASMA SHIELD',
        description: 'Auto-absorbs 1 hit. Recharges every 20 seconds.',
        cost: 3000,
        icon: Shield,
        oneTime: true
    },
    {
        id: 'MULTIPLIER',
        name: 'SCORE OVERDRIVE',
        description: 'Permanent 2x score multiplier for all gems.',
        cost: 5000,
        icon: TrendingUp,
        oneTime: true
    },
    {
        id: 'DASH',
        name: 'DASH THRUSTERS',
        description: 'Ability: Double-tap move or Shift to dash forward.',
        cost: 4000,
        icon: FastForward,
        oneTime: true
    },
    {
        id: 'SONIC_PULSE',
        name: 'SONIC PULSE',
        description: 'Ability: Press Q to destroy all hazards on screen.',
        cost: 5000,
        icon: Radio,
        oneTime: true
    },
    {
        id: 'REBIRTH',
        name: 'REBIRTH MODULE',
        description: 'Passive: Fatal damage revives you once per run.',
        cost: 3500,
        icon: HeartPulse,
        oneTime: true
    },
    {
        id: 'CHRONO',
        name: 'CHRONO DRIVER',
        description: 'Ability: Press C to slow down time for 5 seconds.',
        cost: 4500,
        icon: Clock,
        oneTime: true
    },
    {
        id: 'EXTENDER',
        name: 'AURA FLUX',
        description: 'Passive: All level power-ups last 50% longer.',
        cost: 4000,
        icon: Sparkles,
        oneTime: true
    },
    {
        id: 'RECHARGE',
        name: 'FLUX COIL',
        description: 'Passive: Shield and Ability cooldowns are 30% faster.',
        cost: 4500,
        icon: BatteryCharging,
        oneTime: true
    },
    {
        id: 'REFRESH',
        name: 'REFRESH CELL',
        description: 'Utility: Instantly resets shield and all cooldowns.',
        cost: 1500,
        icon: Zap
    }
];

const FlashOverlay: React.FC = () => {
    const isPhotosensitiveMode = useStore(state => state.isPhotosensitiveMode);
    const [flash, setFlash] = useState<{ color: string; opacity: number }>({ color: 'white', opacity: 0 });

    useEffect(() => {
        if (isPhotosensitiveMode) return;

        const triggerHitFlash = () => {
            setFlash({ color: 'rgb(255, 0, 0)', opacity: 0.4 });
            setTimeout(() => setFlash(f => ({ ...f, opacity: 0 })), 150);
        };
        const triggerCollectFlash = (e: any) => {
            const color = e.detail?.color || 'white';
            setFlash({ color, opacity: 0.15 });
            setTimeout(() => setFlash(f => ({ ...f, opacity: 0 })), 150);
        };
        const triggerSonicFlash = () => {
            setFlash({ color: 'rgb(0, 255, 255)', opacity: 0.6 });
            setTimeout(() => setFlash(f => ({ ...f, opacity: 0 })), 300);
        };

        window.addEventListener('player-hit', triggerHitFlash);
        window.addEventListener('item-collected-detailed', triggerCollectFlash as any);
        window.addEventListener('sonic-pulse', triggerSonicFlash);

        return () => {
            window.removeEventListener('player-hit', triggerHitFlash);
            window.removeEventListener('item-collected-detailed', triggerCollectFlash as any);
            window.removeEventListener('sonic-pulse', triggerSonicFlash);
        };
    }, [isPhotosensitiveMode]);

    if (isPhotosensitiveMode || flash.opacity === 0) return null;

    return (
        <div 
            className="absolute inset-0 pointer-events-none z-[110] transition-opacity duration-150"
            style={{ backgroundColor: flash.color, opacity: flash.opacity }}
        />
    );
};

const SafeModeToggle: React.FC = () => {
    const { isPhotosensitiveMode, togglePhotosensitiveMode } = useStore();
    return (
        <button 
            onClick={togglePhotosensitiveMode}
            className={`flex items-center space-x-2 px-3 py-2 rounded-full border transition-all pointer-events-auto ${isPhotosensitiveMode ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
        >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-widest">{isPhotosensitiveMode ? 'Safe Mode ON' : 'Safe Mode OFF'}</span>
        </button>
    );
};

const PauseOverlay: React.FC = () => {
    const { resumeGame, restartGame, score, level } = useStore();
    return (
        <div className="absolute inset-0 bg-black/60 z-[100] text-white pointer-events-auto backdrop-blur-md flex items-center justify-center p-4">
             <div className="flex flex-col items-center max-w-sm w-full bg-gray-900/80 border border-cyan-500/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,255,255,0.1)]">
                 <Pause className="w-12 h-12 text-cyan-400 mb-4 animate-pulse" />
                 <h2 className="text-4xl font-black text-cyan-400 mb-1 font-cyber tracking-widest text-center">SYSTEM PAUSED</h2>
                 <p className="text-gray-400 text-xs font-mono uppercase tracking-[0.2em] mb-4 text-center">Mission Status: Suspended</p>
                 
                 <div className="mb-8">
                    <SafeModeToggle />
                 </div>

                 <div className="w-full space-y-3 mb-10">
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="text-gray-500 font-mono text-xs">SCORE</span>
                        <span className="text-xl font-bold font-cyber text-yellow-400">{score.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                        <span className="text-gray-500 font-mono text-xs">LEVEL</span>
                        <span className="text-xl font-bold font-cyber text-purple-400">{level}</span>
                    </div>
                 </div>

                 <div className="flex flex-col w-full gap-4">
                    <button 
                        onClick={resumeGame}
                        className="flex items-center justify-center px-8 py-4 bg-cyan-600 text-white font-black text-lg rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                    >
                        RESUME MISSION <Play className="ml-2 w-5 h-5 fill-white" />
                    </button>
                    <button 
                        onClick={restartGame}
                        className="flex items-center justify-center px-8 py-3 bg-transparent border border-pink-500/50 text-pink-500 font-bold text-base rounded-xl hover:bg-pink-500/10 transition-all"
                    >
                        ABORT & RESTART <RotateCcw className="ml-2 w-4 h-4" />
                    </button>
                 </div>
             </div>
        </div>
    );
};

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasImmortality, hasMagnet, hasShield, scoreMultiplier, hasDash, hasSonicPulse, hasRebirth, hasChronoDriver, powerUpDurationMod, cooldownMod } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            if (item.id === 'MAGNET' && hasMagnet) return false;
            if (item.id === 'SHIELD' && hasShield) return false;
            if (item.id === 'MULTIPLIER' && scoreMultiplier > 1) return false;
            if (item.id === 'DASH' && hasDash) return false;
            if (item.id === 'SONIC_PULSE' && hasSonicPulse) return false;
            if (item.id === 'REBIRTH' && hasRebirth) return false;
            if (item.id === 'CHRONO' && hasChronoDriver) return false;
            if (item.id === 'EXTENDER' && powerUpDurationMod > 1) return false;
            if (item.id === 'RECHARGE' && cooldownMod < 1) return false;
            return true;
        });

        pool = pool.sort(() => 0.5 - Math.random());
        setItems(pool.slice(0, 3));
    }, [hasDoubleJump, hasImmortality, hasMagnet, hasShield, scoreMultiplier, hasDash, hasSonicPulse, hasRebirth, hasChronoDriver, powerUpDurationMod, cooldownMod]);

    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-3xl md:text-4xl font-black text-cyan-400 mb-2 font-cyber tracking-widest text-center">CYBER SHOP</h2>
                 <div className="flex items-center text-yellow-400 mb-6 md:mb-8">
                     <span className="text-base md:text-lg mr-2">AVAILABLE CREDITS:</span>
                     <span className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl w-full mb-8">
                     {items.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-gray-900/80 border border-gray-700 p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-cyan-500 transition-colors">
                                 <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                                     <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                                 </div>
                                 <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>
                                 <p className="text-gray-400 text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id as any, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-4 md:px-6 py-2 rounded font-bold w-full text-sm md:text-base ${canAfford ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
                                 >
                                     {item.cost} GEMS
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                 >
                     RESUME MISSION <Play className="ml-2 w-5 h-5" fill="white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC = () => {
  const { 
    score, lives, maxLives, collectedLetters, status, level, 
    restartGame, startGame, gemsCollected, distance, distanceSinceDamage,
    isImmortalityActive, speed, hasMagnet, isShieldActive, 
    scoreMultiplier, isDashActive, activePowerUps, isSpeedBoosted, isFrenzyActive, isTempInvincible,
    pauseGame, hasSonicPulse, sonicPulseCooldown, hasChronoDriver, chronoCooldown, isChronoActive, hasRebirth, rebirthUsed,
    activateSonicPulse, activateChronoDriver
  } = useStore();
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];

  const dangerLevel = useMemo(() => {
    return Math.min(distanceSinceDamage / 600, 1.0);
  }, [distanceSinceDamage]);

  if (status === GameStatus.SHOP) return <ShopScreen />;
  if (status === GameStatus.PAUSED) return <PauseOverlay />;

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="relative w-full bg-gray-900">
                     <img 
                      src="https://www.gstatic.com/aistudio/starter-apps/gemini_runner/gemini_runner.png" 
                      alt="Gemini Runner Cover" 
                      className="w-full h-auto block"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#050011] via-black/30 to-transparent"></div>
                     <div className="absolute inset-0 flex flex-col justify-end items-center p-6 pb-8 text-center z-10">
                        <div className="mb-4">
                            <SafeModeToggle />
                        </div>
                        <button 
                          onClick={() => { audio.init(); startGame(); }}
                          className="w-full group relative px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xl rounded-xl hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:border-cyan-400 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/40 via-purple-500/40 to-pink-500/40 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                            <span className="relative z-10 tracking-widest flex items-center justify-center">
                                INITIALIZE RUN <Play className="ml-2 w-5 h-5 fill-white" />
                            </span>
                        </button>
                        <p className="text-cyan-400/60 text-[10px] md:text-xs font-mono mt-3 tracking-wider">
                            [ ARROWS / SWIPE TO MOVE ]
                        </p>
                     </div>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-sm overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 text-center">
              <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] font-cyber">GAME OVER</h1>
              <div className="grid grid-cols-1 gap-4 mb-8 w-full max-w-md">
                  <div className="bg-gray-900/80 p-4 rounded-lg border border-gray-700 flex justify-between">
                      <div className="flex items-center text-cyan-400"><Diamond className="mr-2 w-5 h-5"/> GEMS</div>
                      <div className="text-2xl font-bold font-mono">{gemsCollected}</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg flex justify-between">
                      <div className="text-white">SCORE</div>
                      <div className="text-3xl font-bold font-cyber text-yellow-400">{score.toLocaleString()}</div>
                  </div>
              </div>
              <button onClick={restartGame} className="px-10 py-4 bg-cyan-600 text-white font-bold text-xl rounded shadow-[0_0_20px_rgba(0,255,255,0.4)]">RUN AGAIN</button>
            </div>
        </div>
    );
  }

  if (status === GameStatus.VICTORY) {
      return (
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 to-black/95 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4 text-center">
                  <Rocket className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
                  <h1 className="text-4xl md:text-7xl font-black text-yellow-300 font-cyber">MISSION COMPLETE</h1>
                  <p className="text-cyan-300 mb-8 font-mono tracking-widest">COSMOS CONQUERED</p>
                  <div className="text-4xl font-bold font-cyber text-yellow-400 mb-8">{score.toLocaleString()}</div>
                  <button onClick={restartGame} className="px-12 py-5 bg-white text-black font-black text-xl rounded shadow-[0_0_40px_white]">RESTART MISSION</button>
              </div>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50">
        <FlashOverlay />
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff] font-cyber">
                    {score.toLocaleString()}
                </div>
                <div className="flex space-x-2 mt-2">
                    {hasMagnet && <Magnet className="w-5 h-5 text-blue-400 opacity-60" />}
                    {isShieldActive && <Shield className="w-5 h-5 text-purple-400 animate-pulse" />}
                    {scoreMultiplier > 1 && <TrendingUp className="w-5 h-5 text-yellow-400" />}
                    {hasRebirth && !rebirthUsed && <HeartPulse className="w-5 h-5 text-pink-400 animate-bounce" />}
                </div>

                {/* Danger Bar */}
                <div className="mt-4 flex flex-col w-32 md:w-48">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest flex items-center">
                            <Flame className={`w-3 h-3 mr-1 ${dangerLevel > 0.8 ? 'animate-pulse text-red-500' : ''}`} /> Danger Level
                        </span>
                        <span className="text-[10px] font-mono text-white">{Math.floor(dangerLevel * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-black/50 rounded-full border border-white/10 overflow-hidden">
                        <div 
                            className="h-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-red-600"
                            style={{ width: `${dangerLevel * 100}%` }}
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col items-end pointer-events-auto">
                <div className="flex space-x-4 items-center">
                    <button 
                        onClick={pauseGame}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                    >
                        <Pause className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </button>
                    <div className="flex space-x-1 md:space-x-2">
                        {[...Array(maxLives)].map((_, i) => (
                            <Heart 
                                key={i} 
                                className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_5px_#ff0054]`} 
                            />
                        ))}
                    </div>
                </div>
                <div className="mt-2 text-xs font-mono text-purple-400 uppercase tracking-tighter">
                    Level {level} / 10
                </div>

                {/* Level Power-Up Buff Bar */}
                <div className="flex flex-col items-end space-y-1 mt-4">
                    {activePowerUps.map(pu => {
                        let label = "";
                        let color = "";
                        if (pu.type === PowerUpType.SPEED) { label = "NITRO"; color = "text-cyan-400"; }
                        if (pu.type === PowerUpType.FRENZY) { label = "FRENZY x3"; color = "text-yellow-400"; }
                        if (pu.type === PowerUpType.SHIELD) { label = "GUARDIAN"; color = "text-white"; }
                        
                        return (
                            <div key={pu.type} className={`flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 ${color}`}>
                                <Timer className="w-3 h-3" />
                                <span className="text-[10px] font-black tracking-widest">{label}</span>
                                <span className="text-[10px] font-mono w-4">{Math.ceil(pu.timeLeft)}s</span>
                            </div>
                        );
                    })}
                </div>

                {/* Active Abilities Cooldown Bar */}
                <div className="flex flex-col items-end space-y-2 mt-4 pointer-events-auto">
                    {hasSonicPulse && (
                        <button 
                            onClick={activateSonicPulse}
                            disabled={sonicPulseCooldown > 0}
                            className={`flex items-center space-x-3 bg-black/80 border border-cyan-500/30 p-2 rounded-xl transition-all ${sonicPulseCooldown > 0 ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                        >
                            <div className="relative">
                                <Radio className="w-6 h-6 text-cyan-400" />
                                {sonicPulseCooldown > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold text-white rounded-full">
                                        {Math.ceil(sonicPulseCooldown)}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-cyber text-cyan-400 uppercase tracking-widest hidden md:inline">SONIC PULSE [Q]</span>
                        </button>
                    )}
                    {hasChronoDriver && (
                        <button 
                            onClick={activateChronoDriver}
                            disabled={chronoCooldown > 0}
                            className={`flex items-center space-x-3 bg-black/80 border border-purple-500/30 p-2 rounded-xl transition-all ${chronoCooldown > 0 ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
                        >
                            <div className="relative">
                                <Clock className={`w-6 h-6 text-purple-400 ${isChronoActive ? 'animate-spin' : ''}`} />
                                {chronoCooldown > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-bold text-white rounded-full">
                                        {Math.ceil(chronoCooldown)}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-cyber text-purple-400 uppercase tracking-widest hidden md:inline">CHRONO [C]</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
        
        {(isImmortalityActive || isTempInvincible) && (
             <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-xl md:text-2xl animate-pulse flex items-center drop-shadow-[0_0_10px_gold]">
                 <Shield className="mr-2 fill-yellow-400" /> INVINCIBLE
             </div>
        )}

        {isChronoActive && (
             <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-purple-400 font-black text-xl md:text-2xl animate-pulse flex items-center drop-shadow-[0_0_10px_purple]">
                 <Clock className="mr-2 fill-purple-400" /> CHRONO WARP ACTIVE
             </div>
        )}

        {isDashActive && (
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 text-cyan-400 font-black text-2xl md:text-4xl italic tracking-widest animate-ping">
                DASH!!
            </div>
        )}

        {isSpeedBoosted && (
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 text-white font-black text-2xl md:text-4xl italic tracking-widest animate-pulse drop-shadow-[0_0_10px_cyan]">
                NITRO BOOSTED!
            </div>
        )}

        <div className="absolute top-16 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3">
            {target.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = GEMINI_COLORS[idx];
                return (
                    <div 
                        key={idx}
                        style={{
                            borderColor: isCollected ? color : 'rgba(55, 65, 81, 1)',
                            color: isCollected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(55, 65, 81, 1)',
                            boxShadow: isCollected ? `0 0 20px ${color}` : 'none',
                            backgroundColor: isCollected ? color : 'rgba(0, 0, 0, 0.9)'
                        }}
                        className="w-8 h-10 md:w-10 md:h-12 flex items-center justify-center border-2 font-black text-lg md:text-xl font-cyber rounded-lg transform transition-all duration-300"
                    >
                        {char}
                    </div>
                );
            })}
        </div>

        <div className="w-full flex justify-between items-end">
             <div className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                Dist: {Math.floor(distance)} LY
             </div>
             <div className="flex items-center space-x-2 text-cyan-500 opacity-70">
                 <Zap className="w-4 h-4 md:w-6 md:h-6 animate-pulse" />
                 <span className="font-mono text-base md:text-xl">SPEED {Math.round(((isSpeedBoosted ? speed * 1.5 : speed) / RUN_SPEED_BASE) * 100)}%</span>
             </div>
        </div>
    </div>
  );
};
