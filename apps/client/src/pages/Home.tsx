import { useState } from 'react';

import { socket } from '../socket';

import type { GameSettings } from '@euchrenow/engine';

type SelectOption = 'play' | 'create' | 'join';

const Home = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [selected, setSelected] = useState<SelectOption>('join');

  const [gameSettings, setGameSettings] = useState<GameSettings>({
    stickTheDealer: true,
    goingAlone: true,
  });

  const onSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setGameSettings((prev) => ({ ...prev, [name]: checked }));
  };

  const onCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit('lobby:create', { playerName: 'Player1', settings: gameSettings }, (response) => {
      if (response.success) {
        console.log('Game created with ID: ', response.roomId);
        console.log('Response: ', response);
        setRoomId(response.roomId!);
      } else {
        console.error('Failed to create game: ', response.error);
      }
    });
  };

  const selectButtons: {
    label: string;
    value: SelectOption;
    onClick: () => void;
    class?: string;
  }[] = [
    {
      label: 'Play Now',
      value: 'play',
      onClick: () => setSelected('play'),
      class: 'text-white font-bold bg-btn-active',
    },
    { label: 'Create Lobby', value: 'create', onClick: () => setSelected('create') },
    { label: 'Join', value: 'join', onClick: () => setSelected('join') },
  ];

  return (
    <div className="h-full w-full flex justify-center">
      <div className="flex mt-14 w-4xl h-7/10 border-2 border-border rounded-2xl overflow-hidden">
        {!roomId && (
          <div className="flex flex-col h-full w-20 border-r border-r-border">
            {selectButtons.map((btn) => (
              <button
                key={btn.value}
                aria-selected={selected === btn.value}
                onClick={() => {
                  setSelected(btn.value);
                  btn.onClick();
                }}
                className={`cursor-pointer py-2 px-2 hover:text-primary hover:bg-gray-800 aria-selected:text-primary  aria-selected:bg-gray-800 ${btn.class || ''}`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}
        {roomId ? (
          <div>
            <div>Room ID: {roomId}</div>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center p-4">
            <h3 className="text-2xl font-sembold">Select game options:</h3>
            <div className="flex flex-col h-full w-full p-4 justify-between items-center">
              <form onSubmit={onCreateGame} className="flex flex-col h-full w-8/10 items-center">
                <div className="flex flex-col gap-2">
                  <label>
                    <input
                      type="checkbox"
                      name="stickTheDealer"
                      checked={gameSettings.stickTheDealer}
                      onChange={onSettingsChange}
                      className="mr-2"
                    />
                    Stick the Dealer
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name="goingAlone"
                      checked={gameSettings.goingAlone}
                      onChange={onSettingsChange}
                      className="mr-2"
                    />
                    Going Alone
                  </label>
                </div>
                <button
                  type="submit"
                  className="cursor-pointer bg-btn-primary hover:bg-btn-active py-1 px-2 rounded-lg mt-auto self-end"
                >
                  Create Game
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
