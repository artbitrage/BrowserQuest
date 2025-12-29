import { useEffect, useRef } from 'react';
import type { Game } from '../game/Game';

interface GameCanvasProps {
  game: Game;
}

export const GameCanvas = ({ game }: GameCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      game.init(containerRef.current);
      game.start();
    }

    return () => {
      game.stop();
    };
  }, [game]);

  return <div ref={containerRef} className="w-full h-full bg-black" />;
};
