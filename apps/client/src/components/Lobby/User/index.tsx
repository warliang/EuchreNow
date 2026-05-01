import React from 'react';

import UserBase from '../../User';

type Props = {
  username: string;
};

const User = ({ username }: Props) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <p>{username}</p>
      <UserBase username={username} />
    </div>
  );
};

export default User;
