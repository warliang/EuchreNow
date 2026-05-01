import React from 'react';
import { twJoin } from 'tailwind-merge';

import type { Card as CardType } from '@euchrenow/engine';

type Props = CardType;

const Card = ({ suit, rank }: Props) => {
  let suitSymbol = '';
  switch (suit) {
    case 'hearts':
      suitSymbol = '♥';
      break;
    case 'diamonds':
      suitSymbol = '♦';
      break;
    case 'clubs':
      suitSymbol = '♣';
      break;
    case 'spades':
      suitSymbol = '♠';
      break;
  }

  let colorClass = '';
  if (suit === 'hearts' || suit === 'diamonds') {
    colorClass = 'text-red-400';
  } else {
    colorClass = 'text-white';
  }

  return (
    <div className="relative flex flex-col justify-between w-12 h-17 p-1 border border-border bg-card-bg rounded-xl">
      <div className={twJoin('flex flex-col leading-none', colorClass)}>
        <span className="text-md font-medium">{rank}</span>
        <span className="text-sm">{suitSymbol}</span>
      </div>
      <div
        className={twJoin(
          'absolute text-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          colorClass,
        )}
      >
        {suitSymbol}
      </div>
      <div className={twJoin('flex flex-col text-sm leading-none rotate-180', colorClass)}>
        <span className="text-md font-medium">{rank}</span>
        <span className="text-sm ">{suitSymbol}</span>
      </div>
    </div>
  );
};

export default Card;
