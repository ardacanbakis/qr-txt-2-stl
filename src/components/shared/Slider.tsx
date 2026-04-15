import { useState, useEffect } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 1, unit = 'mm', onChange }: SliderProps) {
  const [localVal, setLocalVal] = useState(String(value));

  // Sync display when external value changes (e.g. preset applied)
  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  function commit(raw: string) {
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      const clamped = Math.min(max, Math.max(min, n));
      onChange(clamped);
      setLocalVal(String(clamped));
    } else {
      setLocalVal(String(value));
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <label className="text-gray-300 truncate">{label}</label>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={localVal}
            min={min}
            max={max}
            step={step}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
            className="w-14 bg-gray-700 text-gray-200 text-xs font-mono rounded px-1.5 py-0.5 border border-gray-600 focus:border-blue-500 focus:outline-none text-right"
          />
          {unit && <span className="text-xs text-gray-500 w-5">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}
