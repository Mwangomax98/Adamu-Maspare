import React from 'react';
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
      return ['Cashier', 'Admin'].includes(role);
    case 'wholesale_pos':
      return ['Wholesale Sales', 'Admin'].includes(role);
    case 'retail_pos':
      return ['Retail Sales', 'Admin'].includes(role);
    case 'customers':
      return ['Wholesale Sales', 'Admin'].includes(role);
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
  const { currentUser, logout, products, currentScreen, setScreen } = useApp();

  if (!currentUser) return null;

  const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashibodi', icon: LayoutDashboard },
    { id: 'section-sales', label: 'SEHEMU YA MAUZO', isHeader: true },
    { id: 'pos', label: 'POS - Cashier', icon: ShoppingCart },
    { id: 'wholesale_pos', label: 'Mauzo ya Jumla', icon: ShoppingBag },
    { id: 'retail_pos', label: 'Mauzo ya Rejareja', icon: Wallet },
    { id: 'section-inventory', label: 'USIMAMIZI WA STOO', isHeader: true },
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
    { id: 'section-contacts', label: 'MAHUSIANO', isHeader: true },
    { id: 'customers', label: 'Wateja na Madeni', icon: Users },
    { id: 'warranty', label: 'Marejesho & Dhamana', icon: ShieldCheck },
    { id: 'suppliers', label: 'Wasambazaji', icon: Truck },
    { id: 'section-reports', label: 'TAARIFA & FEDHA', isHeader: true },
    { id: 'expenses', label: 'Matumizi (Expenses)', icon: Receipt },
    { id: 'reports', label: 'Ripoti za Mauzo', icon: TrendingUp },
    { id: 'profit_loss', label: 'Faida & Hasara', icon: BarChart3 },
    { id: 'stock_movement', label: 'Miondoko ya Bidhaa', icon: FileText },
    { id: 'section-admin', label: 'UTAWALA', isHeader: true },
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
    <aside id="sidebar-container" className="w-64 bg-white border-r border-slate-200 text-slate-700 flex flex-col h-screen overflow-hidden font-sans sticky top-0 shrink-0">
      <div className="p-4 border-b border-slate-100 flex items-center gap-2.5 shrink-0 bg-white">
        <div className="bg-teal-600 p-2 rounded-xl text-white shadow-sm shadow-teal-600/20">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">ADAMU MASPARE</h2>
          <span className="text-[9px] text-teal-700 font-mono tracking-wide block font-semibold">Vipuri & POS</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredItems.map((item, idx) => {
          if (item.isHeader) {
            return (
              <div 
                key={`header-${idx}`} 
                className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase pt-3 pb-1 px-2.5"
              >
                {item.label}
              </div>
            );
          }

          const IconComponent = item.icon!;
          const isActive = currentScreen === item.id;

          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => {
                setScreen(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                isActive 
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20 font-bold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-extrabold text-xs bg-teal-600">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
            <div className="text-[9px] text-teal-700 font-bold truncate uppercase">{currentUser.role}</div>
          </div>
        </div>
        <button
          id="logout-button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Ondoka (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
