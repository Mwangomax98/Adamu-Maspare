import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, Package, AlertTriangle, ShoppingCart, 
  Users, Truck, Download, ArrowLeftRight, ClipboardList, 
  TrendingUp, BarChart3, Receipt, FileText, UserCog, Settings,
  LogOut, ShoppingBag, Wallet
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
    
    // Group: Mauzo / POS
    { id: 'section-sales', label: 'SEHEMU YA MAUZO', isHeader: true },
    { id: 'pos', label: 'POS - Cashier', icon: ShoppingCart },
    { id: 'wholesale_pos', label: 'Mauzo ya Jumla', icon: ShoppingBag },
    { id: 'retail_pos', label: 'Mauzo ya Rejareja', icon: Wallet },
    
    // Group: Inventory / Stoo
    { id: 'section-inventory', label: 'USIMAMIZI WA STOO', isHeader: true },
    { id: 'inventory', label: 'Bidhaa & Bei', icon: Package },
    { 
      id: 'low_stock', 
      label: 'Stoki ya Chini', 
      icon: AlertTriangle, 
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-rose-500 text-white' 
    },
    { id: 'goods_received', label: 'Kupokea Mzigo (In)', icon: Download },
    { id: 'stock_transfer', label: 'Kuhamisha Stock', icon: ArrowLeftRight },
    { id: 'stock_count', label: 'Kukagua Stoo (Count)', icon: ClipboardList },
    
    // Group: Watu
    { id: 'section-contacts', label: 'MAHUSIANO', isHeader: true },
    { id: 'customers', label: 'Wateja na Madeni', icon: Users },
    { id: 'suppliers', label: 'Wasambazaji', icon: Truck },
    
    // Group: Ripoti & Fedha
    { id: 'section-reports', label: 'TAARIFA & FEDHA', isHeader: true },
    { id: 'expenses', label: 'Matumizi (Expenses)', icon: Receipt },
    { id: 'reports', label: 'Ripoti za Mauzo', icon: TrendingUp },
    { id: 'profit_loss', label: 'Faida & Hasara', icon: BarChart3 },
    { id: 'stock_movement', label: 'Miondoko ya Bidhaa', icon: FileText },
    
    // Group: Admin
    { id: 'section-admin', label: 'UTAWALA', isHeader: true },
    { id: 'users', label: 'Watumiaji (Users)', icon: UserCog },
    { id: 'settings', label: 'Mipangilio ya Mfumo', icon: Settings },
  ];

  // Filter menu items based on role permission
  const filteredItems = menuItems.filter(item => {
    if (item.isHeader) {
      // Check if there's at least one non-header item in this section that the user has permission for
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
    <aside id="sidebar-container" className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen overflow-y-auto font-sans sticky top-0 shrink-0">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-teal-600 p-2 rounded-xl text-white shadow-md shadow-teal-500/10">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">ADAMU MASPARE</h2>
          <span className="text-[10px] text-teal-400 font-mono tracking-widest">v1.0 PREMIUM</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredItems.map((item, idx) => {
          if (item.isHeader) {
            return (
              <div 
                key={`header-${idx}`} 
                className="text-[10px] font-bold text-slate-500 tracking-wider uppercase pt-4 pb-2 px-3"
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/15 font-semibold' 
                  : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-teal-500 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${currentUser.avatarColor || 'bg-teal-600'}`}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-slate-400 truncate uppercase">{currentUser.role}</div>
          </div>
        </div>
        <button
          id="logout-button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-800 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Ondoka (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
