import React, {useEffect, useRef, useState} from 'react';
import './NumberInput.css';

interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  allowUndefined?: boolean;
  precision?: number;
}

const isValidNumber = (num: number) => Number.isFinite(num);

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
    const valueChanged =
      value !== lastValueRef.current &&
      (value === undefined ||
        lastValueRef.current === undefined ||
        Math.abs(value - lastValueRef.current) > 0.001);
    if (valueChanged) {
      setDisplayValue(value?.toFixed(precision) ?? '');
      lastValueRef.current = value;
    }
  }, [value, precision]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    setDisplayValue(newValue);

    // Allow incomplete numbers during typing
    if (newValue === '') {
      if (allowUndefined) {
        lastValueRef.current = undefined;
        onChange(undefined);
      }
      return;
    }

    if (newValue === '-' || newValue === '.' || newValue === '-.') {
      return;
    }

    const parsed = Number(newValue);
    if (isValidNumber(parsed)) {
      lastValueRef.current = parsed;
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    if (displayValue === '' && allowUndefined) return;

    if (!isValidNumber(Number(displayValue))) {
      setDisplayValue(value?.toFixed(precision) ?? '');
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`number-input ${className}`}
      {...inputProps}
    />
  );
};
