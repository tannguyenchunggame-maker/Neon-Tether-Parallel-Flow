
import React, { useState, useCallback, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import GameView from './components/GameView';
import GameOver from './components/GameOver';
import { GameState } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [lastScore, setLastScore] = useState(0);
  const [tutorialShown, setTutorialShown] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('bestScore') || '248930');
  });

  const startGame = () => {
    setGameState('PLAYING');
  };

  const endGame = (score: number) => {
    setLastScore(score);
    setTutorialShown(true); // Mark tutorial as seen once a game finishes
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bestScore', score.toString());
    }
    setGameState('GAMEOVER');
  };

  const goToMenu = () => {
    setGameState('MENU');
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans select-none">
      {gameState === 'MENU' && (
        <MainMenu onStart={startGame} bestScore={bestScore} />
      )}
      {gameState === 'PLAYING' && (
        <GameView onGameOver={endGame} skipTutorial={tutorialShown} />
      )}
      {gameState === 'GAMEOVER' && (
        <GameOver score={lastScore} bestScore={bestScore} onRetry={startGame} onMenu={goToMenu} />
      )}
    </div>
  );
};

export default App;
