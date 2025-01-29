import React, {useEffect, useRef, useState} from 'react';
import './NumberInput.css';

interface NumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange'
  > {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowUndefined?: boolean;
  precision?: number;
}

const isValidNumber = (num: number) => !isNaN(num) && isFinite(num);

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  allowUndefined = false,
  precision = 3,
  className = '',
  ...inputProps
}) => {
  const [displayValue, setDisplayValue] = useState(
    () => value?.toFixed(precision) ?? ''
  );
  const lastValueRef = useRef(value);

  useEffect(() => {
    // Only update display if external value changed significantly
    if (Math.abs((value ?? 0) - (lastValueRef.current ?? 0)) > 0.001) {
      setDisplayValue(value?.toFixed(precision) ?? '');
      lastValueRef.current = value;
    }
  }, [value, precision]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    setDisplayValue(newValue);

    // Allow incomplete numbers during typing
    if (
      newValue === '-' ||
      newValue === '.' ||
      newValue === '-.' ||
      newValue === ''
    ) {
      return;
    }

    const parsed = parseFloat(newValue);
    if (isValidNumber(parsed)) {
      lastValueRef.current = parsed;
      onChange(parsed);
    } else if (allowUndefined && newValue === '') {
      lastValueRef.current = undefined;
      onChange(undefined);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      className={`number-input ${className}`}
      {...inputProps}
    />
  );
};
