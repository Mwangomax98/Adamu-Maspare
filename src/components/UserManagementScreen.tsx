import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { Plus, Search, Edit, Trash2, Circle, X } from 'lucide-react';

export const UserManagementScreen: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [usrName, setUsrName] = useState('');
  const [usrUsername, setUsrUsername] = useState('');
  const [usrRole, setUsrRole] = useState<UserRole>('Cashier');
  const [usrActive, setUsrActive] = useState(true);
  const [usrPassword, setUsrPassword] = useState('');
  const [usrPasswordConfirm, setUsrPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsrName('');
    setUsrUsername('');
    setUsrRole('Cashier');
    setUsrActive(true);
    setUsrPassword('');
    setUsrPasswordConfirm('');
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsrName(u.name);
    setUsrUsername(u.username);
    setUsrRole(u.role);
    setUsrActive(u.active);
    setUsrPassword('');
    setUsrPasswordConfirm('');
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usrPassword || !editingUser) {
      if (usrPassword.length < 6) {
        showToast('Nenosiri lazima liwe angalau herufi 6', 'error');
        return;
      }
      if (usrPassword !== usrPasswordConfirm) {
        showToast('Nenosiri hazifanani', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingUser) {
        await updateUser({
          ...editingUser,
          name: usrName,
          username: usrUsername,
          role: usrRole,
          active: usrActive,
          ...(usrPassword ? { password: usrPassword } : {}),
        });
      } else {
        await addUser({
          name: usrName,
          username: usrUsername,
          role: usrRole,
          active: usrActive,
          avatarColor: getRandomAvatarColor(),
          password: usrPassword,
        });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const getRandomAvatarColor = () => {
    const colors = [
      'bg-teal-600', 'bg-emerald-600', 'bg-rose-600', 'bg-cyan-600',
      'bg-amber-600', 'bg-pink-600', 'bg-purple-600', 'bg-sky-600',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-teal-50 border-teal-100 text-teal-600';
      case 'Store Keeper': return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'Cashier': return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'Wholesale Sales': return 'bg-cyan-50 border-cyan-100 text-cyan-600';
      case 'Retail Sales': return 'bg-pink-50 border-pink-100 text-pink-600';
      default: return 'bg-slate-50 border-slate-100 text-slate-600';
    }
  };

  return (
    <div id="user-management-screen" className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800">Usimamizi wa Watumiaji (User Management)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Sajili wafanyakazi, weka nenosiri, wapangie majukumu (Roles) na udhibiti uwezo wao wa kuingia kwenye mfumo.
          </p>
        </div>
        <button
          id="add-user-btn"
          onClick={handleOpenAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-md self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Sajili Mtumiaji Mpya</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            id="user-search-input"
            placeholder="Tafuta mtumiaji kwa Jina, Username au nafasi (Role)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-semibold text-slate-700"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Wasifu / Jina</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Nafasi (User Role)</th>
                <th className="py-3 px-4 text-center">Hali (Status)</th>
                <th className="py-3 px-4 text-center">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredUsers.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${u.avatarColor || 'bg-teal-600'}`}>
                          {u.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="bg-teal-100 text-teal-700 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none">
                                WEWE
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">@{u.username}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${u.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <Circle className="h-2.5 w-2.5 fill-current" />
                        <span>{u.active ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`edit-user-btn-${u.id}`}
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-user-btn-${u.id}`}
                          type="button"
                          onClick={async () => {
                            if (isSelf) {
                              showToast('Huwezi kufuta akaunti yako uliyologin nayo hivi sasa!', 'error');
                              return;
                            }
                            if (window.confirm(`Je, unataka kumfuta mfanyakazi "${u.name}"?`)) {
                              await deleteUser(u.id);
                            }
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                {editingUser ? 'Hariri Mtumiaji' : 'Sajili Mtumiaji Mpya'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina Kamili la Mfanyakazi</label>
                <input
                  type="text"
                  required
                  value={usrName}
                  onChange={(e) => setUsrName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Username</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={usrUsername}
                  onChange={(e) => setUsrUsername(e.target.value.trim())}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Nafasi (Role)</label>
                <select
                  value={usrRole}
                  onChange={(e) => setUsrRole(e.target.value as UserRole)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Admin">Admin</option>
                  <option value="Store Keeper">Store Keeper</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Wholesale Sales">Wholesale Sales</option>
                  <option value="Retail Sales">Retail Sales</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">
                  {editingUser ? 'Nenosiri Jipya (acha tupu kama hubadilishi)' : 'Nenosiri'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={editingUser && !usrPassword ? undefined : 6}
                  autoComplete="new-password"
                  value={usrPassword}
                  onChange={(e) => setUsrPassword(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Thibitisha Nenosiri</label>
                <input
                  type="password"
                  required={!editingUser || !!usrPassword}
                  autoComplete="new-password"
                  value={usrPasswordConfirm}
                  onChange={(e) => setUsrPasswordConfirm(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={usrActive}
                  onChange={(e) => setUsrActive(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                Akaunti Active (anaweza kuingia)
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
              >
                {saving ? 'Inahifadhi...' : editingUser ? 'Hifadhi Mabadiliko' : 'Sajili Mtumiaji'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
