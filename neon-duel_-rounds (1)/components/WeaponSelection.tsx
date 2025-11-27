
import React, { useState } from 'react';
import { WeaponStats, Language } from '../types';
import { STARTING_WEAPONS, TEXT_CONTENT } from '../constants';

interface WeaponSelectionProps {
  onConfirm: (p1Weapon: WeaponStats, p2Weapon: WeaponStats) => void;
  language: Language;
}

export const WeaponSelection: React.FC<WeaponSelectionProps> = ({ onConfirm, language }) => {
  const [p1Index, setP1Index] = useState(0);
  const [p2Index, setP2Index] = useState(0);
  const text = TEXT_CONTENT[language];

  return (
    <div className="absolute inset-0 bg-slate-900 flex flex-col z-50 animate-fade-in">
        <h1 className="text-center text-4xl font-bold text-white py-8 neon-text uppercase tracking-widest">
            {text.weapon_select}
        </h1>
        
        <div className="flex-1 flex w-full">
            {/* Player 1 Selection */}
            <div className="flex-1 border-r border-gray-700 p-8 flex flex-col items-center bg-blue-900/10">
                <h2 className="text-3xl font-bold text-blue-400 mb-8">{text.p1_select}</h2>
                
                <div className="flex-1 flex flex-col justify-center gap-4 w-full max-w-md">
                    {STARTING_WEAPONS.map((w, i) => (
                        <div 
                            key={w.id}
                            onClick={() => setP1Index(i)}
                            className={`
                                p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                                ${p1Index === i 
                                    ? 'border-blue-500 bg-blue-500/20 scale-105 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}
                            `}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-xl">{w.name}</span>
                                {p1Index === i && <div className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]"></div>}
                            </div>
                            <p className="text-sm text-gray-400">{w.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Player 2 Selection */}
            <div className="flex-1 border-l border-gray-700 p-8 flex flex-col items-center bg-red-900/10">
                <h2 className="text-3xl font-bold text-red-400 mb-8">{text.p2_select}</h2>
                
                <div className="flex-1 flex flex-col justify-center gap-4 w-full max-w-md">
                    {STARTING_WEAPONS.map((w, i) => (
                        <div 
                            key={w.id}
                            onClick={() => setP2Index(i)}
                            className={`
                                p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                                ${p2Index === i 
                                    ? 'border-red-500 bg-red-500/20 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}
                            `}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-xl">{w.name}</span>
                                {p2Index === i && <div className="w-3 h-3 bg-red-400 rounded-full shadow-[0_0_10px_#f87171]"></div>}
                            </div>
                            <p className="text-sm text-gray-400">{w.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="p-8 flex justify-center">
            <button 
                onClick={() => onConfirm(STARTING_WEAPONS[p1Index], STARTING_WEAPONS[p2Index])}
                className="px-16 py-4 bg-white text-black font-black text-2xl uppercase tracking-widest hover:scale-105 hover:bg-cyan-400 transition-all duration-200 rounded"
            >
                {text.confirm_loadout}
            </button>
        </div>
    </div>
  );
};
