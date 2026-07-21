import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, Calendar, ShieldAlert, ChevronDown, Menu } from 'lucide-react';

interface TopbarProps {
  onOpenMobileMenu: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileMenu }) => {
  const { currentUser, products, settings, logout } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  if (!currentUser) return null;

  const lowStockProducts = products.filter(p => p.stock <= p.minStockLevel);
  const alertCount = lowStockProducts.length;

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-[#f0e4d4] text-[#8c3d08] border-[#e0c9a8]';
      case 'Store Keeper':
        return 'bg-[#eef2ee] text-[#4a664a] border-[#d8e3d8]';
      case 'Cashier':
        return 'bg-[#ebe5db] text-[#4a4642] border-[#ddd4c6]';
      case 'Wholesale Sales':
        return 'bg-[#f0e4d4] text-[#6b2f0a] border-[#d4a574]';
      case 'Retail Sales':
        return 'bg-[#ebe4d8] text-[#6b5740] border-[#d6c9b4]';
      default:
        return 'bg-[#f5f1ea] text-[#6b6560] border-[#ddd4c6]';
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

  const currentDate = new Date().toLocaleDateString('sw-TZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header
      id="topbar-container"
      className="h-12 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 font-sans sticky top-0 z-40"
    >
      <div className="flex items-center gap-3">
        <button
          id="mobile-menu-toggle"
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded-[4px] border border-[var(--color-border)] hover:bg-[#f0ebe3] text-[var(--color-muted)] focus:outline-none"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-[var(--color-text)] tracking-tight">
            {settings.businessName}
          </h1>
          <p className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{currentDate}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            id="notification-bell"
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className={`p-1.5 rounded-[4px] relative border ${
              alertCount > 0 
                ? 'bg-[#faf0ee] text-[var(--color-alert)] border-[#e0b4ac] hover:bg-[#f5e4e0]' 
                : 'bg-[#f5f1ea] text-[var(--color-muted)] border-[var(--color-border)] hover:bg-[#ebe5db]'
            }`}
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span id="notification-count" className="absolute -top-1 -right-1 bg-[var(--color-alert)] text-[#faf8f4] text-[9px] font-bold w-4 h-4 rounded-[3px] flex items-center justify-center tabular-nums">
                {alertCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div id="notifications-panel" className="absolute right-0 mt-1.5 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[5px] z-50 overflow-hidden font-sans">
              <div className="px-3 py-2 bg-[#f5f1ea] border-b border-[var(--color-border)] flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--color-text)]">Tahadhari za Stock ({alertCount})</span>
                {alertCount > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      navigate('/low_stock');
                      setShowNotifications(false);
                    }} 
                    className="text-[10px] text-[var(--color-brand)] hover:underline font-semibold"
                  >
                    Angalia Zote
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[var(--color-border)]">
                {alertCount === 0 ? (
                  <div className="p-2">
                    <div className="empty-banner">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-ok)] shrink-0" />
                      <span>Stoo ipo salama! Hakuna bidhaa iliyopungua.</span>
                    </div>
                  </div>
                ) : (
                  lowStockProducts.map(p => (
                    <div 
                      key={p.id} 
                      className="px-3 py-2 hover:bg-[#f5f1ea] flex gap-2 items-start cursor-pointer"
                      onClick={() => {
                        navigate('/low_stock');
                        setShowNotifications(false);
                      }}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-alert)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-semibold text-[var(--color-text)] leading-tight">{p.name}</p>
                        <p className="text-[10px] text-[var(--color-muted)] mt-0.5">
                          Inayohitajika: <span className="font-bold text-[var(--color-alert)]">{p.stock}</span> (Kiwango cha chini: {p.minStockLevel} {p.unit})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <span className="h-5 w-px bg-[var(--color-border)]" />

        <div className="relative">
          <button
            id="profile-dropdown-trigger"
            type="button"
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 hover:bg-[#f5f1ea] p-1 rounded-[4px] border border-transparent"
          >
            <div className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#faf8f4] font-bold text-[10px] bg-[var(--color-brand)]">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-semibold text-[var(--color-text)] leading-none">{currentUser.name}</p>
              <span className={`inline-block text-[9px] px-1 py-0.5 rounded-[3px] border ${getRoleBadgeClass(currentUser.role)} font-semibold mt-1 leading-none`}>
                {getRoleBadgeLabel(currentUser.role)}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--color-muted)]" />
          </button>

          {showProfileDropdown && (
            <div id="profile-dropdown-panel" className="absolute right-0 mt-1.5 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[5px] z-50 overflow-hidden font-sans">
              <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[#f5f1ea] text-[var(--color-muted)]">
                <div className="text-[11px] font-semibold truncate text-[var(--color-text)]">{currentUser.name}</div>
                <div className="text-[10px] truncate">@{currentUser.username}</div>
              </div>
              <button
                id="profile-logout-btn"
                type="button"
                onClick={logout}
                className="w-full text-left px-3 py-2 text-[11px] text-[var(--color-alert)] hover:bg-[#faf0ee] flex items-center gap-2 font-medium"
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
