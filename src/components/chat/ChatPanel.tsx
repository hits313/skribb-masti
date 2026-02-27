import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../lib/socket';
import { useGameStore } from '../../store/gameStore';
import { ChatMessage } from '../../../shared/types';
import { motion, AnimatePresence } from 'motion/react';

export function ChatPanel() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentPlayer } = useGameStore();

  useEffect(() => {
    const handleMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat:message', handleMessage);
    return () => {
      socket.off('chat:message', handleMessage);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('chat:send', { message: message.trim() });
    setMessage('');
  };

  return (
    <div className="bg-black/20 rounded-xl border border-white/10 flex flex-col h-[600px]">
      <div className="p-3 border-b border-white/10 font-display text-sm uppercase tracking-wider text-gray-400">
        Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center text-gray-500 text-sm italic">
          Game started! Good luck!
        </div>
        
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.playerId === currentPlayer?.id ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.type === 'SYSTEM' ? 'bg-yellow-500/20 text-yellow-200 w-full text-center' :
                msg.type === 'GUESS' ? 'bg-green-500/20 text-green-200 w-full text-center font-bold' :
                msg.playerId === currentPlayer?.id ? 'bg-cyan-500/20 text-cyan-100' : 'bg-white/10 text-gray-200'
              }`}>
                {msg.type === 'CHAT' && (
                  <span className="text-xs font-bold opacity-50 block mb-1">
                    {msg.username}
                  </span>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your guess here..."
          maxLength={100}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-400 transition-colors"
        />
      </form>
    </div>
  );
}
