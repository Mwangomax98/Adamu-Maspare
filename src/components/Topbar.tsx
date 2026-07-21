import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, Calendar, User as UserIcon, ShieldAlert, ChevronDown, CheckCircle, Menu } from 'lucide-react';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, products, settings, logout } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  if (!currentUser) return null;

  // Identify low stock products
  const lowStockProducts = products.filter(p => p.stock <= p.minStockLevel);
  const alertCount = lowStockProducts.length;

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'Store Keeper':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Cashier':
        return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'Wholesale Sales':
        return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'Retail Sales':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getRoleBadgeLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'Admin';
      case 'Store Keeper': return 'Stoo';
      case 'Cashier': return 'Keshia';
      case 'Wholesale Sales': return 'Jumla';
      case 'Retail Sales': return 'Rejareja';
      default: return role;
    }
  };

  // Get current date formatted in Swahili/localized
  const currentDate = new Date().toLocaleDateString('sw-TZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header id="topbar-container" className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 font-sans sticky top-0 z-40 shadow-sm">
      {/* Left side: Business Info */}
      <div className="flex items-center gap-4">
        <button
          id="mobile-menu-toggle"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 focus:outline-none"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight uppercase">
            {settings.businessName}
          </h1>
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>{currentDate}</span>
          </p>
        </div>
      </div>

      {/* Right side: Actions, Notifications, User Badges */}
      <div className="flex items-center gap-4">
        {/* Low Stock Notification Bell */}
        <div className="relative">
          <button
            id="notification-bell"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className={`p-2 rounded-xl transition-all duration-150 relative border ${
              alertCount > 0 
                ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100' 
                : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
            }`}
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span id="notification-count" className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div id="notifications-panel" className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden font-sans py-1">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tahadhari za Stock ({alertCount})</span>
                {alertCount > 0 && (
                  <button 
                    onClick={() => {
                      navigate('/low_stock');
                      setShowNotifications(false);
                    }} 
                    className="text-[10px] text-teal-700 hover:underline font-bold"
                  >
                    Angalia Zote
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {alertCount === 0 ? (
                  <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <p className="text-xs font-medium">Stoo ipo salama! Hakuna bidhaa iliyopungua.</p>
                  </div>
                ) : (
                  lowStockProducts.map(p => (
                    <div 
                      key={p.id} 
                      className="p-3 hover:bg-slate-50 transition-colors flex gap-2 items-start cursor-pointer"
                      onClick={() => {
                        navigate('/low_stock');
                        setShowNotifications(false);
                      }}
                    >
                      <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 leading-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Inayohitajika: <span className="font-bold text-rose-600">{p.stock}</span> (Kiwango cha chini: {p.minStockLevel} {p.unit})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <span className="h-6 w-px bg-slate-200"></span>

        {/* User Badge Profile Trigger */}
        <div className="relative">
          <button
            id="profile-dropdown-trigger"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-xl transition-all duration-150 border border-transparent"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs bg-teal-600">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</p>
              <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full border ${getRoleBadgeClass(currentUser.role)} font-semibold uppercase mt-1 leading-none`}>
                {getRoleBadgeLabel(currentUser.role)}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {/* Profile Quick Logout Dropdown */}
          {showProfileDropdown && (
            <div id="profile-dropdown-panel" className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden font-sans">
              <div className="p-3 border-b border-slate-100 bg-slate-50 text-slate-600">
                <div className="text-xs font-bold truncate">{currentUser.name}</div>
                <div className="text-[10px] truncate">@{currentUser.username}</div>
              </div>
              <button
                id="profile-logout-btn"
                onClick={logout}
                className="w-full text-left p-3 text-xs text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 font-medium"
              >
                <ChevronDown className="h-3.5 w-3.5 rotate-90" />
                <span>Ondoka kwenye Mfumo</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
