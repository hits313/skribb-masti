import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AVATARS } from '../lib/constants';
import { socket } from '../lib/socket';
import { useGameStore } from '../store/gameStore';
import { GameSettings } from '../../shared/types';

export function Home() {
  const [username, setUsername] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [roomCode, setRoomCode] = useState('');

  const [error, setError] = useState('');
  
  const { setRoomState, setPlayer } = useGameStore();

  const handleCreateRoom = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    
    const settings: GameSettings = {
      maxPlayers: 8,
      rounds: 3,
      drawTime: 80,
      hintReveals: 2,
      language: 'English',
      gameMode: 'CLASSIC',
      wordChoices: 3,
      allowProfanity: false,
      privateRoom: true
    };

    socket.emit('room:create', { 
      settings, 
      username, 
      avatar: AVATARS[avatarIndex] 
    }, (response) => {
      if (response.success && response.roomState) {
        setRoomState(response.roomState);
        // Find self in players list
        const me = response.roomState.players.find(p => p.username === username); // Simple check, ideally use socket id
        if (me) setPlayer(me);
      } else {
        setError(response.error || 'Failed to create room');
      }
    });
  };

  const handleJoinRoom = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (!roomCode) {
      setError('Please enter a room code');
      return;
    }

    socket.emit('room:join', { 
      code: roomCode, 
      username, 
      avatar: AVATARS[avatarIndex] 
    }, (response) => {
      if (response.success && response.roomState) {
        setRoomState(response.roomState);
        const me = response.roomState.players.find(p => p.username === username);
        if (me) setPlayer(me);
      } else {
        setError(response.error || 'Failed to join room');
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-16 h-16 bg-cyan-400/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-bounce" />
      </div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 text-center mb-12"
      >
        <h1 className="text-6xl md:text-8xl font-display text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-lg">
          DrawParty 🎨
        </h1>
        <p className="text-xl text-gray-400 mt-4 font-body">
          Sketch, Guess, and Laugh!
        </p>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="z-10 w-full max-w-md bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        {/* Avatar Selection */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={() => setAvatarIndex((prev) => (prev + 1) % AVATARS.length)}
            className="text-6xl hover:scale-110 transition-transform cursor-pointer bg-white/10 p-4 rounded-full border-2 border-white/20 hover:border-cyan-400"
          >
            {AVATARS[avatarIndex]}
          </button>
        </div>

        {/* Username Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, 16))}
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-cyan-400 transition-colors text-center"
          />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:-translate-y-1"
          >
            Create Party
          </button>
          
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room Code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-center uppercase tracking-widest focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={handleJoinRoom}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 rounded-xl shadow-lg transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-center text-sm animate-shake">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}
