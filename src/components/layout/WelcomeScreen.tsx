import { useState, useEffect } from 'react';

const STORAGE_KEY = 'stl-generator-welcomed';
const THEME_KEY = 'stl-welcome-theme';

export function useWelcomeScreen() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1');

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  const show = () => {
    setDismissed(false);
  };

  return { showWelcome: !dismissed, dismiss, show };
}

interface WelcomeScreenProps {
  onDismiss: () => void;
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

function GithubIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
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

const SOCIAL_LINKS = [
  { href: 'https://ardacanbakis.com', icon: <GlobeIcon />, label: 'Website' },
  { href: 'https://github.com/ardacanbakis', icon: <GithubIcon />, label: 'GitHub' },
  { href: 'https://instagram.com/ardacanbakis', icon: <InstagramIcon />, label: 'Instagram' },
  { href: 'https://youtube.com/@ardacanbakis', icon: <YoutubeIcon />, label: 'YouTube' },
];

function Footer({ dark }: { dark: boolean }) {
  return (
    <div className="absolute bottom-6 left-0 right-0">
      <div className="flex items-center justify-center gap-4 mb-3">
        {SOCIAL_LINKS.map(link => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label}
            className={`p-2 rounded-full transition-colors ${
              dark
                ? 'text-gray-500 hover:text-white hover:bg-gray-800'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {link.icon}
          </a>
        ))}
      </div>
      <p className={`text-center text-xs ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
        Created by{' '}
        <a
          href="https://ardacanbakis.com"
          target="_blank"
          rel="noopener noreferrer"
          className={`transition-colors ${dark ? 'text-gray-500 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'}`}
        >
          Arda Canbakis
        </a>
      </p>
    </div>
  );
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);
  const { dark, toggle: toggleTheme } = useTheme();

  const bg = dark ? 'bg-gray-900' : 'bg-gray-50';
  const text = dark ? 'text-white' : 'text-gray-900';
  const textMuted = dark ? 'text-gray-400' : 'text-gray-600';
  const textFaint = dark ? 'text-gray-500' : 'text-gray-400';
  const cardBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm';
  const cardTitle = dark ? 'text-white' : 'text-gray-900';
  const cardDesc = dark ? 'text-gray-400' : 'text-gray-600';
  const iconColor = dark ? 'text-blue-400' : 'text-blue-600';
  const skipColor = dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-700';
  const themeBtnColor = dark ? 'text-gray-500 hover:text-yellow-400 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200';

  return (
    <div className={`fixed inset-0 z-50 ${bg} flex items-center justify-center p-4 transition-colors duration-300`}>
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${themeBtnColor}`}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <SunIcon /> : <MoonIcon />}
      </button>

      <Footer dark={dark} />

      <div className="max-w-lg w-full">
        {step === 0 && (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="flex justify-center">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="STL Smith"
                className="h-32 w-auto object-contain"
              />
            </div>
            <p className={`${textMuted} text-lg`}>Create 3D-printable models from text, codes, and images</p>
            <p className={`${textFaint} text-sm max-w-sm mx-auto`}>
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
                className={`${skipColor} text-sm transition-colors`}
              >
                Skip intro
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className={`text-xl font-semibold ${text} text-center`}>How It Works</h2>
            <div className={`flex items-center justify-center gap-3 text-sm ${textMuted}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                Choose type
              </span>
              <svg className={`w-4 h-4 ${textFaint}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                Customize
              </span>
              <svg className={`w-4 h-4 ${textFaint}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                Export STL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {FEATURES.map((f, i) => (
                <div key={i} className={`${cardBg} border rounded-lg p-4 flex gap-3`}>
                  <div className={`${iconColor} shrink-0 mt-0.5`}>{f.icon}</div>
                  <div>
                    <h3 className={`text-sm font-medium ${cardTitle}`}>{f.title}</h3>
                    <p className={`text-xs ${cardDesc} mt-1 leading-relaxed`}>{f.desc}</p>
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
