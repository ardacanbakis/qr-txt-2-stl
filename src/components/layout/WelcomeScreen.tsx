import { useState } from 'react';

const STORAGE_KEY = 'stl-generator-welcomed';

export function useWelcomeScreen() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return { showWelcome: !dismissed, dismiss };
}

interface WelcomeScreenProps {
  onDismiss: () => void;
}

function Logo() {
  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Base plate */}
      <rect x="20" y="50" width="80" height="55" rx="6" fill="#374151" stroke="#6B7280" strokeWidth="2" />
      {/* 3D depth effect */}
      <path d="M20 50 L30 40 L110 40 L100 50 Z" fill="#4B5563" stroke="#6B7280" strokeWidth="1.5" />
      <path d="M100 50 L110 40 L110 95 L100 105 Z" fill="#4B5563" stroke="#6B7280" strokeWidth="1.5" />
      {/* QR code pattern on face */}
      <rect x="32" y="60" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="44" y="60" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="56" y="60" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="32" y="72" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="56" y="72" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="68" y="72" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="44" y="84" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="68" y="84" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="80" y="60" width="10" height="10" rx="1" fill="#60A5FA" />
      <rect x="80" y="84" width="10" height="10" rx="1" fill="#60A5FA" />
      {/* Download arrow */}
      <circle cx="95" cy="22" r="16" fill="#1D4ED8" />
      <path d="M95 14 L95 28 M89 23 L95 29 L101 23" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
    title: '9 Generator Types',
    desc: 'QR codes, text labels, Spotify codes, WiFi cards, barcodes, images, lithophanes, nameplates, and contact cards.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    ),
    title: 'Real-Time 3D Preview',
    desc: 'Orbit, pan, and zoom your model. Toggle dark/light mode, switch view angles, and see exact dimensions.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Export Ready-to-Print STL',
    desc: 'Download a single STL or separate parts as a ZIP for multi-color printing. All client-side, no upload needed.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Fully Customizable',
    desc: 'Adjust base shape, thickness, edge treatment, magnet holes, mounting options, and colors to fit your needs.',
  },
];

function Footer() {
  return (
    <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500">
      <p>
        Created with{' '}
        <svg className="inline w-3.5 h-3.5 -mt-0.5" viewBox="0 0 24 24" fill="#ff0000" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>{' '}
        by{' '}
        <a
          href="https://ardacanbakis.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          Arda Canbakis
        </a>
      </p>
    </div>
  );
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center p-4">
      <Footer />
      <div className="max-w-lg w-full">
        {step === 0 && (
          <div className="text-center space-y-6 animate-in fade-in">
            <Logo />
            <div className="mx-auto w-fit">
              <h1 className="text-3xl font-bold text-white">STL Generator</h1>
              <p className="text-gray-400 mt-2 text-lg">Create 3D-printable models from text, codes, and images</p>
            </div>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Design custom QR codes, nameplates, Spotify codes, and more — then export
              ready-to-print STL files directly in your browser.
            </p>
            <button
              onClick={() => setStep(1)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors text-base"
            >
              See How It Works
            </button>
            <div>
              <button
                onClick={onDismiss}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Skip intro
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-semibold text-white text-center">How It Works</h2>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                Choose type
              </span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                Customize
              </span>
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                Export STL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex gap-3">
                  <div className="text-blue-400 shrink-0 mt-0.5">{f.icon}</div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{f.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={onDismiss}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors text-base"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
