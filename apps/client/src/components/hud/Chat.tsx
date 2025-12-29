import { useEffect, useRef, useState } from 'react';
import type { Game } from '../../game/Game';

interface ChatProps {
  game: Game;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: 'global' | 'system' | 'local';
}

export const Chat = ({ game }: ChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onChat = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data].slice(-50)); // Keep last 50 messages
    };

    game.on('chat', onChat);
    return () => {
      game.off('chat', onChat);
    };
  }, [game]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !isOpen) {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      game.emit('send_chat', inputValue.trim()); // Send to game engine which sends to server
      setInputValue('');
      setIsOpen(false);
      // game.container?.focus(); // Return focus to game
    }
  };

  return (
    <div
      className={`absolute bottom-4 left-4 w-96 flex flex-col gap-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
    >
      <div className="bg-gray-900/80 border-2 border-gray-600 rounded-lg p-2 h-48 overflow-y-auto flex flex-col gap-1 shadow-lg pointer-events-auto">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            {msg.type === 'system' ? (
              <span className="text-yellow-400 italic">{msg.text}</span>
            ) : (
              <>
                <span className="text-blue-400 font-bold">{msg.sender}:</span>{' '}
                <span className="text-white">{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="pointer-events-auto">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full bg-gray-900/90 border-2 border-gray-500 rounded px-3 py-2 text-white focus:outline-hidden focus:border-yellow-500"
            placeholder="Press Enter to send message..."
          />
        </form>
      )}
      {!isOpen && (
        <div className="text-gray-400 text-xs px-2 shadow-black drop-shadow-md">
          Press Enter to chat
        </div>
      )}
    </div>
  );
};
