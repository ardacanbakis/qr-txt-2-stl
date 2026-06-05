import { useState, useEffect, useCallback } from 'react';
import type { ModelConfig } from '../../types/model';
import { DEFAULT_CONFIG } from '../../types/model';

type TemplateCategory = 'all' | 'keychains' | 'signs' | 'gifts' | 'contact' | 'media';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategory;
  tags: string[];
  config: Partial<ModelConfig>;
}

const TEMPLATES: Template[] = [
  // Keychains
  {
    id: 'spotify-keychain',
    name: 'Spotify Keychain',
    description: 'Scan-ready track code on a compact keychain plate',
    icon: '🎵',
    category: 'keychains',
    tags: ['music', 'gift', 'keychain'],
    config: {
      generator: 'spotify',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 100, height: 40, thickness: 3, cornerRadius: 4, borderWidth: 5, borderEnabled: true, keychainHole: true, edgeTreatment: 'fillet', filletRadius: 0.8 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
      spotify: { ...DEFAULT_CONFIG.spotify, showLogo: true },
    },
  },
  {
    id: 'qr-keychain',
    name: 'QR Keychain',
    description: 'Rounded keychain with a scannable QR code',
    icon: '🔑',
    category: 'keychains',
    tags: ['qr', 'keychain', 'link'],
    config: {
      generator: 'qr',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 55, height: 55, thickness: 3, cornerRadius: 6, borderWidth: 4, borderEnabled: true, keychainHole: true, edgeTreatment: 'fillet', filletRadius: 0.8 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed', errorCorrection: 'H' },
    },
  },
  {
    id: 'text-keychain',
    name: 'Text Keychain',
    description: 'Name or short word on a slim keychain tag',
    icon: '✏️',
    category: 'keychains',
    tags: ['text', 'keychain', 'label'],
    config: {
      generator: 'text',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 70, height: 25, thickness: 3, cornerRadius: 4, borderWidth: 3, borderEnabled: false, keychainHole: true, edgeTreatment: 'fillet', filletRadius: 0.6 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      text: { ...DEFAULT_CONFIG.text, text: 'My Keys', fontStyle: 'bold', size: 8, alignment: 'center' },
    },
  },

  // Signs & Labels
  {
    id: 'business-card-qr',
    name: 'Business Card QR',
    description: 'Credit-card sized plate with QR code',
    icon: '💼',
    category: 'signs',
    tags: ['qr', 'business', 'card'],
    config: {
      generator: 'qr',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 85, height: 54, thickness: 2, cornerRadius: 3, borderWidth: 4, edgeTreatment: 'chamfer', filletRadius: 0.5 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
    },
  },
  {
    id: 'wifi-sign',
    name: 'WiFi Sign',
    description: 'Large sign with WiFi QR code and network name',
    icon: '📶',
    category: 'signs',
    tags: ['wifi', 'sign', 'network'],
    config: {
      generator: 'wifi',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 100, height: 80, thickness: 3, cornerRadius: 5, borderWidth: 5, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      wifi: { ...DEFAULT_CONFIG.wifi, showText: true },
    },
  },
  {
    id: 'barcode-label',
    name: 'Barcode Label',
    description: 'Rectangular label with CODE 39 barcode',
    icon: '📦',
    category: 'signs',
    tags: ['barcode', 'label', 'inventory'],
    config: {
      generator: 'barcode',
      base: { ...DEFAULT_CONFIG.base, shape: 'rectangle', width: 80, height: 30, thickness: 2, borderWidth: 3, edgeTreatment: 'none', filletRadius: 0.5 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
      barcode: { ...DEFAULT_CONFIG.barcode, showText: true },
    },
  },
  {
    id: 'desk-nameplate',
    name: 'Desk Nameplate',
    description: 'Wide plate with primary + secondary text, for a desk',
    icon: '🖊️',
    category: 'signs',
    tags: ['nameplate', 'office', 'desk'],
    config: {
      generator: 'nameplate',
      base: { ...DEFAULT_CONFIG.base, shape: 'rectangle', width: 120, height: 45, thickness: 3, borderWidth: 6, borderEnabled: true, edgeTreatment: 'chamfer', filletRadius: 0.5 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.8, mode: 'embossed' },
      nameplate: { ...DEFAULT_CONFIG.nameplate, primarySize: 10, secondarySize: 5 },
    },
  },
  {
    id: 'door-sign',
    name: 'Door Sign',
    description: 'Tall portrait sign with text and room number',
    icon: '🚪',
    category: 'signs',
    tags: ['nameplate', 'sign', 'door'],
    config: {
      generator: 'nameplate',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 60, height: 90, thickness: 3, cornerRadius: 5, borderWidth: 5, borderEnabled: true, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      nameplate: { ...DEFAULT_CONFIG.nameplate, primaryText: 'Room 101', secondaryText: 'Conference', fontStyle: 'bold', primarySize: 9, secondarySize: 5 },
    },
  },

  // Gifts & Decor
  {
    id: 'name-tag',
    name: 'Name Tag Badge',
    description: 'Badge-sized nameplate with primary and secondary text',
    icon: '🏷️',
    category: 'gifts',
    tags: ['nameplate', 'badge', 'event'],
    config: {
      generator: 'nameplate',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 90, height: 55, thickness: 2.5, cornerRadius: 4, borderWidth: 5, edgeTreatment: 'chamfer', filletRadius: 0.8 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      nameplate: { ...DEFAULT_CONFIG.nameplate },
    },
  },
  {
    id: 'fridge-magnet',
    name: 'Fridge Magnet',
    description: 'Compact magnet with text label and back recess for magnet',
    icon: '🧲',
    category: 'gifts',
    tags: ['magnet', 'fridge', 'nameplate'],
    config: {
      generator: 'nameplate',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 70, height: 40, thickness: 4, cornerRadius: 4, borderWidth: 4, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      mounting: { ...DEFAULT_CONFIG.mounting, fridgeMagnet: true, fridgeMagnetWidth: 20, fridgeMagnetHeight: 5, fridgeMagnetDepth: 1.5 },
    },
  },
  {
    id: 'lithophane-frame',
    name: 'Lithophane',
    description: 'Backlit photo panel, standard size',
    icon: '🖼️',
    category: 'gifts',
    tags: ['lithophane', 'photo', 'backlit'],
    config: {
      generator: 'lithophane',
      base: { ...DEFAULT_CONFIG.base, width: 80, height: 80, thickness: 3 },
      lithophane: { ...DEFAULT_CONFIG.lithophane, minThickness: 0.6, maxThickness: 3.2 },
    },
  },
  {
    id: 'spotify-gift',
    name: 'Spotify Plaque',
    description: 'Larger wall-mount plaque with a Spotify scannable',
    icon: '🎶',
    category: 'gifts',
    tags: ['spotify', 'music', 'wall mount'],
    config: {
      generator: 'spotify',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 120, height: 60, thickness: 3, cornerRadius: 6, borderWidth: 6, borderEnabled: true, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      spotify: { ...DEFAULT_CONFIG.spotify, showLogo: true },
      mounting: { ...DEFAULT_CONFIG.mounting, wallMount: true },
    },
  },
  {
    id: 'photo-litho-round',
    name: 'Round Lithophane',
    description: 'Circular backlit photo panel for display',
    icon: '☕',
    category: 'gifts',
    tags: ['lithophane', 'photo', 'circle'],
    config: {
      generator: 'lithophane',
      base: { ...DEFAULT_CONFIG.base, shape: 'circle', width: 90, height: 90, thickness: 3, borderWidth: 0, borderEnabled: false, edgeTreatment: 'none' },
      lithophane: { ...DEFAULT_CONFIG.lithophane, minThickness: 0.6, maxThickness: 3.2 },
    },
  },

  // Contact / Personal
  {
    id: 'vcard-circle',
    name: 'Contact Coin',
    description: 'Round plate with vCard QR code',
    icon: '👤',
    category: 'contact',
    tags: ['vcard', 'contact', 'circle'],
    config: {
      generator: 'vcard',
      base: { ...DEFAULT_CONFIG.base, shape: 'circle', width: 60, height: 60, thickness: 3, borderWidth: 4, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
    },
  },
  {
    id: 'vcard-card',
    name: 'Contact Card',
    description: 'Business card with vCard QR plus name label',
    icon: '📇',
    category: 'contact',
    tags: ['vcard', 'contact', 'business'],
    config: {
      generator: 'vcard',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 85, height: 54, thickness: 2.5, cornerRadius: 3, borderWidth: 4, edgeTreatment: 'chamfer', filletRadius: 0.5 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
      vcard: { ...DEFAULT_CONFIG.vcard, showText: true },
    },
  },
  {
    id: 'wifi-home',
    name: 'Home WiFi Plaque',
    description: 'Elegant home WiFi QR with network name below',
    icon: '🏠',
    category: 'contact',
    tags: ['wifi', 'home', 'sign'],
    config: {
      generator: 'wifi',
      base: { ...DEFAULT_CONFIG.base, shape: 'rounded-rectangle', width: 90, height: 70, thickness: 3, cornerRadius: 6, borderWidth: 5, borderEnabled: true, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.5, mode: 'embossed' },
      wifi: { ...DEFAULT_CONFIG.wifi, showText: true },
    },
  },

  // Media
  {
    id: 'spotify-round',
    name: 'Spotify Disc',
    description: 'Round Spotify scannable like a vinyl record',
    icon: '💿',
    category: 'media',
    tags: ['spotify', 'music', 'circle'],
    config: {
      generator: 'spotify',
      base: { ...DEFAULT_CONFIG.base, shape: 'circle', width: 80, height: 80, thickness: 3, borderWidth: 5, borderEnabled: true, edgeTreatment: 'fillet', filletRadius: 1 },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 1.2, mode: 'embossed' },
      spotify: { ...DEFAULT_CONFIG.spotify, showLogo: true },
    },
  },
  {
    id: 'map-coaster',
    name: 'Map Tile',
    description: 'Extruded street/terrain tile of a special location',
    icon: '🗺️',
    category: 'media',
    tags: ['map', 'terrain', 'gift'],
    config: {
      generator: 'map',
      base: { ...DEFAULT_CONFIG.base, shape: 'rectangle', width: 100, height: 100, thickness: 3, borderWidth: 5, borderEnabled: true, edgeTreatment: 'none' },
      content: { ...DEFAULT_CONFIG.content, contentHeight: 2, mode: 'embossed' },
    },
  },
];

const CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '⊞' },
  { id: 'keychains', label: 'Keychains', icon: '🔑' },
  { id: 'signs', label: 'Signs & Labels', icon: '📋' },
  { id: 'gifts', label: 'Gifts & Decor', icon: '🎁' },
  { id: 'contact', label: 'Contact', icon: '📇' },
  { id: 'media', label: 'Music & Maps', icon: '🎵' },
];

const FAVORITES_KEY = 'stlsmith.template.favorites';
const RECENTS_KEY = 'stlsmith.template.recents';
const MAX_RECENTS = 5;

function loadFavorites(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')); }
  catch { return new Set(); }
}

function saveFavorites(favs: Set<string>) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favs])); } catch { /* quota */ }
}

function loadRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]'); }
  catch { return []; }
}

function addRecent(id: string) {
  const recents = loadRecents().filter(r => r !== id);
  recents.unshift(id);
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(recents.slice(0, MAX_RECENTS))); } catch { /* quota */ }
}

interface TemplatesPanelProps {
  onApply: (config: Partial<ModelConfig>) => void;
  onClose: () => void;
}

export function TemplatesPanel({ onApply, onClose }: TemplatesPanelProps) {
  const [category, setCategory] = useState<TemplateCategory>('all');
  const [search, setSearch] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(loadFavorites);
  const recents = loadRecents();

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFavorites(next);
      return next;
    });
  }, []);

  const handleApply = useCallback((t: Template) => {
    addRecent(t.id);
    onApply(t.config);
    onClose();
  }, [onApply, onClose]);

  const q = search.toLowerCase().trim();
  const filtered = TEMPLATES.filter(t => {
    const matchesCat = category === 'all' || t.category === category;
    const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tag => tag.includes(q));
    return matchesCat && matchesSearch;
  });

  const recentTemplates = recents
    .map(id => TEMPLATES.find(t => t.id === id))
    .filter((t): t is Template => !!t && (category === 'all' || t.category === category) && (!q || t.name.toLowerCase().includes(q)));

  const showRecents = recentTemplates.length > 0 && !q && category === 'all';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl w-[620px] max-w-[95vw] max-h-[88vh] flex flex-col"
        style={{ background: 'rgb(18 22 30)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700/60">
          <div>
            <h2 className="text-base font-semibold text-gray-100">Templates</h2>
            <p className="text-xs text-gray-500 mt-0.5">{TEMPLATES.length} ready-to-print presets</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                category === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="overflow-y-auto px-4 pb-4 space-y-4">
          {/* Recents */}
          {showRecents && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Recent</p>
              <div className="grid grid-cols-3 gap-2">
                {recentTemplates.map(t => (
                  <TemplateCard key={t.id} template={t} isFavorite={favorites.has(t.id)} onApply={handleApply} onToggleFav={toggleFavorite} compact />
                ))}
              </div>
            </div>
          )}

          {/* Main grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">No templates match your search.</div>
          ) : (
            <div>
              {showRecents && <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">All Templates</p>}
              <div className="grid grid-cols-3 gap-2">
                {filtered.map(t => (
                  <TemplateCard key={t.id} template={t} isFavorite={favorites.has(t.id)} onApply={handleApply} onToggleFav={toggleFavorite} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-700/60 text-xs text-gray-600">
          Applying a template replaces the current base and generator settings.
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  isFavorite: boolean;
  onApply: (t: Template) => void;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
  compact?: boolean;
}

function TemplateCard({ template: t, isFavorite, onApply, onToggleFav, compact }: TemplateCardProps) {
  return (
    <button
      onClick={() => onApply(t)}
      className={`relative flex flex-col gap-1 ${compact ? 'p-2.5' : 'p-3'} bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500/70 rounded-xl text-left transition-all group`}
      style={{ background: 'rgb(26 32 44)' }}
    >
      <div className="flex items-start justify-between">
        <span className={compact ? 'text-xl' : 'text-2xl'}>{t.icon}</span>
        <button
          onClick={e => onToggleFav(t.id, e)}
          className={`p-0.5 rounded transition-colors ${isFavorite ? 'text-amber-400' : 'text-gray-600 hover:text-gray-400'} opacity-0 group-hover:opacity-100 focus:opacity-100`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>
      <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-200 group-hover:text-white leading-tight`}>{t.name}</span>
      {!compact && <span className="text-xs text-gray-500 leading-snug">{t.description}</span>}
      {!compact && (
        <div className="flex flex-wrap gap-1 mt-1">
          {t.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-700/60 text-gray-400 rounded">{tag}</span>
          ))}
        </div>
      )}
    </button>
  );
}
