import { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../../firebase/config';
import { signInWithGoogle, signOut, onAuthChange, type User } from '../../firebase/auth';
import {
  saveProject,
  loadProjects,
  deleteProject,
  type SavedProject,
} from '../../firebase/projects';
import type { ModelConfig } from '../../types/model';

interface FirebasePanelProps {
  config: ModelConfig;
  onLoad: (config: ModelConfig) => void;
}

/** Full-screen overlay for sign-in, save, and project list. */
export function FirebasePanel({ config, onLoad }: FirebasePanelProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthChange(u => setUser(u));
  }, []);

  useEffect(() => {
    if (user && open) fetchProjects();
  }, [user, open]);

  async function fetchProjects() {
    if (!user) return;
    setLoading(true);
    try {
      setProjects(await loadProjects(user.uid));
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    const name = saveName.trim() || `${config.generator} — ${new Date().toLocaleDateString()}`;
    setSaving(true);
    setError('');
    try {
      await saveProject(user.uid, name, config);
      setSaveName('');
      await fetchProjects();
    } catch {
      setError('Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setProjects(p => p.filter(x => x.id !== id));
    } catch {
      setError('Failed to delete project');
    }
  }

  if (!isFirebaseConfigured) return null;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs rounded-md transition-colors border border-gray-600"
        title="Save / load projects (Firebase)"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        {user ? (user.displayName?.split(' ')[0] ?? 'Projects') : 'Sign in'}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-[440px] max-w-[95vw] max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <h2 className="text-base font-semibold text-gray-100">
                {user ? 'My Projects' : 'Sign in to save projects'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-200 p-1 rounded">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {error && <p className="text-xs text-red-400">{error}</p>}

              {!user ? (
                <button
                  onClick={() => signInWithGoogle().catch(() => setError('Sign-in failed'))}
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              ) : (
                <>
                  {/* User info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {user.photoURL && <img src={user.photoURL} className="w-7 h-7 rounded-full" alt="" />}
                      <span className="text-sm text-gray-300">{user.displayName ?? user.email}</span>
                    </div>
                    <button
                      onClick={() => signOut().then(() => setProjects([]))}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      Sign out
                    </button>
                  </div>

                  {/* Save current */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      placeholder="Project name (optional)…"
                      onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
                      className="flex-1 bg-gray-700 text-gray-200 text-sm rounded-md px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-sm rounded-md transition-colors"
                    >
                      {saving ? '…' : 'Save'}
                    </button>
                  </div>

                  {/* Project list */}
                  {loading ? (
                    <p className="text-xs text-gray-500 text-center py-4">Loading…</p>
                  ) : projects.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No saved projects yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {projects.map(p => (
                        <li key={p.id} className="flex items-center justify-between gap-2 bg-gray-750 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 group">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-200 font-medium truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate">{p.generator} · {p.updatedAt.toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => { onLoad(p.config); setOpen(false); }}
                              className="text-xs text-blue-400 hover:text-blue-200 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="text-xs text-gray-500 hover:text-red-400 px-2 py-1 rounded hover:bg-gray-600 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
