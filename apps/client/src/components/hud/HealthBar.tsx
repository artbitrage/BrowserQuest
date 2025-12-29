import { useEffect, useState } from 'react';
import type { Game } from '../../game/Game';

interface HealthBarProps {
  game: Game;
}

export const HealthBar = ({ game }: HealthBarProps) => {
  const [health, setHealth] = useState(100);
  const [maxHealth, setMaxHealth] = useState(100);

  useEffect(() => {
    const onHealth = (data: { current: number; max: number }) => {
      setHealth(data.current);
      setMaxHealth(data.max);
    };

    game.on('health', onHealth);
    return () => {
      game.off('health', onHealth);
    };
  }, [game]);

  const percentage = Math.max(0, Math.min(100, (health / maxHealth) * 100));

  return (
    <div className="absolute top-4 left-4 w-64">
      <div className="bg-gray-900/80 border-2 border-gray-600 rounded-lg p-2">
        <div className="flex justify-between text-yellow-500 font-bold mb-1 text-sm uppercase">
          <span>Health</span>
          <span>
            {health}/{maxHealth}
          </span>
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
          <div
            className="h-full bg-linear-to-r from-red-600 to-red-500 transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
