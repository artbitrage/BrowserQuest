import { useEffect, useState } from 'react';
import type { Game } from '../../game/Game';

interface InventoryProps {
  game: Game;
}

export const Inventory = ({ game }: InventoryProps) => {
  const [items, setItems] = useState<string[]>(Array(20).fill(null)); // 20 slots

  useEffect(() => {
    const onInventory = (data: string[]) => {
      setItems(data);
    };

    game.on('inventory', onInventory);
    return () => {
      game.off('inventory', onInventory);
    };
  }, [game]);

  return (
    <div className="absolute bottom-4 right-4 pointer-events-auto">
      <div className="bg-gray-900/80 border-2 border-gray-600 rounded-lg p-2">
        <div className="text-yellow-500 font-bold mb-2 text-sm uppercase text-center">
          Inventory
        </div>
        <div className="grid grid-cols-4 gap-1">
          {items.map((item, index) => (
            <div
              key={index}
              className="w-10 h-10 bg-gray-800 border border-gray-600 rounded flex items-center justify-center hover:border-yellow-500 transition-colors cursor-pointer"
              title={item || 'Empty Slot'}
            >
              {item && <span className="text-xs text-white truncate">{item}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
