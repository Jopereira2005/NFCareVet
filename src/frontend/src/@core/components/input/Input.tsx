import type { InputHTMLAttributes, ReactNode } from 'react';

import './Input.scss';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
} & ({ label: string; id: string } | { label?: undefined; id?: string });

export function Input({ className = '', id, label, leadingIcon, trailingAction, ...inputProps }: InputProps) {
  return (
    <div className="ui-input">
      {label && (
        <label className="ui-input__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="ui-input__control">
        {leadingIcon && (
          <span className="ui-input__leading-icon" aria-hidden="true">
            {leadingIcon}
          </span>
        )}
        <input {...inputProps} id={id} className={`ui-input__field${className ? ` ${className}` : ''}`} />
        {trailingAction}
      </div>
    </div>
  );
}
