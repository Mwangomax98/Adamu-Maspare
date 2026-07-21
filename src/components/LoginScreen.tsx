import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Lock, User as UserIcon, ShieldCheck, Key, ShoppingCart, Info } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, users, apiConnected } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('Admin');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password, role);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (uName: string, uRole: UserRole) => {
    setLoading(true);
    try {
      await login(uName, 'password123', uRole);
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
          Usimamizi wa Mauzo, Stoo na Wateja wa Jumla na Rejareja
        </p>
        <p className="mt-1 text-center text-xs text-teal-400/80">
          {apiConnected ? 'Imeunganishwa na MySQL API' : 'Hali ya majaribio (localStorage) — anza API ili kutumia MySQL'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="text-teal-400 h-5 w-5" />
            Njia ya Haraka (Roles)
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Bofya wasifu — nenosiri la default ni <span className="font-mono text-teal-300">password123</span>
          </p>

          <div className="space-y-3">
            {users.map((u) => {
              let roleBadgeColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
              if (u.role === 'Store Keeper') roleBadgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              if (u.role === 'Cashier') roleBadgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              if (u.role === 'Wholesale Sales') roleBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
              if (u.role === 'Retail Sales') roleBadgeColor = 'bg-pink-500/10 text-pink-400 border-pink-500/20';

              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={loading}
                  id={`quick-login-${u.role.toLowerCase().replace(' ', '-')}`}
                  onClick={() => handleQuickLogin(u.username, u.role)}
                  className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl flex items-center justify-between transition-all duration-200 group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${u.avatarColor || 'bg-slate-500'}`}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-teal-300 transition-colors">
                        {u.name}
                      </div>
                      <div className="text-xs text-slate-400">Username: <span className="font-mono text-slate-300">{u.username}</span></div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${roleBadgeColor} font-medium`}>
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800 py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-700 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Key className="text-teal-400 h-5 w-5" />
              Ingia na Akaunti Yako
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 bg-slate-700 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    placeholder="Mtumiaji"
                  />
                </div>
              </div>

              {!apiConnected && (
                <div>
                  <label htmlFor="role-select" className="block text-sm font-medium text-slate-300">
                    Nafasi (User Role) — local mode
                  </label>
                  <div className="mt-1">
                    <select
                      id="role-select"
                      name="role"
                      value={role}
                      onChange={(e) => {
                        setRole(e.target.value as UserRole);
                        if (e.target.value === 'Admin') setUsername('admin');
                        else if (e.target.value === 'Store Keeper') setUsername('store');
                        else if (e.target.value === 'Cashier') setUsername('cashier');
                        else if (e.target.value === 'Wholesale Sales') setUsername('wholesale');
                        else if (e.target.value === 'Retail Sales') setUsername('retail');
                      }}
                      className="block w-full px-3 py-2.5 border border-slate-600 bg-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                    >
                      <option value="Admin">Admin (Meneja Mkuu)</option>
                      <option value="Store Keeper">Store Keeper (Mkutubi/Mstoo)</option>
                      <option value="Cashier">Cashier (Mweka Hazina)</option>
                      <option value="Wholesale Sales">Muuzaji wa Jumla (Wholesale Sales)</option>
                      <option value="Retail Sales">Muuzaji wa Reja Reja (Retail Sales)</option>
                    </select>
                  </div>
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
                    required={apiConnected}
                    placeholder="password123"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 bg-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  id="login-btn-submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Inaingia...' : 'Ingia Kwenye Mfumo'}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 bg-slate-700/30 border border-slate-700/60 p-4 rounded-xl flex gap-3 text-xs text-slate-300">
            <Info className="text-amber-400 shrink-0 h-4 w-4" />
            <div>
              <span className="font-bold">Kumbuka:</span> Kila role imepangishwa dashibodi tofauti. Baada ya kuunganisha MySQL, nenosiri la default ni <span className="font-mono">password123</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
