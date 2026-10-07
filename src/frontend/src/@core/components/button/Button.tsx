import { useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type PointerEvent } from 'react';

import './Button.scss';

type ButtonVariant = 'primary' | 'outlined' | 'icon';

type Ripple = {
  id: number;
  left: number;
  top: number;
  size: number;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  children,
  className = '',
  onClick,
  onPointerDown,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  const addRipple = (button: HTMLButtonElement, clientX: number, clientY: number) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const bounds = button.getBoundingClientRect();
    const size = Math.hypot(bounds.width, bounds.height) * 2;

    setRipples((current) => [
      ...current,
      {
        id: rippleId.current++,
        left: clientX - bounds.left - size / 2,
        top: clientY - bounds.top - size / 2,
        size,
      },
    ]);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    onPointerDown?.(event);
    if (!event.defaultPrevented) {
      addRipple(event.currentTarget, event.clientX, event.clientY);
    }
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented && event.detail === 0) {
      const bounds = event.currentTarget.getBoundingClientRect();
      addRipple(event.currentTarget, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    }
  };

  const removeRipple = (id: number) => {
    setRipples((current) => current.filter((ripple) => ripple.id !== id));
  };

  return (
    <button
      {...props}
      className={`ui-button ui-button--${variant}${className ? ` ${className}` : ''}`}
      type={type}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ui-button__ripple"
          aria-hidden="true"
          style={{ left: ripple.left, top: ripple.top, width: ripple.size, height: ripple.size }}
          onAnimationEnd={() => removeRipple(ripple.id)}
        />
      ))}
      <span className="ui-button__content">{children}</span>
    </button>
  );
}
