import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { User as UserIcon, Key, ShoppingCart } from 'lucide-react';

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
    <div id="login-screen-container" className="min-h-screen bg-[var(--color-canvas)] flex flex-col justify-center py-10 px-4 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex items-center gap-2.5 justify-center">
          <div className="bg-[var(--color-brand)] p-2 rounded-[5px] text-[#faf8f4]">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <h2 id="login-title" className="text-base font-bold text-[var(--color-text)] tracking-tight">
              ADAMU MASPARE
            </h2>
            <p className="text-[11px] text-[var(--color-muted)]">Usimamizi wa Mauzo, Stoo na Wateja</p>
          </div>
        </div>
        {!apiConnected && (
          <p className="mt-2 text-center text-[11px] text-[var(--color-warn)] font-medium">
            API haipo — hali ya offline (localStorage)
          </p>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="panel px-5 py-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
            <Key className="text-[var(--color-brand)] h-4 w-4" />
            Ingia kwenye Mfumo
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="username-input" className="block text-[11px] font-semibold text-[var(--color-muted)]">
                Jina la Mtumiaji (Username)
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <UserIcon className="h-4 w-4 text-[var(--color-muted)]" />
                </div>
                <input
                  type="text"
                  name="username"
                  id="username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="block w-full pl-9 pr-3 py-2 border border-[var(--color-border)] bg-[#f5f1ea] text-[var(--color-text)] rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] text-sm"
                  placeholder="username"
                />
              </div>
            </div>

            {!apiConnected && (
              <div>
                <label htmlFor="role-select" className="block text-[11px] font-semibold text-[var(--color-muted)]">
                  Nafasi (offline only)
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="mt-1 block w-full py-2 px-3 border border-[var(--color-border)] bg-[#f5f1ea] rounded-[5px] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
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
              <label htmlFor="password-input" className="block text-[11px] font-semibold text-[var(--color-muted)]">
                Nenosiri (Password)
              </label>
              <input
                type="password"
                name="password"
                id="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="mt-1 block w-full py-2 px-3 border border-[var(--color-border)] bg-[#f5f1ea] text-[var(--color-text)] rounded-[5px] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="w-full flex justify-center py-2 px-4 rounded-[5px] text-sm font-semibold text-[#faf8f4] bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] disabled:opacity-50"
            >
              {loading ? 'Inaingia...' : 'Ingia'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
