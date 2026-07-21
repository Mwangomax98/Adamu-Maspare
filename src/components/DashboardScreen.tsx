import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const DashboardScreen: React.FC = () => {
  const {
    products, orders, expenses, currentUser, settings
  } = useApp();
  const navigate = useNavigate();

  if (!currentUser) return null;

  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  const totalCOGS = orders.reduce((sum, order) => {
    const orderCOGS = order.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
    return sum + orderCOGS;
  }, 0);

  const grossProfit = totalSales - totalCOGS;
  const totalExpenses = expenses.filter(exp => !exp.isExternalSourcing).reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const totalStockItems = products.reduce((sum, prod) => sum + prod.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStockLevel).length;
  const canStock = ['Admin', 'Store Keeper'].includes(currentUser.role);
  const isAdmin = currentUser.role === 'Admin';

  const getLast7DaysData = () => {
    const days: { dateStr: string; label: string }[] = [];
    const dateMap: { [key: string]: { mauzo: number; faida: number } } = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('sw-TZ', { weekday: 'short' });
      dateMap[dateStr] = { mauzo: 0, faida: 0 };
      days.push({ dateStr, label: dayName });
    }

    orders.forEach(order => {
      const orderDate = order.date.split(' ')[0];
      if (dateMap[orderDate] !== undefined) {
        dateMap[orderDate].mauzo += order.totalAmount;
        const orderCOGS = order.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        dateMap[orderDate].faida += order.totalAmount - orderCOGS;
      }
    });

    return days.map(day => ({
      name: day.label,
      mauzo: dateMap[day.dateStr].mauzo,
      faida: dateMap[day.dateStr].faida,
    }));
  };

  const dayRows = getLast7DaysData();
  const lowStockProducts = products.filter(p => p.stock <= p.minStockLevel).slice(0, 4);
  const recentOrders = orders.slice(0, 5);

  const todayLabel = new Date().toLocaleDateString('sw-TZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fmt = (n: number) => n.toLocaleString();

  return (
    <div id="dashboard-screen" className="space-y-2.5 font-sans">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--color-border)] pb-2">
        <div className="text-[12px] text-[var(--color-text)]">
          <span className="font-semibold">{todayLabel}</span>
          <span className="text-[var(--color-muted)]"> · </span>
          <span className="text-[var(--color-muted)]">{currentUser.name}</span>
          <span className="text-[var(--color-muted)]"> · </span>
          <span className="font-medium text-[var(--color-brand)]">{currentUser.role}</span>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          {['Admin', 'Cashier'].includes(currentUser.role) && (
            <button
              id="dash-quick-pos"
              type="button"
              onClick={() => navigate('/pos')}
              className="font-semibold text-[var(--color-brand)] hover:underline"
            >
              Fanya Mauzo POS
            </button>
          )}
          {canStock && (
            <button
              id="dash-quick-inventory"
              type="button"
              onClick={() => navigate('/inventory')}
              className="font-semibold text-[var(--color-text)] hover:underline"
            >
              Bidhaa
            </button>
          )}
        </div>
      </div>

      {/* Low stock alert — only when needed */}
      {lowStockCount > 0 && (
        <div className="dash-alert">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[12px] font-semibold text-[var(--color-alert)]">
              {lowStockCount} bidhaa ziko chini ya kiwango
            </p>
            {canStock && (
              <button
                id="dash-add-stock-btn"
                type="button"
                onClick={() => navigate('/low_stock')}
                className="text-[11px] font-semibold text-[var(--color-alert)] hover:underline"
              >
                Ongeza Mzigo Stooni
              </button>
            )}
          </div>
          <ul className="mt-1.5 space-y-0.5">
            {lowStockProducts.map((p) => (
              <li key={p.id} className="flex justify-between gap-3 text-[11px] text-[var(--color-text)]">
                <span className="min-w-0 truncate">{p.name}</span>
                <span className="font-mono tabular-nums shrink-0 text-[var(--color-alert)]">
                  {p.stock}/{p.minStockLevel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metrics ledger */}
      <div className="ledger-strip">
        <div className="ledger-cell">
          <span className="ledger-label">Jumla ya Mauzo</span>
          <span id="stat-total-sales" className="ledger-value">
            {fmt(totalSales)} <span className="ledger-unit">{settings.currency}</span>
          </span>
        </div>
        {isAdmin ? (
          <div className="ledger-cell">
            <span className="ledger-label">Faida Halisi (Net)</span>
            <span
              id="stat-net-profit"
              className={`ledger-value ${netProfit >= 0 ? '' : 'text-[var(--color-alert)]'}`}
            >
              {fmt(netProfit)} <span className="ledger-unit">{settings.currency}</span>
            </span>
          </div>
        ) : (
          <div className="ledger-cell">
            <span className="ledger-label">Miamala ya Mauzo</span>
            <span className="ledger-value">
              {orders.length} <span className="ledger-unit">Invoices</span>
            </span>
          </div>
        )}
        {isAdmin ? (
          <div className="ledger-cell">
            <span className="ledger-label">Gharama (Expenses)</span>
            <span id="stat-total-expenses" className="ledger-value">
              {fmt(totalExpenses)} <span className="ledger-unit">{settings.currency}</span>
            </span>
          </div>
        ) : (
          <div className="ledger-cell">
            <span className="ledger-label">Jumla ya Bidhaa</span>
            <span className="ledger-value">
              {fmt(totalStockItems)} <span className="ledger-unit">Pcs</span>
            </span>
          </div>
        )}
        <div
          className={`ledger-cell ${canStock ? 'cursor-pointer hover:bg-[#f5f1ea]' : ''}`}
          role={canStock ? 'button' : undefined}
          tabIndex={canStock ? 0 : undefined}
          onClick={() => canStock && navigate('/low_stock')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canStock) navigate('/low_stock');
          }}
        >
          <span className="ledger-label">Stoki ya Chini</span>
          <span
            id="stat-low-stock"
            className={`ledger-value ${lowStockCount > 0 ? 'text-[var(--color-alert)]' : ''}`}
          >
            {lowStockCount} <span className="ledger-unit">Bidhaa</span>
          </span>
        </div>
      </div>

      {/* Daybook + recent sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
        <div className="panel overflow-hidden lg:col-span-1">
          <div className="px-2.5 py-1.5 border-b border-[var(--color-border)]">
            <h4 className="text-[12px] font-semibold text-[var(--color-text)]">
              Mauzo siku 7
            </h4>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-[var(--color-muted)] border-b border-[var(--color-border)]">
                <th className="px-2.5 py-1 font-semibold">Siku</th>
                <th className="px-2.5 py-1 font-semibold text-right">Mauzo</th>
                {isAdmin && (
                  <th className="px-2.5 py-1 font-semibold text-right">Faida</th>
                )}
              </tr>
            </thead>
            <tbody>
              {dayRows.map((row) => (
                <tr key={row.name} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-2.5 py-1 text-[var(--color-text)]">{row.name}</td>
                  <td className="px-2.5 py-1 text-right font-mono tabular-nums">
                    {fmt(row.mauzo)}
                  </td>
                  {isAdmin && (
                    <td className="px-2.5 py-1 text-right font-mono tabular-nums text-[var(--color-muted)]">
                      {fmt(row.faida)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel overflow-hidden lg:col-span-2">
          <div className="px-2.5 py-1.5 border-b border-[var(--color-border)] flex items-center justify-between gap-2">
            <h4 className="text-[12px] font-semibold text-[var(--color-text)]">
              Miamala ya Hivi Karibuni
            </h4>
            <button
              id="dash-view-all-reports"
              type="button"
              onClick={() => navigate('/reports')}
              className="text-[11px] font-semibold text-[var(--color-brand)] hover:underline"
            >
              Angalia Ripoti Zote
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[11px]">
              <thead>
                <tr className="text-[var(--color-muted)] border-b border-[var(--color-border)]">
                  <th className="px-2.5 py-1 font-semibold">Ankara #</th>
                  <th className="px-2.5 py-1 font-semibold">Mteja</th>
                  <th className="px-2.5 py-1 font-semibold">Aina</th>
                  <th className="px-2.5 py-1 font-semibold">Njia ya Malipo</th>
                  <th className="px-2.5 py-1 font-semibold text-right">Jumla Kuu</th>
                  <th className="px-2.5 py-1 font-semibold">Hali</th>
                  <th className="px-2.5 py-1 font-semibold text-right">Tarehe</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2.5 py-2 text-[var(--color-muted)]">
                      Hakuna mauzo yaliyofanyika bado.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[#f5f1ea]">
                      <td className="px-2.5 py-1 font-mono font-semibold text-[var(--color-brand)]">
                        {order.orderNumber}
                        {order.source_type === 'external_sourced' && (
                          <span className="ml-1 text-[9px] font-bold text-[var(--color-alert)]">NJE</span>
                        )}
                      </td>
                      <td className="px-2.5 py-1 text-[var(--color-text)]">{order.customerName}</td>
                      <td className="px-2.5 py-1 text-[var(--color-muted)]">
                        {order.salesType === 'Wholesale' ? 'Jumla' : 'Rejareja'}
                      </td>
                      <td className="px-2.5 py-1 text-[var(--color-muted)]">{order.paymentMethod}</td>
                      <td className="px-2.5 py-1 text-right font-mono tabular-nums text-[var(--color-text)]">
                        {fmt(order.totalAmount)} {settings.currency}
                      </td>
                      <td
                        className={`px-2.5 py-1 ${
                          order.paymentStatus === 'Paid'
                            ? 'text-[var(--color-text)]'
                            : order.paymentStatus === 'Partial'
                              ? 'text-[var(--color-warn)]'
                              : 'text-[var(--color-alert)]'
                        }`}
                      >
                        {order.paymentStatus === 'Paid'
                          ? 'Imelipwa'
                          : order.paymentStatus === 'Partial'
                            ? 'Nusu'
                            : 'Mkopo'}
                      </td>
                      <td className="px-2.5 py-1 text-right font-mono text-[var(--color-muted)]">
                        {order.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
