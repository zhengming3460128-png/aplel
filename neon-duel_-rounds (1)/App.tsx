
import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { CardSelection } from './components/CardSelection';
import { WeaponSelection } from './components/WeaponSelection';
import { GamePhase, Card, Language, WeaponStats } from './types';
import { WIN_SCORE, TEXT_CONTENT, STARTING_WEAPONS } from './constants';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INTRO);
  const [round, setRound] = useState(1);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [winnerId, setWinnerId] = useState<number | null>(null); // Game winner
  const [lastLoserId, setLastLoserId] = useState<number>(0);
  const [language, setLanguage] = useState<Language>('en');
  
  // Accumulated Upgrades
  const [p1Cards, setP1Cards] = useState<Card[]>([]);
  const [p2Cards, setP2Cards] = useState<Card[]>([]);

  // Starting Loadouts
  const [p1Weapon, setP1Weapon] = useState<WeaponStats>(STARTING_WEAPONS[0]);
  const [p2Weapon, setP2Weapon] = useState<WeaponStats>(STARTING_WEAPONS[0]);

  const text = TEXT_CONTENT[language];

  const handleRoundOver = (winner: number, loser: number) => {
    // Determine new score
    const newScores: [number, number] = [...scores];
    newScores[winner - 1] += 1;
    setScores(newScores);

    if (newScores[winner - 1] >= WIN_SCORE) {
      setWinnerId(winner);
      setPhase(GamePhase.GAME_OVER);
    } else {
      setLastLoserId(loser);
      setPhase(GamePhase.CARD_SELECT);
    }
  };

  const handleCardSelect = (card: Card) => {
    if (lastLoserId === 1) {
      setP1Cards([...p1Cards, card]);
    } else {
      setP2Cards([...p2Cards, card]);
    }
    setRound(r => r + 1);
    setPhase(GamePhase.PLAYING);
  };

  const handleStartGame = () => {
    // Go to weapon select first
    setPhase(GamePhase.WEAPON_SELECT);
  };

  const handleWeaponConfirm = (w1: WeaponStats, w2: WeaponStats) => {
    setP1Weapon(w1);
    setP2Weapon(w2);
    
    // Reset game state
    setScores([0, 0]);
    setRound(1);
    setP1Cards([]);
    setP2Cards([]);
    setWinnerId(null);
    setPhase(GamePhase.PLAYING);
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white font-sans selection:bg-pink-500">
      
      {/* Game Layer */}
      <GameCanvas 
        phase={phase}
        setPhase={setPhase}
        onRoundOver={handleRoundOver}
        activeRound={round}
        winner={winnerId}
        selectedCardsP1={p1Cards}
        selectedCardsP2={p2Cards}
        language={language}
        p1Weapon={p1Weapon}
        p2Weapon={p2Weapon}
      />

      {/* Main Menu Overlay */}
      {phase === GamePhase.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <div className="absolute top-8 right-8 flex gap-4">
             <button onClick={() => setLanguage('en')} className={`px-4 py-2 font-bold ${language === 'en' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}>ENG</button>
             <button onClick={() => setLanguage('zh')} className={`px-4 py-2 font-bold ${language === 'zh' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}>中文</button>
          </div>

          <h1 className="text-8xl font-black italic tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 neon-text">
            {text.menu_title}
          </h1>
          <p className="text-2xl text-gray-400 mb-2 tracking-widest">{text.menu_subtitle}</p>
          <p className="text-sm text-gray-600 mb-12 uppercase tracking-wider font-bold">{text.menu_created}</p>
          
          <div className="flex gap-12 text-gray-300 mb-12">
            <div className="text-center p-4 border border-gray-700 rounded-lg bg-gray-900/50">
              <h3 className="text-blue-400 font-bold mb-2">PLAYER 1</h3>
              {text.p1_controls.map((c, i) => <div key={i} className="text-sm">{c}</div>)}
            </div>
            <div className="text-center p-4 border border-gray-700 rounded-lg bg-gray-900/50">
              <h3 className="text-red-400 font-bold mb-2">PLAYER 2</h3>
              {text.p2_controls.map((c, i) => <div key={i} className="text-sm">{c}</div>)}
            </div>
          </div>

          <div className="flex gap-6">
            <button 
                onClick={handleStartGame}
                className="px-12 py-4 bg-white text-black font-black text-2xl uppercase tracking-widest hover:scale-105 hover:bg-cyan-400 transition-all duration-200"
            >
                {text.menu_start}
            </button>
            <button 
                onClick={() => setPhase(GamePhase.TUTORIAL)}
                className="px-12 py-4 border-2 border-white text-white font-bold text-2xl uppercase tracking-widest hover:scale-105 hover:bg-white hover:text-black transition-all duration-200"
            >
                {text.menu_tutorial}
            </button>
          </div>
        </div>
      )}

      {/* Weapon Selection Overlay */}
      {phase === GamePhase.WEAPON_SELECT && (
        <WeaponSelection 
            onConfirm={handleWeaponConfirm} 
            language={language}
        />
      )}

      {/* Card Selection Overlay */}
      {phase === GamePhase.CARD_SELECT && (
        <CardSelection 
          loserId={lastLoserId} 
          onSelect={handleCardSelect}
        />
      )}

      {/* Game Over Overlay */}
      {phase === GamePhase.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-50">
          <h2 className="text-6xl font-bold mb-6">
            <span className={winnerId === 1 ? "text-blue-500" : "text-red-500"}>
              PLAYER {winnerId}
            </span> {text.game_over_win}
          </h2>
          <div className="text-4xl mb-12">
             {text.score}: {scores[0]} - {scores[1]}
          </div>
          <button 
            onClick={handleStartGame}
            className="px-8 py-3 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-colors"
          >
            {text.play_again}
          </button>
        </div>
      )}
      
      {/* Scoreboard overlay (always visible in playing) */}
      {phase === GamePhase.PLAYING && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex gap-4 text-4xl font-black opacity-50 pointer-events-none">
              <span className="text-blue-500">{scores[0]}</span>
              <span className="text-white">-</span>
              <span className="text-red-500">{scores[1]}</span>
          </div>
      )}
    </div>
  );
};

export default App;
