import React, {useEffect, useState, useRef} from 'react';
import './AngleInput.css';

interface AngleInputProps {
  value: number;
  onChange: (value: number) => void;
  draggable: boolean;
}

const isValidAngle = (angle: number) => !isNaN(angle);

export const AngleInput: React.FC<AngleInputProps> = ({
  value,
  onChange,
  ...inputProps
}) => {
  const [displayValue, setDisplayValue] = useState(value.toString());
  const lastValueRef = useRef(value);

  useEffect(() => {
    // Only update display if external value changed significantly
    if (Math.abs(value - lastValueRef.current) > 0.02) {
      setDisplayValue(value.toFixed(3));
      lastValueRef.current = value;
    }
  }, [value]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    setDisplayValue(newValue);

    // Allow incomplete numbers like "-", "." etc during typing
    if (
      newValue === '-' ||
      newValue === '.' ||
      newValue === '-.' ||
      newValue === ''
    ) {
      return;
    }

    const parsed = parseFloat(newValue);
    if (isValidAngle(parsed)) {
      lastValueRef.current = parsed;
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      className="angle-input"
      {...inputProps}
    />
  );
};
