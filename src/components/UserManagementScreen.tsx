import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { Plus, Search, Edit, Trash2, Shield, Circle, UserCheck, X } from 'lucide-react';

export const UserManagementScreen: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [usrName, setUsrName] = useState('');
  const [usrUsername, setUsrUsername] = useState('');
  const [usrRole, setUsrRole] = useState<UserRole>('Cashier');
  const [usrActive, setUsrActive] = useState(true);

  // Filter
  const filteredUsers = users.filter(u => {
    return u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.role.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsrName('');
    setUsrUsername('');
    setUsrRole('Cashier');
    setUsrActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsrName(u.name);
    setUsrUsername(u.username);
    setUsrRole(u.role);
    setUsrActive(u.active);
    setShowModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser({
        ...editingUser,
        name: usrName,
        username: usrUsername,
        role: usrRole,
        active: usrActive
      });
    } else {
      addUser({
        name: usrName,
        username: usrUsername,
        role: usrRole,
        active: usrActive,
        avatarColor: getRandomAvatarColor()
      });
    }
    setShowModal(false);
  };

  const getRandomAvatarColor = () => {
    const colors = [
      'bg-teal-600', 'bg-emerald-600', 'bg-rose-600', 'bg-cyan-600', 
      'bg-amber-600', 'bg-pink-600', 'bg-purple-600', 'bg-sky-600'
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
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase text-slate-800">Usimamizi wa Watumiaji (User Management)</h2>
          <p className="text-xs text-slate-500 mt-1">Sajili wafanyakazi wako, wapangie majukumu (Roles) na udhibiti uwezo wao wa kuingia kwenye mfumo.</p>
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

      {/* Search filter */}
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

      {/* Users List Table */}
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
              {filteredUsers.map(u => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${u.avatarColor || 'bg-teal-600'}`}>
                          {u.name.split(' ').map(n => n[0]).join('')}
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
                        <Circle className={`h-2.5 w-2.5 fill-current`} />
                        <span>{u.active ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`edit-user-btn-${u.id}`}
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-500 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-user-btn-${u.id}`}
                          onClick={() => {
                            if (isSelf) {
                              alert('Huwezi kufuta akaunti yako uliyologin nayo hivi sasa!');
                              return;
                            }
                            if (confirm(`Je, unataka kumfuta mfanyakazi "${u.name}"?`)) {
                              deleteUser(u.id);
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

      {/* MODAL: ADD / EDIT USER */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase text-slate-800">
                {editingUser ? 'Hariri Mtumiaji' : 'Sajili Mtumiaji Mpya'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina Kamili la Mfanyakazi</label>
                <input
                  type="text"
                  required
                  id="modal-usr-name"
                  value={usrName}
                  onChange={(e) => setUsrName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  placeholder="e.g. Salim Rashid"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Username ya Login</label>
                  <input
                    type="text"
                    required
                    id="modal-usr-username"
                    value={usrUsername}
                    onChange={(e) => setUsrUsername(e.target.value)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="e.g. salimr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase">Majukumu (Role)</label>
                  <select
                    id="modal-usr-role"
                    value={usrRole}
                    onChange={(e) => setUsrRole(e.target.value as UserRole)}
                    className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="Admin">Admin (Meneja Mkuu)</option>
                    <option value="Store Keeper">Store Keeper (Stoo)</option>
                    <option value="Cashier">Cashier (Retail Cashier)</option>
                    <option value="Wholesale Sales">Wholesale Sales (Muuzaji Jumla)</option>
                    <option value="Retail Sales">Retail Sales (Muuzaji Reja Reja)</option>
                  </select>
                </div>
              </div>

              {/* Suspended toggle */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">Ruhusu Kuingia (Active Status)</label>
                  <span className="text-[10px] text-slate-400 font-medium">Mtumiaji huyu anaweza kuingia kwenye mfumo hivi sasa</span>
                </div>
                <input
                  type="checkbox"
                  id="modal-usr-active"
                  checked={usrActive}
                  onChange={(e) => setUsrActive(e.target.checked)}
                  className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-600"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  id="modal-save-user-btn"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Hifadhi Mtumiaji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
