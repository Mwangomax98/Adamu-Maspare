import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Lock, User as UserIcon, Key, ShoppingCart, Info } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, apiConnected } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim(), password, apiConnected ? undefined : role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen-container" className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-teal-600 p-3 rounded-2xl shadow-xl flex items-center justify-center text-white">
            <ShoppingCart className="h-10 w-10" />
          </div>
        </div>
        <h2 id="login-title" className="mt-6 text-center text-3xl font-bold tracking-tight text-white uppercase">
          ADAMU MASPARE
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Usimamizi wa Mauzo, Stoo na Wateja
        </p>
        {!apiConnected && (
          <p className="mt-1 text-center text-xs text-amber-400/90">
            API haipo — hali ya offline (localStorage)
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Key className="text-teal-400 h-5 w-5" />
            Ingia kwenye Mfumo
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username-input" className="block text-sm font-medium text-slate-300">
                Jina la Mtumiaji (Username)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  id="username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 bg-slate-700 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  placeholder="username"
                />
              </div>
            </div>

            {!apiConnected && (
              <div>
                <label htmlFor="role-select" className="block text-sm font-medium text-slate-300">
                  Nafasi (offline only)
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 block w-full px-3 py-2.5 border border-slate-600 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                >
                  <option value="Admin">Admin</option>
                  <option value="Store Keeper">Store Keeper</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Wholesale Sales">Wholesale Sales</option>
                  <option value="Retail Sales">Retail Sales</option>
                </select>
              </div>
            )}

            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-slate-300">
                Nenosiri (Password)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 bg-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-btn-submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
            >
              {loading ? 'Inaingia...' : 'Ingia'}
            </button>
          </form>

          <div className="mt-6 bg-slate-700/30 border border-slate-700/60 p-4 rounded-xl flex gap-3 text-xs text-slate-300">
            <Info className="text-teal-400 shrink-0 h-4 w-4" />
            <div>
              Admin anaweza kusajili watumiaji wapya na kuweka nenosiri chini ya <span className="font-semibold">Usimamizi wa Watumiaji</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
