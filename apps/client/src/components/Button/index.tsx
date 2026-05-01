import React from 'react';
import { twMerge } from 'tailwind-merge';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const Button = (props: Props) => {
  const { children, className = '', variant = 'primary', ...restProps } = props;
  const BASE_STYLES = 'cursor-pointer py-1 px-2 rounded-lg';
  return (
    <button
      className={twMerge(
        BASE_STYLES,
        variant === 'primary'
          ? 'bg-btn-primary hover:bg-btn-active'
          : 'border-1 border-btn-primary hover:bg-btn-primary',
        className,
      )}
      {...restProps}
    >
      {children}
    </button>
  );
};

export default Button;
