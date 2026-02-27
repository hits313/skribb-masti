import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { DrawingCanvas } from '../canvas/DrawingCanvas';
import { motion } from 'motion/react';
import { ChatPanel } from '../chat/ChatPanel';

export function GameScreen() {
  const { roomState, currentPlayer, secretWord } = useGameStore();

  if (!roomState) return null;

  const isDrawer = roomState.currentDrawerId === currentPlayer?.id;

  return (
    <div className="min-h-screen p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-4 bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-display text-cyan-400">
            Round {roomState.currentRound}/{roomState.totalRounds}
          </div>
          <div className="text-xl font-mono bg-black/30 px-3 py-1 rounded-lg">
            ⏱ {roomState.timeLeft}s
          </div>
        </div>
        
        <div className="text-3xl font-mono tracking-[0.5em] font-bold text-white">
          {isDrawer ? (
            <span className="text-cyan-400">{secretWord}</span>
          ) : (
            roomState.wordBlanks || "WAITING"
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Score</span>
          <span className="text-xl font-bold text-yellow-400">{currentPlayer?.score || 0}</span>
        </div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        {/* Left: Player List */}
        <div className="hidden lg:block space-y-2 overflow-y-auto max-h-[600px] pr-2">
          {roomState.players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-xl flex items-center gap-3 border ${
                player.id === currentPlayer?.id 
                  ? 'bg-white/10 border-cyan-400/50' 
                  : 'bg-black/20 border-white/5'
              }`}
            >
              <div className="text-2xl">{player.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-sm">{player.username}</div>
                <div className="text-xs text-gray-400">{player.score} pts</div>
              </div>
              {i === 0 && <span>👑</span>}
            </motion.div>
          ))}
        </div>

        {/* Center: Canvas */}
        <div className="lg:col-span-2 flex flex-col">
          <DrawingCanvas />
        </div>

        {/* Right: Chat */}
        <ChatPanel />
      </div>
    </div>
  );
}
