import type { ReactNode } from 'react';
import type { GeneratorType } from '../../types/model';

interface GeneratorTabsProps {
  value: GeneratorType;
  onChange: (value: GeneratorType) => void;
}

interface TabDef {
  value: GeneratorType;
  label: string;
  icon: ReactNode;
}

const iconClass = 'w-4 h-4';

const TABS: TabDef[] = [
  {
    value: 'qr',
    label: 'QR Code',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM19 19h2v2h-2z" />
      </svg>
    ),
  },
  {
    value: 'text',
    label: 'Text',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M5 7V5h14v2M12 5v14M9 19h6" />
      </svg>
    ),
  },
  {
    value: 'spotify',
    label: 'Spotify',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M7 10c3-1 7-1 10 1M7.5 13c2.5-0.6 5.5-0.3 8 1M8 16c2-0.4 4-0.2 6 0.6" />
      </svg>
    ),
  },
  {
    value: 'wifi',
    label: 'WiFi',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M5 12a11 11 0 0114 0M8 15a7 7 0 018 0M11 18a3 3 0 012 0" />
        <circle cx="12" cy="19" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'vcard',
    label: 'vCard',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="11" r="2" />
        <path d="M5 17c0-2 2-3 4-3s4 1 4 3M15 9h4M15 13h4" />
      </svg>
    ),
  },
  {
    value: 'barcode',
    label: 'Barcode',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M4 5v14M7 5v14M10 5v14M13 5v14M16 5v14M19 5v14M21 5v14" />
      </svg>
    ),
  },
  {
    value: 'image',
    label: 'Image',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="M21 16l-5-5-9 9" />
      </svg>
    ),
  },
  {
    value: 'lithophane',
    label: 'Litho',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M4 14l4-4 4 4M12 14l4-4 4 4" />
      </svg>
    ),
  },
  {
    value: 'nameplate',
    label: 'Nameplate',
    icon: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="7" width="18" height="10" rx="1.5" />
        <path d="M7 11h10M7 14h6" />
      </svg>
    ),
  },
];

export function GeneratorTabs({ value, onChange }: GeneratorTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 p-2">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-md border text-[10px] font-medium transition-colors ${
              active
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
            title={tab.label}
          >
            <span className={active ? 'text-white' : 'text-gray-400'}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
