import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
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

const VALID_SCREENS = new Set([
  'dashboard', 'inventory', 'low_stock', 'pos', 'wholesale_pos', 'retail_pos',
  'customers', 'suppliers', 'goods_received', 'stock_transfer', 'stock_count',
  'expenses', 'reports', 'profit_loss', 'stock_movement', 'warranty', 'users', 'settings',
]);

function resolveScreen(routeScreen: string | undefined): string {
  if (routeScreen && VALID_SCREENS.has(routeScreen)) return routeScreen;
  return 'dashboard';
}

const AppShell: React.FC = () => {
  const { currentUser, setScreen, showToast } = useApp();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { screen: routeScreen } = useParams<{ screen: string }>();
  const deniedToastFor = useRef<string | null>(null);

  // URL is the only driver of which screen is shown (no lag via context)
  const activeScreen = resolveScreen(routeScreen);

  // Persist screen id for offline restore; do not drive rendering from this
  useEffect(() => {
    if (!routeScreen || !VALID_SCREENS.has(routeScreen)) {
      navigate('/dashboard', { replace: true });
      return;
    }
    setScreen(routeScreen);
  }, [routeScreen, setScreen, navigate]);

  // RBAC against the URL screen (not lagged context state)
  useEffect(() => {
    if (!currentUser) return;
    if (!hasPermission(currentUser.role, activeScreen)) {
      if (deniedToastFor.current !== activeScreen) {
        deniedToastFor.current = activeScreen;
        showToast('Huna ruhusa ya kuona ukurasa huu', 'error');
      }
      navigate('/dashboard', { replace: true });
      return;
    }
    deniedToastFor.current = null;
  }, [currentUser, activeScreen, showToast, navigate]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const renderScreen = () => {
    if (!hasPermission(currentUser.role, activeScreen)) {
      return <DashboardScreen />;
    }

    switch (activeScreen) {
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
    <div id="app-root-shell" className="min-h-screen bg-slate-50 flex overflow-hidden font-sans">
      <div className="hidden lg:block shrink-0 border-r border-slate-200">
        <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex w-72 max-w-xs flex-col bg-white border-r border-slate-200 h-full animate-in slide-in-from-left duration-200">
            <div
              className="absolute right-4 top-4 p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </div>
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar onOpenMobileMenu={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          <div className="animate-in fade-in duration-300" key={activeScreen}>
            {renderScreen()}
          </div>
        </main>
      </div>
    </div>
  );
};

const LoginRoute: React.FC = () => {
  const { currentUser } = useApp();
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <LoginScreen />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginRoute />} />
    <Route path="/:screen" element={<AppShell />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
