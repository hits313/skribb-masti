import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion } from 'motion/react';
import { socket } from '../../lib/socket';

export function GameEndScreen() {
  const { roomState, currentPlayer } = useGameStore();

  if (!roomState) return null;

  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isHost = roomState.players.find(p => p.id === currentPlayer?.id)?.isHost;

  const handleReturnToLobby = () => {
    if (isHost) {
      socket.emit('room:reset', { roomCode: roomState.id });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 max-w-2xl w-full text-center"
      >
        <h1 className="text-6xl font-display text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-8">
          Game Over!
        </h1>

        <div className="mb-12">
          <div className="text-2xl text-gray-400 mb-4">Winner</div>
          <div className="text-8xl mb-4">{winner.avatar}</div>
          <div className="text-4xl font-bold text-white mb-2">{winner.username}</div>
          <div className="text-2xl text-yellow-400 font-mono">{winner.score} pts</div>
        </div>

        <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto">
          {sortedPlayers.slice(1).map((player, i) => (
            <div key={player.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-4">
                <span className="text-xl font-mono text-gray-500">#{i + 2}</span>
                <span className="text-2xl">{player.avatar}</span>
                <span className="font-bold">{player.username}</span>
              </div>
              <span className="font-mono text-yellow-400/80">{player.score} pts</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            onClick={handleReturnToLobby}
            className="bg-white text-black font-bold py-4 px-8 rounded-xl hover:scale-105 transition-transform"
          >
            Return to Lobby
          </button>
        )}
      </motion.div>
    </div>
  );
}
