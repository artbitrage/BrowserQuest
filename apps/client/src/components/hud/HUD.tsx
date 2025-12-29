import type { Game } from '../../game/Game';
import { Chat } from './Chat';
import { HealthBar } from './HealthBar';
import { Inventory } from './Inventory';

interface HUDProps {
  game: Game;
}

export const HUD = ({ game }: HUDProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <HealthBar game={game} />
      <Chat game={game} />
      <Inventory game={game} />
    </div>
  );
};
