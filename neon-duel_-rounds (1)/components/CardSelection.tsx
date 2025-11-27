
import React, { useState } from 'react';
import { Card } from '../types';
import { AVAILABLE_CARDS } from '../constants';

interface CardSelectionProps {
  loserId: number;
  onSelect: (card: Card) => void;
}

export const CardSelection: React.FC<CardSelectionProps> = ({ loserId, onSelect }) => {
  const [cards] = useState<Card[]>(() => {
    // Shuffle and pick 3
    const shuffled = [...AVAILABLE_CARDS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  const playerColor = loserId === 1 ? 'text-blue-400 border-blue-500' : 'text-red-400 border-red-500';

  return (
    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-fade-in">
      <h2 className={`text-4xl font-bold mb-2 ${playerColor} uppercase tracking-widest neon-text`}>
        Player {loserId} Defeated
      </h2>
      <p className="text-gray-300 mb-8 text-xl">Adapt. Evolve. Overcome.</p>
      
      <div className="flex gap-6 max-w-4xl w-full px-4 overflow-x-auto justify-center pb-4">
        {cards.map((card) => (
          <div 
            key={card.id}
            onClick={() => onSelect(card)}
            className={`
              w-64 h-80 bg-gray-800 border-2 rounded-xl p-6 flex flex-col justify-between 
              cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl
              group relative overflow-hidden
            `}
            style={{ borderColor: card.color }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
            <div 
                className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40"
                style={{ backgroundColor: card.color }}
            ></div>

            <div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs uppercase font-bold tracking-wider text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                        {card.rarity}
                    </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2" style={{color: card.color}}>{card.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{card.description}</p>
            </div>
            
            <button 
                className="w-full py-2 rounded font-bold text-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                style={{ backgroundColor: card.color }}
            >
                Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
