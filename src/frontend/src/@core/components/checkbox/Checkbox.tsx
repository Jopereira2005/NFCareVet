import type { InputHTMLAttributes } from 'react';

import './Checkbox.scss';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'type'> & {
  label: string;
};

export function Checkbox({ label, ...inputProps }: CheckboxProps) {
  return (
    <label className="ui-checkbox">
      <input {...inputProps} type="checkbox" />
      <span className="ui-checkbox__box" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
