import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar, hasPermission } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardScreen } from './components/DashboardScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { LowStockScreen } from './components/LowStockScreen';
import { POSScreen } from './components/POSScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { SuppliersScreen } from './components/SuppliersScreen';
import { WarehouseOperations } from './components/WarehouseOperations';
import { ExpensesScreen } from './components/ExpensesScreen';
import { FinancialReports } from './components/FinancialReports';
import { WarrantyScreen } from './components/WarrantyScreen';
import { UserManagementScreen } from './components/UserManagementScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser, currentScreen, setScreen, showToast } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Enforce RBAC at route level (not sidebar-only)
  useEffect(() => {
    if (!currentUser) return;
    if (!hasPermission(currentUser.role, currentScreen)) {
      showToast('Huna ruhusa ya kuona ukurasa huu', 'error');
      setScreen('dashboard');
    }
  }, [currentUser, currentScreen, setScreen, showToast]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    if (!hasPermission(currentUser.role, currentScreen)) {
      return <DashboardScreen />;
    }

    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'inventory':
        return <InventoryScreen />;
      case 'low_stock':
        return <LowStockScreen />;
      case 'pos':
        return <POSScreen mode="cashier" />;
      case 'wholesale_pos':
        return <POSScreen mode="wholesale" />;
      case 'retail_pos':
        return <POSScreen mode="retail" />;
      case 'customers':
        return <CustomersScreen />;
      case 'suppliers':
        return <SuppliersScreen />;
      case 'goods_received':
        return <WarehouseOperations initialTab="goods_received" />;
      case 'stock_transfer':
        return <WarehouseOperations initialTab="stock_transfer" />;
      case 'stock_count':
        return <WarehouseOperations initialTab="stock_count" />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'reports':
        return <FinancialReports initialTab="sales" />;
      case 'profit_loss':
        return <FinancialReports initialTab="profit_loss" />;
      case 'stock_movement':
        return <FinancialReports initialTab="stock_movement" />;
      case 'warranty':
        return <WarrantyScreen />;
      case 'users':
        return <UserManagementScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div id="app-root-shell" className="min-h-screen bg-slate-100 flex overflow-hidden font-sans">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <div className="hidden lg:block shrink-0 border-r border-slate-200">
        <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
      </div>

      {/* 2. SIDEBAR (MOBILE DRAWER) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer content */}
          <div className="relative flex w-72 max-w-xs flex-col bg-white border-r border-slate-200 h-full animate-in slide-in-from-left duration-200">
            {/* Close button inside drawer */}
            <div className="absolute right-4 top-4 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer" onClick={() => setMobileSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </div>
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header bar */}
        <Topbar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />

        {/* Dynamic Inner Dashboard Page viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          <div className="animate-in fade-in duration-300">
            {renderScreen()}
          </div>
        </main>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
