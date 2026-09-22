import { useState } from "react";
import {
  getBalance,
  updateBalance,
  setExactBalance,
  isGodModeActive,
  toggleGodMode,
  clearHistoryAndStats,
} from "../utils/casinoState.js";
import { formatCoins } from "../utils.js";

function AdminModal({ isOpen, onClose }) {
  const [customCoins, setCustomCoins] = useState("");
  const [godMode, setGodMode] = useState(isGodModeActive());
  const [adminMsg, setAdminMsg] = useState(null);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setAdminMsg(msg);
    setTimeout(() => setAdminMsg(null), 3000);
  };

  const handleQuickAdd = (amount) => {
    updateBalance(amount);
    showToast(`✅ Berhasil menambahkan +${new Intl.NumberFormat("id-ID").format(amount)} PokéCoins!`);
  };

  const handleSetCustomCoins = (e) => {
    e.preventDefault();
    const val = parseInt(customCoins, 10);
    if (isNaN(val) || val < 0) {
      return showToast("⚠️ Masukkan jumlah koin valid!");
    }
    setExactBalance(val);
    setCustomCoins("");
    showToast(`✅ Saldo diatur ke ${formatCoins(val)}!`);
  };

  const handleToggleGod = () => {
    const nextState = toggleGodMode();
    setGodMode(nextState);
    if (nextState) {
      showToast("⚡ God Mode Aktif! Saldo PokéCoins tak terbatas (9.999.999 🪙)");
    } else {
      showToast("🔒 God Mode Dinonaktifkan.");
    }
  };

  const handleClearHistory = () => {
    clearHistoryAndStats();
    showToast("🧹 Riwayat taruhan dan statistik berhasil dibersihkan!");
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card">
        <div className="admin-modal-header">
          <div className="header-title-box">
            <span className="admin-icon">🔑</span>
            <div>
              <h3>Admin & Coins Console</h3>
              <p>Kelola Saldo PokéCoins & Fitur Pengembang</p>
            </div>
          </div>
          <button className="close-admin-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {adminMsg && <div className="admin-toast">{adminMsg}</div>}

        <div className="admin-current-balance-box">
          <span className="label">Saldo Saat Ini:</span>
          <span className="value">
            {godMode ? "∞ GOD MODE (9.999.999 🪙)" : formatCoins(getBalance())}
          </span>
        </div>

        {/* Quick Add Coins */}
        <div className="admin-section-box">
          <h4>⚡ Tambah Koin Cepat</h4>
          <div className="quick-add-grid">
            <button className="admin-quick-btn" onClick={() => handleQuickAdd(1000)}>
              +1.000 🪙
            </button>
            <button className="admin-quick-btn" onClick={() => handleQuickAdd(10000)}>
              +10.000 🪙
            </button>
            <button className="admin-quick-btn" onClick={() => handleQuickAdd(100000)}>
              +100.000 🪙
            </button>
            <button className="admin-quick-btn mega" onClick={() => handleQuickAdd(1000000)}>
              +1.000.000 🪙 🔥
            </button>
          </div>
        </div>

        {/* Custom Coins Input */}
        <div className="admin-section-box">
          <h4>✏️ Atur Jumlah Saldo Tepat</h4>
          <form onSubmit={handleSetCustomCoins} className="custom-coins-form">
            <input
              type="number"
              min={0}
              max={99999999}
              value={customCoins}
              onChange={(e) => setCustomCoins(e.target.value)}
              placeholder="Masukkan angka saldo (contoh: 50000)…"
              className="admin-input"
            />
            <button type="submit" className="admin-submit-btn">
              Set Saldo
            </button>
          </form>
        </div>

        {/* God Mode Toggle & Clear Options */}
        <div className="admin-section-box">
          <h4>🛡️ Mode Pengembang & Reset</h4>
          <div className="admin-toggles-row">
            <button
              className={`godmode-toggle-btn ${godMode ? "active" : ""}`}
              onClick={handleToggleGod}
            >
              {godMode ? "⚡ GOD MODE (AKTIF)" : "🔒 AKTIFKAN GOD MODE"}
            </button>

            <button className="clear-history-btn" onClick={handleClearHistory}>
              🧹 Bersihkan Riwayat Taruhan
            </button>
          </div>
        </div>

        <div className="admin-modal-footer">
          <button className="done-btn" onClick={onClose}>
            Selesai & Tutup Console
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminModal;
