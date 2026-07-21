import React from 'react';
import { Order, BusinessSettings } from '../types';

interface DocumentPreviewProps {
  order: Order;
  settings: BusinessSettings;
  currencyFmt: (n: number) => string;
}

function docKind(order: Order): 'proforma' | 'invoice' | 'receipt' {
  if (order.documentType === 'proforma') return 'proforma';
  if (order.salesType === 'Wholesale') return 'invoice';
  return 'receipt';
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ order, settings, currencyFmt }) => {
  const kind = docKind(order);
  const isA4 = kind === 'proforma' || kind === 'invoice';
  const title =
    kind === 'proforma' ? 'PROFORMA INVOICE' : kind === 'invoice' ? 'TAX INVOICE' : 'RISITI / RECEIPT';
  const subtotal = order.totalAmount - (order.taxAmount || 0) + order.discount;
  const balance = order.totalAmount - order.paidAmount;
  const isProforma = kind === 'proforma';
  const isConverted = !!order.convertedToOrderId;

  return (
    <div
      id="receipt-paper"
      className={
        isA4
          ? 'print-invoice-a4 w-full bg-white p-8 border border-slate-300 shadow-md font-sans text-sm text-slate-800 space-y-5 max-w-[210mm] relative'
          : 'print-receipt w-full bg-white p-5 border border-slate-300 shadow-md font-sans text-xs text-slate-800 space-y-4 flex flex-col justify-between relative'
      }
      style={!isA4 ? { maxWidth: `${settings.thermalPrinterWidthMm || 80}mm` } : undefined}
    >
      {isProforma && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-center text-[10px] font-black uppercase tracking-wider py-1.5 rounded-lg">
          SIYO INVOICE HALISI — Proforma / Quotation only
        </div>
      )}

      {/* Shop header */}
      <div className={`space-y-1 border-b border-slate-300 pb-4 ${isA4 ? 'text-left' : 'text-center'}`}>
        <div className={isA4 ? 'flex justify-between items-start gap-4' : ''}>
          <div>
            <h4 className="text-base font-black uppercase text-slate-900 tracking-tight">
              {settings.businessName}
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{settings.address}</p>
            <p className="text-[10px] text-slate-500">Tel: {settings.phone}</p>
            <p className="text-[10px] text-slate-500">Email: {settings.email}</p>
          </div>
          {isA4 && (
            <div className="text-right shrink-0">
              <p className="text-lg font-black uppercase text-teal-700 tracking-wide">{title}</p>
              <p className="text-[11px] font-mono font-bold text-slate-800 mt-1">#{order.orderNumber}</p>
              {isConverted && (
                <p className="text-[9px] text-emerald-700 font-bold mt-1">IMEBADILISHWA KUWA MAUZO</p>
              )}
            </div>
          )}
        </div>
        {!isA4 && (
          <p className="text-[11px] font-black uppercase text-teal-700 pt-1">{title}</p>
        )}
      </div>

      {/* Meta */}
      <div className={`grid ${isA4 ? 'grid-cols-2 gap-4' : 'gap-1'} text-[11px] text-slate-600`}>
        <div className="space-y-1">
          {!isA4 && (
            <div className="flex justify-between">
              <span>Nambari:</span>
              <span className="font-bold font-mono text-slate-900">#{order.orderNumber}</span>
            </div>
          )}
          <div className={isA4 ? '' : 'flex justify-between'}>
            <span className="text-slate-500">Tarehe:</span>{' '}
            <span className="font-mono font-semibold text-slate-800">{order.date}</span>
          </div>
          <div className={isA4 ? '' : 'flex justify-between'}>
            <span className="text-slate-500">Mhudumu:</span>{' '}
            <span className="font-semibold text-slate-800">{order.sellerName}</span>
          </div>
          <div className={isA4 ? '' : 'flex justify-between'}>
            <span className="text-slate-500">Mteja:</span>{' '}
            <span className="font-bold text-slate-900">{order.customerName}</span>
          </div>
        </div>
        {isA4 && (
          <div className="space-y-1 text-right">
            {order.dueDate && (
              <div>
                <span className="text-slate-500">Ukomo wa Malipo:</span>{' '}
                <span className="font-mono font-bold text-rose-600">{order.dueDate}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Aina:</span>{' '}
              <span className="font-bold text-slate-800">{order.salesType}</span>
            </div>
            {!isProforma && (
              <div>
                <span className="text-slate-500">Malipo:</span>{' '}
                <span className="font-bold text-slate-800">{order.paymentMethod}</span>
              </div>
            )}
          </div>
        )}
        {!isA4 && order.dueDate && (
          <div className="flex justify-between text-rose-600 font-bold border-t border-dashed border-slate-100 pt-1 mt-1">
            <span>Ukomo wa Malipo:</span>
            <span className="font-mono">{order.dueDate}</span>
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="border-t border-b border-slate-300 py-3">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              <th className="pb-2">Bidhaa</th>
              <th className="pb-2 text-center">Idadi</th>
              <th className="pb-2 text-right">Bei</th>
              <th className="pb-2 text-right">Jumla</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={idx} className="text-[11px]">
                <td className="py-2 pr-1 font-semibold text-slate-900">
                  {item.productName}
                  {item.partNumber && (
                    <span className="block text-[9px] font-mono text-slate-400 font-normal">
                      {item.partNumber}
                    </span>
                  )}
                </td>
                <td className="py-2 text-center font-mono">{item.quantity}</td>
                <td className="py-2 text-right font-mono">{item.price.toLocaleString()}</td>
                <td className="py-2 text-right font-mono font-bold text-slate-900">
                  {item.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="space-y-1.5 text-right font-medium text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-500">Jumla Ndogo (Subtotal):</span>
          <span className="font-mono font-semibold">{currencyFmt(subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-rose-600">
            <span>Punguzo (Discount):</span>
            <span className="font-mono font-semibold">-{currencyFmt(order.discount)}</span>
          </div>
        )}
        {(order.taxAmount || 0) > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>VAT ({order.taxRate || 0}%):</span>
            <span className="font-mono font-semibold">{currencyFmt(order.taxAmount || 0)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black text-teal-700 border-t border-slate-200 pt-2">
          <span>JUMLA KUU:</span>
          <span className="font-mono">{currencyFmt(order.totalAmount)}</span>
        </div>

        {!isProforma && (
          <>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Kiasi Kilicholipwa:</span>
              <span className="font-mono font-bold text-emerald-600">{currencyFmt(order.paidAmount)}</span>
            </div>
            {balance > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Deni / Balance Due:</span>
                <span className="font-mono">{currencyFmt(balance)}</span>
              </div>
            )}
          </>
        )}
        {isProforma && (
          <p className="text-[10px] text-amber-800 text-left pt-2 font-semibold">
            Hii ni makadirio ya bei pekee. Stoo haitapungua mpaka mauzo yakamilishwe.
          </p>
        )}
      </div>

      <div className="text-center pt-3 border-t border-dashed border-slate-300">
        <p className="text-[10px] italic font-semibold text-slate-500">{settings.receiptFooter}</p>
      </div>
    </div>
  );
};
