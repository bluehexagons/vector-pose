import React, {useEffect, useState} from 'react';

interface AngleInputProps {
  value: number;
  onChange: (value: number) => void;
}

export const AngleInput: React.FC<AngleInputProps> = ({value, onChange}) => {
  const [rawValue, setRawValue] = useState(value.toString());

  useEffect(() => {
    const parsed = parseFloat(rawValue);
    if (!parsed || Math.abs(value - parsed) > 0.002) {
      setRawValue(value.toString());
    }
  }, [value, rawValue]);

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    setRawValue(newValue);

    const parsed = parseFloat(newValue);
    if (Number.isFinite(parsed)) {
      onChange(parsed);
    }
  };

  return <input value={rawValue} onChange={handleChange} />;
};
