import React, { useEffect, useState } from "react";
import { toDegrees, toRadians } from "../utils/Equa";

interface AngleInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const AngleInput: React.FC<AngleInputProps> = ({ value, onChange }) => {
  const [rawValue, setRawValue] = useState("");

  useEffect(() => {
    const parsed = parseFloat(rawValue);
    if (parsed && Math.abs(value - parsed) > 0.002) {
      setRawValue(`${value}`);
    }
  }, [value]);

  return (
    <input
      value={rawValue}
      onChange={(evt) => {
        const value = evt.target.value;
        const parsed = parseFloat(value);
        setRawValue(value);

        if (Number.isFinite(parsed)) {
          onChange(parsed);
        } 
      }}
    />
  );
};
