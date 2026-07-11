import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Database, Download, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useApp();

  // Form State
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopEmail, setShopEmail] = useState(settings.shopEmail);
  const [currency, setCurrency] = useState(settings.currency);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  // Backup & Restore Simulation State
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName,
      shopAddress,
      shopPhone,
      shopEmail,
      currency,
      receiptFooter
    });
    alert('Mipangilio imehifadhiwa kikamilifu!');
  };

  const handleRunBackup = () => {
    setBackupLoading(true);
    setBackupSuccess(false);
    setTimeout(() => {
      setBackupLoading(false);
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    }, 2500);
  };

  const handleRunRestore = () => {
    setRestoreLoading(true);
    setRestoreSuccess(false);
    setTimeout(() => {
      setRestoreLoading(false);
      setRestoreSuccess(true);
      setTimeout(() => setRestoreSuccess(false), 4000);
    }, 2500);
  };

  return (
    <div id="settings-screen" className="space-y-6 font-sans">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold uppercase text-slate-800">Mipangilio ya Mfumo (Shop & System Settings)</h2>
        <p className="text-xs text-slate-500 mt-1">Dhibiti taarifa za duka, risiti, kodi, na kufanya salama ya data (Backup & Restore).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left column: Shop Settings Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase text-slate-800 border-b border-slate-100 pb-3 mb-4">Wasifu na Taarifa za Duka</h3>
          
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Jina la Duka / Biashara</label>
                <input
                  type="text"
                  required
                  id="settings-shop-name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Fedha Inayotumika (Currency)</label>
                <select
                  id="settings-currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="TZS">TZS (Shilingi ya Tanzania)</option>
                  <option value="USD">USD (Dola ya Kimarekani)</option>
                  <option value="KES">KES (Shilingi ya Kenya)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Nambari ya Simu ya Ofisi</label>
                <input
                  type="text"
                  required
                  id="settings-shop-phone"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Barua Pepe (Email)</label>
                <input
                  type="email"
                  required
                  id="settings-shop-email"
                  value={shopEmail}
                  onChange={(e) => setShopEmail(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Anwani ya Duka</label>
              <input
                type="text"
                required
                id="settings-shop-address"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase">Ujumbe wa Chini kwenye Risiti (Receipt Footer)</label>
              <textarea
                required
                id="settings-receipt-footer"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                rows={3}
                className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              id="save-settings-btn"
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Hifadhi Mipangilio</span>
            </button>
          </form>
        </div>

        {/* Right column: Database Backup and Restore */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold uppercase text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
            <Database className="h-4 w-4 text-teal-600" />
            <span>Salama ya Data & Backup</span>
          </h3>

          {/* Backup Action */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase">Tengeneza Backup ya Mfumo</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Pakua file lenye data zote za sasa (Wateja, Bidhaa, Ankara) kama salama dhidi ya upotevu.</p>
            </div>

            {backupLoading ? (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 text-xs text-slate-600 font-semibold border border-slate-100">
                <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" />
                <span>Inapakua Backup... Tafadhali subiri</span>
              </div>
            ) : backupSuccess ? (
              <div className="p-3 bg-emerald-50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold border border-emerald-100">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                <span>Backup imepakuliwa kwa usalama! (.json)</span>
              </div>
            ) : (
              <button
                id="run-backup-btn"
                onClick={handleRunBackup}
                className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Pakua Backup (JSON)</span>
              </button>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Restore Action */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase">Rudisha Data (Restore Backup)</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Pakia faili la salama (backup file) uliyowahi kuipakua ili kurudisha mfumo katika hali ya awali.</p>
            </div>

            {restoreLoading ? (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 text-xs text-slate-600 font-semibold border border-slate-100">
                <RefreshCw className="h-4 w-4 text-teal-600 animate-spin" />
                <span>Inapakia data... Tafadhali subiri</span>
              </div>
            ) : restoreSuccess ? (
              <div className="p-3 bg-emerald-50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold border border-emerald-100">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                <span>Data imerejeshwa vizuri! Mfumo upo sawa.</span>
              </div>
            ) : (
              <button
                id="run-restore-btn"
                onClick={handleRunRestore}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Upload className="h-4 w-4" />
                <span>Rudisha Kutoka Kwenye File</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
