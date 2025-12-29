import { useState } from 'react';

interface LoginScreenProps {
  onPlay: (name: string) => void;
}

export const LoginScreen = ({ onPlay }: LoginScreenProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onPlay(name);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8 bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          BrowserQuest
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Character Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your name..."
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-3 px-4 bg-linear-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-400 hover:to-orange-500 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play Now
          </button>
        </form>
      </div>
    </div>
  );
};
