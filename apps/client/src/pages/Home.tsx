import { useState } from 'react';

import type { GameSettings } from '@euchrenow/engine';

import { socket } from '../socket';

import Settings from '../components/Settings';

type SelectOption = 'play' | 'create' | 'join';

const Home = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [selected, setSelected] = useState<SelectOption>('play');

  const onCreateGame = (gameSettings: GameSettings) => {
    socket.emit('lobby:create', { playerName: 'Player1', settings: gameSettings }, (response) => {
      if (response.success) {
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

  let content = null;
  switch (selected) {
    case 'play':
    case 'create':
      content = <Settings onCreateGame={onCreateGame} />;
      break;
    case 'join':
      content = <div>Join form goes here</div>;
      break;
  }

  return (
    <div className="h-full w-full flex justify-center">
      <div className="flex mt-14 w-4xl h-7/10 border-2 border-border rounded-2xl overflow-hidden">
        {!roomId && (
          <div className="flex flex-col h-full min-w-20 border-r border-r-border">
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
          content
        )}
      </div>
    </div>
  );
};

export default Home;
