import type { BaseConfig, ContentConfig, ContentMode } from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';

interface ModelSettingsProps {
  content: ContentConfig;
  base: BaseConfig;
  onContentChange: (updates: Partial<ContentConfig>) => void;
}

const MODE_OPTIONS = [
  { value: 'embossed', label: 'Embossed (raised)' },
  { value: 'engraved', label: 'Engraved (recessed)' },
];

export function ModelSettings({ content, base, onContentChange }: ModelSettingsProps) {
  const engravedTooDeep = content.mode === 'engraved' && content.contentHeight >= base.thickness;
  const embossedWarning = content.mode === 'embossed' && content.contentHeight > 8;

  return (
    <div className="space-y-3">
      <Select
        label="Content Mode"
        value={content.mode}
        options={MODE_OPTIONS}
        onChange={v => onContentChange({ mode: v as ContentMode })}
      />

      <Slider
        label="Content Height"
        value={content.contentHeight}
        min={0.5}
        max={5}
        step={0.1}
        onChange={v => onContentChange({ contentHeight: v })}
      />

      {engravedTooDeep && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Engraving depth ({content.contentHeight}mm) equals or exceeds base thickness ({base.thickness}mm) — the content will punch through. Reduce depth or increase base thickness.
        </p>
      )}
      {embossedWarning && (
        <p className="flex items-center gap-1.5 text-xs text-amber-400">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Tall embossed content may require supports when printing.
        </p>
      )}
    </div>
  );
}
