import { useState } from 'react';

import { socket } from '../socket';

type SelectOption = 'play' | 'create' | 'join';

const Home = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [selected, setSelected] = useState<SelectOption>('join');

  const onCreateGame = () => {
    socket.emit(
      'lobby:create',
      { playerName: 'Player1', settings: { stickTheDealer: true, goingAlone: true } },
      (response) => {
        if (response.success) {
          setRoomId(response.roomId!);
        } else {
          console.error('Failed to create game: ', response.error);
        }
      },
    );
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
      <div className="flex mt-16 w-4xl h-6/10 border-2 border-border rounded-2xl">
        {!roomId && (
          <div className="flex flex-col h-full w-20 border-r border-r-border">
            {selectButtons.map((btn, index) => (
              <button
                key={btn.value}
                aria-selected={selected === btn.value}
                onClick={() => {
                  setSelected(btn.value);
                  btn.onClick();
                }}
                className={`cursor-pointer py-2 px-2 hover:text-primary hover:bg-gray-800 aria-selected:text-primary  aria-selected:bg-gray-800 ${btn.class || ''} ${index === 0 && 'rounded-tl-2xl'}`}
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
              <form>
                <div className="flex flex-col gap-2">
                  <label>
                    <input type="checkbox" className="mr-2" />
                    Stick the Dealer
                  </label>
                  <label>
                    <input type="checkbox" className="mr-2" />
                    Allow Going Alone
                  </label>
                </div>
              </form>
              <button type="submit" className="bg-primary py-1 px-2 rounded-lg self-end">
                Create Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
