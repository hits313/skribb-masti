import React, { useEffect } from 'react';
import { socket } from './lib/socket';
import { useGameStore } from './store/gameStore';
import { Home } from './components/Home';
import { Lobby } from './components/lobby/LobbyScreen';
import { RoomState } from '../shared/types';

export default function App() {
  const { setConnected, isInRoom, addPlayer, removePlayer, setRoomState } = useGameStore();

  useEffect(() => {
    socket.connect();

    function onConnect() {
      setConnected(true);
    }

    function onDisconnect() {
      setConnected(false);
    }

    function onPlayerJoined(player: any) {
      addPlayer(player);
    }

    function onPlayerLeft(playerId: string) {
      removePlayer(playerId);
    }

    function onRoomSettingsUpdated(state: RoomState) {
      setRoomState(state);
    }


    function onTimerUpdate(timeLeft: number) {
      useGameStore.setState((state) => {
        if (state.roomState) {
          return {
            roomState: {
              ...state.roomState,
              timeLeft
            }
          };
        }
        return state;
      });
    }

    function onYourTurn(word: string) {
      useGameStore.getState().setSecretWord(word);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:playerJoined', onPlayerJoined);
    socket.on('room:playerLeft', onPlayerLeft);
    socket.on('room:settingsUpdated', onRoomSettingsUpdated);
    socket.on('game:timer', onTimerUpdate);
    socket.on('game:yourTurn', onYourTurn);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:playerJoined', onPlayerJoined);
      socket.off('room:playerLeft', onPlayerLeft);
      socket.off('room:settingsUpdated', onRoomSettingsUpdated);
      socket.off('game:timer', onTimerUpdate);
      socket.off('game:yourTurn', onYourTurn);
      socket.disconnect();
    };
  }, [setConnected, addPlayer, removePlayer]);

  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-body overflow-hidden">
      {isInRoom ? <Lobby /> : <Home />}
    </div>
  );
}
