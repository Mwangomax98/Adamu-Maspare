import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, Package, AlertTriangle, ShoppingCart, 
  Users, Truck, Download, ArrowLeftRight, ClipboardList, 
  TrendingUp, BarChart3, Receipt, FileText, UserCog, Settings,
  LogOut, ShoppingBag, Wallet, ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const hasPermission = (role: UserRole, screen: string): boolean => {
  if (role === 'Admin') return true;
  
  switch (screen) {
    case 'dashboard':
      return true;
    case 'inventory':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'low_stock':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'pos':
      return false;
    case 'wholesale_pos':
      return ['Wholesale Sales', 'Admin'].includes(role);
    case 'proforma':
      return ['Wholesale Sales', 'Admin'].includes(role);
    case 'retail_pos':
      return ['Retail Sales', 'Admin'].includes(role);
    case 'customers':
      return ['Wholesale Sales', 'Cashier', 'Admin'].includes(role);
    case 'suppliers':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'goods_received':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'stock_transfer':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'stock_count':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'expenses':
      return ['Admin'].includes(role);
    case 'reports':
      return ['Admin', 'Cashier', 'Wholesale Sales', 'Retail Sales'].includes(role);
    case 'profit_loss':
      return ['Admin'].includes(role);
    case 'stock_movement':
      return ['Store Keeper', 'Admin'].includes(role);
    case 'warranty':
      return true;
    case 'users':
      return ['Admin'].includes(role);
    case 'settings':
      return ['Admin'].includes(role);
    default:
      return false;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { currentUser, logout, products } = useApp();
  const navigate = useNavigate();
  const { screen: routeScreen } = useParams<{ screen: string }>();

  if (!currentUser) return null;

  const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;
  const activeScreen = routeScreen || 'dashboard';

  const menuItems = [
    { id: 'dashboard', label: 'Dashibodi', icon: LayoutDashboard },
    { id: 'section-sales', label: 'Mauzo', isHeader: true },
    { id: 'wholesale_pos', label: 'Mauzo ya Jumla', icon: ShoppingBag },
    { id: 'proforma', label: 'Proforma', icon: FileText },
    { id: 'retail_pos', label: 'Mauzo ya Rejareja', icon: Wallet },
    { id: 'section-inventory', label: 'Stoo', isHeader: true },
    { id: 'inventory', label: 'Bidhaa & Bei', icon: Package },
    { 
      id: 'low_stock', 
      label: 'Stoki ya Chini', 
      icon: AlertTriangle, 
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    { id: 'goods_received', label: 'Kupokea Mzigo (In)', icon: Download },
    { id: 'stock_transfer', label: 'Kuhamisha Stock', icon: ArrowLeftRight },
    { id: 'stock_count', label: 'Kukagua Stoo (Count)', icon: ClipboardList },
    { id: 'section-contacts', label: 'Mahusiano', isHeader: true },
    { id: 'customers', label: 'Wateja na Madeni', icon: Users },
    { id: 'warranty', label: 'Marejesho & Dhamana', icon: ShieldCheck },
    { id: 'suppliers', label: 'Wasambazaji', icon: Truck },
    { id: 'section-reports', label: 'Taarifa', isHeader: true },
    { id: 'expenses', label: 'Matumizi (Expenses)', icon: Receipt },
    { id: 'reports', label: 'Ripoti za Mauzo', icon: TrendingUp },
    { id: 'profit_loss', label: 'Faida & Hasara', icon: BarChart3 },
    { id: 'stock_movement', label: 'Miondoko ya Bidhaa', icon: FileText },
    { id: 'section-admin', label: 'Utawala', isHeader: true },
    { id: 'users', label: 'Watumiaji (Users)', icon: UserCog },
    { id: 'settings', label: 'Mipangilio ya Mfumo', icon: Settings },
  ];

  const filteredItems = menuItems.filter(item => {
    if (item.isHeader) {
      const sectionIndex = menuItems.indexOf(item);
      const nextItems = menuItems.slice(sectionIndex + 1);
      let hasValidItem = false;
      for (const nextItem of nextItems) {
        if (nextItem.isHeader) break;
        if (hasPermission(currentUser.role, nextItem.id)) {
          hasValidItem = true;
          break;
        }
      }
      return hasValidItem;
    }
    return hasPermission(currentUser.role, item.id);
  });

  return (
    <aside
      id="sidebar-container"
      className="w-56 bg-[#2a2826] text-[#e8e4dc] flex flex-col h-screen overflow-hidden font-sans sticky top-0 shrink-0 border-r border-[#3d3a36]"
    >
      <div className="px-3 py-2.5 border-b border-[#3d3a36] flex items-center gap-2 shrink-0">
        <div className="bg-[var(--color-brand)] p-1.5 rounded-[4px] text-[#faf8f4]">
          <ShoppingCart className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[11px] font-bold text-[#faf8f4] leading-tight truncate">ADAMU MASPARE</h2>
          <span className="text-[9px] text-[#c47a3a] font-mono block">Vipuri & POS</span>
        </div>
      </div>

      <nav className="flex-1 px-1.5 py-2 overflow-y-auto">
        {filteredItems.map((item, idx) => {
          if (item.isHeader) {
            return (
              <div
                key={`header-${idx}`}
                className="text-[10px] font-medium text-[#9a9084] pt-2.5 pb-0.5 px-2 border-t border-[#3d3a36] mt-1 first:border-t-0 first:mt-0 first:pt-0"
              >
                {item.label}
              </div>
            );
          }

          const IconComponent = item.icon!;
          const isActive = activeScreen === item.id;

          return (
            <button
              type="button"
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => {
                navigate(`/${item.id}`);
                onCloseMobile?.();
              }}
              className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] text-[11px] font-medium transition-colors ${
                isActive 
                  ? 'bg-[var(--color-brand)] text-[#faf8f4]' 
                  : 'text-[#cfc9be] hover:bg-[#363330] hover:text-[#faf8f4]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <IconComponent className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#faf8f4]' : 'text-[#9a9084]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[9px] font-bold px-1 py-0.5 rounded-[3px] tabular-nums ${
                  isActive ? 'bg-black/20 text-[#faf8f4]' : 'bg-[var(--color-alert)] text-[#faf8f4]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-[#3d3a36] flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-[4px] flex items-center justify-center text-[#faf8f4] font-bold text-[10px] bg-[var(--color-brand)]">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-[#faf8f4] truncate">{currentUser.name}</div>
            <div className="text-[9px] text-[#c47a3a] truncate">{currentUser.role}</div>
          </div>
        </div>
        <button
          type="button"
          id="logout-button"
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 border border-[#3d3a36] rounded-[4px] text-[10px] font-semibold text-[#9a9084] hover:text-[#faf8f4] hover:bg-[#363330] transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Ondoka (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
