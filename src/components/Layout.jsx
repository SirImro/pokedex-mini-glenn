import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { getBalance, claimDailyBonus } from "../utils/casinoState.js";
import { formatCoins } from "../utils.js";
import AdminModal from "./AdminModal.jsx";

function Layout() {
  const [balance, setBalance] = useState(getBalance());
  const [bonusMsg, setBonusMsg] = useState("");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleBalanceChange = (e) => {
      if (e.detail !== undefined) {
        setBalance(e.detail);
      } else {
        setBalance(getBalance());
      }
    };

    window.addEventListener("balance-changed", handleBalanceChange);
    return () => {
      window.removeEventListener("balance-changed", handleBalanceChange);
    };
  }, []);

  const handleQuickClaim = () => {
    const res = claimDailyBonus();
    setBonusMsg(res.message);
    setTimeout(() => setBonusMsg(""), 3000);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <Link to="/" className="brand-link">
            <div className="pokeball-logo">
              <div className="logo-center"></div>
            </div>
            <div className="brand-text">
              <h1>PokéDex<span className="brand-highlight"> Arcade</span></h1>
              <span className="brand-tagline">Explorer & Battle Casino</span>
            </div>
          </Link>

          <div className="wallet-badge-container">
            <Link to="/casino" className="wallet-badge" title="Ke PokéCasino">
              <span className="coin-icon">🪙</span>
              <span className="balance-text">{formatCoins(balance)}</span>
            </Link>

            <button className="claim-btn" onClick={handleQuickClaim} title="+500 PokéCoins Gratis">
              🎁 Bonus
            </button>

            <button
              className="admin-header-btn"
              onClick={() => setIsAdminOpen(true)}
              title="Akses Admin Panel & Tambah Koin"
            >
              🔑 Admin
            </button>
          </div>
        </div>

        {bonusMsg && <div className="bonus-toast">{bonusMsg}</div>}

        <nav className="app-nav">
          <Link
            to="/"
            className={`nav-tab ${location.pathname === "/" || location.pathname.startsWith("/pokemon") ? "active" : ""}`}
          >
            <span>📖 Pokédex</span>
          </Link>
          <Link
            to="/casino"
            className={`nav-tab casino-tab ${location.pathname === "/casino" ? "active" : ""}`}
          >
            <span className="spin-badge-icon">🎰</span>
            <span>PokéCasino Judi</span>
            <span className="hot-pill">HOT 🔥</span>
          </Link>
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

      <footer className="app-footer">
        <p>PokéDex Arcade & Casino &copy; {new Date().getFullYear()} — Powered by PokéAPI</p>
      </footer>
    </div>
  );
}

export default Layout;