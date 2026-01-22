
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Magnet, TrendingUp, FastForward, Timer } from 'lucide-react';
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
    }
];

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop, hasDoubleJump, hasImmortality, hasMagnet, hasShield, scoreMultiplier, hasDash } = useStore();
    const [items, setItems] = useState<ShopItem[]>([]);

    useEffect(() => {
        let pool = SHOP_ITEMS.filter(item => {
            if (item.id === 'DOUBLE_JUMP' && hasDoubleJump) return false;
            if (item.id === 'IMMORTAL' && hasImmortality) return false;
            if (item.id === 'MAGNET' && hasMagnet) return false;
            if (item.id === 'SHIELD' && hasShield) return false;
            if (item.id === 'MULTIPLIER' && scoreMultiplier > 1) return false;
            if (item.id === 'DASH' && hasDash) return false;
            return true;
        });

        pool = pool.sort(() => 0.5 - Math.random());
        setItems(pool.slice(0, 3));
    }, [hasDoubleJump, hasImmortality, hasMagnet, hasShield, scoreMultiplier, hasDash]);

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
    restartGame, startGame, gemsCollected, distance, 
    isImmortalityActive, speed, hasMagnet, isShieldActive, 
    scoreMultiplier, isDashActive, activePowerUps, isSpeedBoosted, isFrenzyActive, isTempInvincible
  } = useStore();
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];

  if (status === GameStatus.SHOP) return <ShopScreen />;

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
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col">
                <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff] font-cyber">
                    {score.toLocaleString()}
                </div>
                <div className="flex space-x-2 mt-2">
                    {hasMagnet && <Magnet className="w-5 h-5 text-blue-400 opacity-60" />}
                    {isShieldActive && <Shield className="w-5 h-5 text-purple-400 animate-pulse" />}
                    {scoreMultiplier > 1 && <TrendingUp className="w-5 h-5 text-yellow-400" />}
                </div>
            </div>
            
            <div className="flex flex-col items-end">
                <div className="flex space-x-1 md:space-x-2">
                    {[...Array(maxLives)].map((_, i) => (
                        <Heart 
                            key={i} 
                            className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_5px_#ff0054]`} 
                        />
                    ))}
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
            </div>
        </div>
        
        {(isImmortalityActive || isTempInvincible) && (
             <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-xl md:text-2xl animate-pulse flex items-center drop-shadow-[0_0_10px_gold]">
                 <Shield className="mr-2 fill-yellow-400" /> INVINCIBLE
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
