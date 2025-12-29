import { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { LoginScreen } from './components/LoginScreen';
import { HUD } from './components/hud/HUD';
import { Game } from './game/Game';

function App() {
  const [game] = useState(() => new Game());
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (name: string) => {
    setIsPlaying(true);
    // Connect to server
    game.connect(name);
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative font-sans">
      <GameCanvas game={game} />

      {!isPlaying && <LoginScreen onPlay={handlePlay} />}

      {isPlaying && <HUD game={game} />}
    </div>
  );
}

export default App;
