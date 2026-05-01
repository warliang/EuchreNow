import React from 'react';

import Button from '../Button';
import User from './User';

type Props = {
  roomId: string;
};

const Lobby = ({ roomId }: Props) => {
  return (
    <div className="flex flex-col w-full p-2">
      <div className="flex">{`Room ID: ${roomId}`}</div>
      <div className="flex flex-col flex-1 gap-1 justify-center items-center w-full">
        <User username="user123x" />
        <div className="flex items-center gap-1">
          <User username="fkjdsalf" />
          <div className="size-50 bg-active-bg rounded-full" />
          <User username="omgsdt" />
        </div>
        <User username="loluser" />
      </div>
      <div className="flex justify-end gap-1">
        <Button variant="secondary">Leave</Button>
        <Button>Start</Button>
      </div>
    </div>
  );
};

export default Lobby;
