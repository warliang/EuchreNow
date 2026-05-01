import React, { useState } from 'react';

import type { GameSettings } from '@euchrenow/engine';

import Button from '../Button';

type Props = {
  onCreateGame: (gameSettings: GameSettings) => void;
};

const Settings = ({ onCreateGame }: Props) => {
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    stickTheDealer: true,
    goingAlone: true,
  });

  const onSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setGameSettings((prev) => ({ ...prev, [name]: checked }));
  };

  return (
    <div className="h-full w-full flex flex-col items-center p-4">
      <h3 className="text-2xl font-sembold">Select game options:</h3>
      <div className="flex flex-col h-full w-full p-4 justify-between items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreateGame(gameSettings);
          }}
          className="flex flex-col h-full w-8/10 items-center"
        >
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
          <Button type="submit" className="mt-auto self-end">
            Create Game
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
