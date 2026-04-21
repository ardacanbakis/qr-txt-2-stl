import type { ContentConfig, ContentMode } from '../../types/model';
import { Select } from '../shared/Select';
import { Slider } from '../shared/Slider';

interface ModelSettingsProps {
  content: ContentConfig;
  onContentChange: (updates: Partial<ContentConfig>) => void;
}

const MODE_OPTIONS = [
  { value: 'embossed', label: 'Embossed (raised)' },
  { value: 'engraved', label: 'Engraved (recessed)' },
];

export function ModelSettings({ content, onContentChange }: ModelSettingsProps) {
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
    </div>
  );
}
