import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Database, Download, Upload, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, clearAllData, triggerBackup, triggerRestore, showToast } = useApp();

  // Form State — aligned with BusinessSettings
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [currency, setCurrency] = useState(settings.currency);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  // Sync form when settings load/refresh from API
  useEffect(() => {
    setBusinessName(settings.businessName);
    setAddress(settings.address);
    setPhone(settings.phone);
    setEmail(settings.email);
    setCurrency(settings.currency);
    setReceiptFooter(settings.receiptFooter);
  }, [settings]);

  // Reset confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings({
      businessName,
      address,
      phone,
      email,
      currency,
      receiptFooter,
      lastBackupDate: settings.lastBackupDate,
    });
  };

  const handleRunBackup = () => {
    setBackupLoading(true);
    setBackupSuccess(false);
    try {
      triggerBackup();
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 4000);
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRunRestore = () => {
    fileInputRef.current?.click();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreLoading(true);
    setRestoreSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        triggerRestore(data);
        setRestoreSuccess(true);
        setTimeout(() => setRestoreSuccess(false), 4000);
      } catch {
        showToast('Faili la backup si sahihi', 'error');
      } finally {
        setRestoreLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
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
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Barua Pepe (Email)</label>
                <input
                  type="email"
                  required
                  id="settings-shop-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleRestoreFile}
            />
          </div>

          <hr className="border-slate-100" />

          {/* Clean Slate / Reset Data */}
          <div className="space-y-3 pt-1">
            <div>
              <h4 className="text-xs font-bold text-rose-600 uppercase flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>Safisha Data (Clear All Data)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Futa data za biashara (bidhaa, ankara, stoki, matumizi, wateja isipokuwa walk-in). Watumiaji na mipangilio yatahifadhiwa.
              </p>
            </div>

            {showResetConfirm ? (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl space-y-3">
                <p className="text-[11px] text-rose-700 font-bold leading-normal">
                  ⚠️ Je, una uhakika unataka kufuta data zote za majaribio? Kitendo hiki hakiwezi kurudishwa nyuma!
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllData();
                      setShowResetConfirm(false);
                    }}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase transition-all"
                  >
                    Ndiyo, Futa Zote
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold uppercase transition-all"
                  >
                    Ghairi
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="clear-demo-data-btn"
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Database className="h-4 w-4 text-rose-500" />
                <span>Safisha Data ya Biashara</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
