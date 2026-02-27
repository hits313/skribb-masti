import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { GameScreen } from '../game/GameScreen';
import { GameEndScreen } from '../game/GameEndScreen';
import { socket } from '../../lib/socket';

export function Lobby() {
  const { roomState, currentPlayer } = useGameStore();

  if (!roomState) return null;

  // If game is playing, show GameScreen
  if (roomState.status === 'PLAYING') {
    return <GameScreen />;
  }

  // If game ended, show GameEndScreen
  if (roomState.status === 'GAME_END') {
    return <GameEndScreen />;
  }

  const shareUrl = `${window.location.origin}/?room=${roomState.id}`;

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Players */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-2xl font-display mb-4 flex items-center gap-2">
              <span>👥</span> Players ({roomState.players.length}/{roomState.settings.maxPlayers})
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {roomState.players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-black/20 rounded-xl p-4 flex items-center gap-3 border border-white/5"
                >
                  <div className="text-3xl">{player.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">{player.username}</div>
                    {player.isHost && (
                      <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
                        👑 Host
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, roomState.settings.maxPlayers - roomState.players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white/5 rounded-xl p-4 flex items-center justify-center border border-white/5 border-dashed opacity-50">
                  <span className="text-sm text-gray-500">Waiting...</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Room Info & Settings */}
        <div className="space-y-6">
          {/* Room Code Card */}
          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
            <h3 className="text-gray-400 text-sm uppercase tracking-widest mb-2">Room Code</h3>
            <div className="text-5xl font-mono font-bold text-cyan-400 tracking-wider mb-4 select-all">
              {roomState.id}
            </div>
            
            <div className="flex justify-center mb-4 bg-white p-2 rounded-lg w-fit mx-auto">
              <QRCodeSVG value={shareUrl} size={120} />
            </div>
            
            <button 
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
            >
              Copy Invite Link
            </button>
          </div>

          {/* Game Settings Preview */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="font-display text-xl mb-4">Game Settings</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Rounds</span>
                <span className="font-bold text-white">{roomState.settings.rounds}</span>
              </div>
              <div className="flex justify-between">
                <span>Draw Time</span>
                <span className="font-bold text-white">{roomState.settings.drawTime}s</span>
              </div>
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-bold text-cyan-400">{roomState.settings.gameMode}</span>
              </div>
            </div>
          </div>

          {/* Start Button (Host Only) */}
          {currentPlayer?.isHost ? (
            <button 
              onClick={() => {
                socket.emit('room:start', { roomCode: roomState.id });
              }}
              className="w-full bg-green-500 hover:bg-green-400 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-green-900/20 transform transition hover:-translate-y-1"
            >
              Start Game 🚀
            </button>
          ) : (
            <div className="text-center text-gray-400 animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
