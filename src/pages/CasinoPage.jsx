import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "../config.js";
import {
  getBalance,
  updateBalance,
  resetBalance,
  claimDailyBonus,
  addHistoryRecord,
  getHistory,
  getStats,
} from "../utils/casinoState.js";
import {
  capitalize,
  formatCoins,
  calculateBattleOdds,
  getOfficialArtworkUrl,
  getTypeStyle,
  getFallbackPair,
} from "../utils.js";
import Confetti from "../components/Confetti.jsx";
import SpacemanCanvas from "../components/SpacemanCanvas.jsx";

const FEATURED_PAIRS = [
  ["charizard", "blastoise"],
  ["mewtwo", "dragonite"],
  ["pikachu", "raichu"],
  ["lucario", "gengar"],
  ["gyarados", "tyranitar"],
  ["sceptile", "swampert"],
  ["arcanine", "ninetales"],
  ["rayquaza", "mewtwo"],
  ["greninja", "lucario"],
];

const SLOT_ITEMS = [
  { icon: "⚡", name: "Pikachu", mult: 10, bg: "#FFCC33" },
  { icon: "🔥", name: "Charizard", mult: 15, bg: "#FF4422" },
  { icon: "💧", name: "Blastoise", mult: 15, bg: "#3399FF" },
  { icon: "🔮", name: "Mewtwo", mult: 25, bg: "#FF5599" },
  { icon: "🟣", name: "Masterball", mult: 50, bg: "#A000D0" },
  { icon: "🔴", name: "Pokéball", mult: 5, bg: "#EE2222" },
  { icon: "🐟", name: "Magikarp", mult: 2, bg: "#FF8833" },
];

function CasinoPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("spaceman"); // spaceman | arena | slot | gacha | history
  const [balance, setBalance] = useState(getBalance());
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync balance
  useEffect(() => {
    const handleBal = (e) => setBalance(e.detail !== undefined ? e.detail : getBalance());
    window.addEventListener("balance-changed", handleBal);
    return () => window.removeEventListener("balance-changed", handleBal);
  }, []);

  const triggerToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const triggerVictoryConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  // =============================================================
  // MODE 0: POKÉFLY SPACEMAN CRASH MULTIPLIER STATE
  // =============================================================
  const [spacemanStatus, setSpacemanStatus] = useState("IDLE"); // IDLE | COUNTDOWN | FLYING | CASHED_OUT | CRASHED
  const [spacemanBet, setSpacemanBet] = useState(100);
  const [autoCashout, setAutoCashout] = useState(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [hasBetInRound, setHasBetInRound] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [crashHistory, setCrashHistory] = useState([1.45, 3.2, 1.08, 15.4, 2.1, 1.15, 5.0, 1.8]);

  const animRef = useRef(null);

  const startSpacemanRound = () => {
    if (spacemanBet <= 0) return triggerToast("Masukkan jumlah taruhan valid!", true);
    if (balance < spacemanBet) return triggerToast("Saldo PokéCoins Anda tidak mencukupi!", true);
    if (spacemanStatus === "FLYING" || spacemanStatus === "COUNTDOWN") return;

    // Deduct Bet
    updateBalance(-spacemanBet);
    setHasBetInRound(true);
    setHasCashedOut(false);

    // Compute Provably Fair Crash Point
    // Probability curve: 5% instant crash at 1.00x, 95% exponential curve up to 100x
    const rand = Math.random();
    let point = 1.0;
    if (rand < 0.05) {
      point = 1.0;
    } else {
      const raw = Math.floor((100 / (100 - Math.random() * 94)) * 100) / 100;
      point = Math.min(100.0, Math.max(1.01, raw));
    }

    setCrashPoint(point);
    setSpacemanStatus("COUNTDOWN");
    setCurrentMultiplier(1.0);

    setTimeout(() => {
      setSpacemanStatus("FLYING");

      let start = performance.now();
      let currentMult = 1.0;

      const step = (now) => {
        const elapsed = (now - start) / 1000; // seconds
        // Exponential multiplier scaling rate
        currentMult = Number((1.0 + Math.pow(elapsed * 0.45, 1.6)).toFixed(2));
        setCurrentMultiplier(currentMult);

        // Check Auto Cashout
        if (hasBetInRound && !hasCashedOut && autoCashout > 1.0 && currentMult >= autoCashout && currentMult < point) {
          executeCashOut(autoCashout);
        }

        // Check Crash
        if (currentMult >= point) {
          // CRASHED!
          setSpacemanStatus("CRASHED");
          setCrashHistory((prev) => [point, ...prev].slice(0, 15));

          if (hasBetInRound && !hasCashedOut) {
            triggerToast(`💥 CRASH AT ${point.toFixed(2)}x! Taruhan Anda hangus!`, true);
            addHistoryRecord({
              type: "POKÉFLY SPACEMAN",
              title: `Crash at ${point.toFixed(2)}x`,
              amount: -spacemanBet,
              isWin: false,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
          }
          setHasBetInRound(false);
          return;
        }

        animRef.current = requestAnimationFrame(step);
      };

      animRef.current = requestAnimationFrame(step);
    }, 1500);
  };

  const executeCashOut = (targetMult = null) => {
    if (!hasBetInRound || hasCashedOut || spacemanStatus !== "FLYING") return;

    const multToUse = targetMult || currentMultiplier;
    const payout = Math.round(spacemanBet * multToUse);

    updateBalance(payout);
    setHasCashedOut(true);
    setSpacemanStatus("CASHED_OUT");
    triggerVictoryConfetti();
    triggerToast(`🎉 CASH OUT SUKSES! Menang ${formatCoins(payout)} (${multToUse.toFixed(2)}x)!`);

    addHistoryRecord({
      type: "POKÉFLY SPACEMAN",
      title: `Cash Out @ ${multToUse.toFixed(2)}x`,
      amount: payout - spacemanBet,
      isWin: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // =============================================================
  // MODE 1: ARENA BATTLE STATE (INITIALIZED WITH INSTANT FALLBACK DATA)
  // =============================================================
  const defaultFallback = getFallbackPair();
  const [p1, setP1] = useState(defaultFallback[0]);
  const [p2, setP2] = useState(defaultFallback[1]);
  const [betAmount, setBetAmount] = useState(100);
  const [selectedCorner, setSelectedCorner] = useState("red");
  const [isFighting, setIsFighting] = useState(false);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [battleLogs, setBattleLogs] = useState([]);

  const fetchRandomPair = async (forcedP1Name = null) => {
    setBattleLogs([]);
    setP1Hp(100);
    setP2Hp(100);

    try {
      let name1 = forcedP1Name;
      let name2 = "";

      if (!name1) {
        const randomPair = FEATURED_PAIRS[Math.floor(Math.random() * FEATURED_PAIRS.length)];
        name1 = randomPair[0];
        name2 = randomPair[1];
      } else {
        const pool = ["charizard", "blastoise", "mewtwo", "gengar", "dragonite", "lucario", "gyarados"].filter(
          (n) => n !== name1.toLowerCase()
        );
        name2 = pool[Math.floor(Math.random() * pool.length)];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const [res1, res2] = await Promise.all([
        fetch(`${API_BASE_URL}/pokemon/${name1.toLowerCase()}`, { signal: controller.signal }),
        fetch(`${API_BASE_URL}/pokemon/${name2.toLowerCase()}`, { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);

      if (res1.ok && res2.ok) {
        const data1 = await res1.json();
        const data2 = await res2.json();
        setP1(data1);
        setP2(data2);
      } else {
        const [fb1, fb2] = getFallbackPair(name1);
        setP1(fb1);
        setP2(fb2);
      }
    } catch {
      const [fb1, fb2] = getFallbackPair(forcedP1Name);
      setP1(fb1);
      setP2(fb2);
    }
  };

  useEffect(() => {
    const challenger = location.state?.challenger;
    if (challenger) {
      let cancelled = false;
      async function init() {
        if (!cancelled) await fetchRandomPair(challenger);
      }
      init();
      return () => { cancelled = true; };
    }
  }, [location.state]);

  const p1StatTotal = p1 ? p1.stats.reduce((a, b) => a + b.base_stat, 0) : 300;
  const p2StatTotal = p2 ? p2.stats.reduce((a, b) => a + b.base_stat, 0) : 300;
  const { odds1, odds2 } = calculateBattleOdds(p1StatTotal, p2StatTotal);

  const handleStartBattle = () => {
    if (betAmount <= 0) return triggerToast("Masukkan jumlah taruhan yang valid!", true);
    if (balance < betAmount) return triggerToast("Saldo PokéCoins Anda tidak mencukupi!", true);
    if (isFighting) return;

    updateBalance(-betAmount);
    setIsFighting(true);
    setP1Hp(100);
    setP2Hp(100);
    setBattleLogs(["⚔️ Pertarungan dimulai! Mengisi Energy Bar…"]);

    const p1Weight = p1StatTotal * (0.85 + Math.random() * 0.3);
    const p2Weight = p2StatTotal * (0.85 + Math.random() * 0.3);
    const winnerIsP1 = p1Weight >= p2Weight;

    const movesP1 = ["Flamethrower 🔥", "Thunderbolt ⚡", "Hyper Beam 💥", "Dragon Claw 🐉", "Quick Attack 💨"];
    const movesP2 = ["Hydro Pump 💧", "Ice Beam ❄️", "Shadow Ball 🔮", "Close Combat 🥊", "Earthquake 🌋"];

    let curP1Hp = 100;
    let curP2Hp = 100;
    let turn = 0;

    const interval = setInterval(() => {
      turn++;
      if (turn % 2 === 1) {
        const move = movesP1[Math.floor(Math.random() * movesP1.length)];
        const dmg = turn >= 5 ? 50 : Math.floor(15 + Math.random() * 20);
        curP2Hp = Math.max(0, curP2Hp - (winnerIsP1 && turn >= 5 ? 60 : dmg));
        setP2Hp(curP2Hp);
        setBattleLogs((prev) => [
          `🔴 ${capitalize(p1.name)} menggunakan ${move}! Dealt ${dmg} DMG!`,
          ...prev,
        ]);
      } else {
        const move = movesP2[Math.floor(Math.random() * movesP2.length)];
        const dmg = turn >= 6 ? 50 : Math.floor(15 + Math.random() * 20);
        curP1Hp = Math.max(0, curP1Hp - (!winnerIsP1 && turn >= 6 ? 60 : dmg));
        setP1Hp(curP1Hp);
        setBattleLogs((prev) => [
          `🔵 ${capitalize(p2.name)} menggunakan ${move}! Dealt ${dmg} DMG!`,
          ...prev,
        ]);
      }

      if (curP1Hp <= 0 || curP2Hp <= 0 || turn >= 6) {
        clearInterval(interval);
        setTimeout(() => {
          setIsFighting(false);
          const finalWinner = winnerIsP1 ? "red" : "blue";
          const winningPokemon = winnerIsP1 ? p1 : p2;
          const userWon = selectedCorner === finalWinner;
          const targetOdds = selectedCorner === "red" ? odds1 : odds2;
          const payout = userWon ? Math.round(betAmount * targetOdds) : 0;

          if (userWon) {
            updateBalance(payout);
            triggerVictoryConfetti();
            triggerToast(`🎉 MENANG! ${capitalize(winningPokemon.name)} menang duel! Payout: ${formatCoins(payout)}`);
          } else {
            triggerToast(`❌ KALAH! ${capitalize(winningPokemon.name)} memenangkan duel.`, true);
          }

          addHistoryRecord({
            type: "ARENA DUEL",
            title: `Duel: ${capitalize(p1.name)} vs ${capitalize(p2.name)}`,
            amount: userWon ? payout - betAmount : -betAmount,
            isWin: userWon,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
        }, 600);
      }
    }, 700);
  };

  // =============================================================
  // MODE 2: SLOT MACHINE STATE
  // =============================================================
  const [slotReels, setSlotReels] = useState([SLOT_ITEMS[0], SLOT_ITEMS[1], SLOT_ITEMS[2]]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotBet, setSlotBet] = useState(50);

  const handleSpinSlot = () => {
    if (slotBet <= 0) return triggerToast("Masukkan taruhan slot valid!", true);
    if (balance < slotBet) return triggerToast("Saldo PokéCoins tidak mencukupi!", true);
    if (isSpinning) return;

    updateBalance(-slotBet);
    setIsSpinning(true);

    let counter = 0;
    const spinInterval = setInterval(() => {
      counter++;
      setSlotReels([
        SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)],
        SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)],
        SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)],
      ]);

      if (counter > 15) {
        clearInterval(spinInterval);
        setIsSpinning(false);

        const finalR1 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        const finalR2 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        let finalR3 = SLOT_ITEMS[Math.floor(Math.random() * SLOT_ITEMS.length)];
        if (Math.random() < 0.35) finalR3 = finalR1;

        setSlotReels([finalR1, finalR2, finalR3]);

        let multiplier = 0;
        let isWin = false;

        if (finalR1.name === finalR2.name && finalR2.name === finalR3.name) {
          multiplier = finalR1.mult;
          isWin = true;
        } else if (finalR1.name === finalR2.name || finalR2.name === finalR3.name || finalR1.name === finalR3.name) {
          multiplier = 2;
          isWin = true;
        }

        const winAmount = isWin ? slotBet * multiplier : 0;
        if (isWin) {
          updateBalance(winAmount);
          triggerVictoryConfetti();
          triggerToast(`🎰 JACKPOT! 3 Match/Pair! Menang ${formatCoins(winAmount)} (${multiplier}x)`);
        } else {
          triggerToast("❌ Putaran Slot Belum Beruntung, Coba Lagi!", true);
        }

        addHistoryRecord({
          type: "POKÉSLOT",
          title: `Slot Spin: ${finalR1.icon} ${finalR2.icon} ${finalR3.icon}`,
          amount: isWin ? winAmount - slotBet : -slotBet,
          isWin,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    }, 100);
  };

  // =============================================================
  // MODE 3: GACHA POKÉBALL STATE
  // =============================================================
  const GACHA_BALLS = [
    { id: "pokeball", name: "Standard Pokéball", cost: 50, icon: "🔴", maxMult: 10, color: "#EE2222" },
    { id: "greatball", name: "Great Ball", cost: 150, icon: "🔵", maxMult: 25, color: "#3399FF" },
    { id: "ultraball", name: "Ultra Ball", cost: 350, icon: "🟡", maxMult: 50, color: "#FFCC33" },
    { id: "masterball", name: "Master Ball", cost: 1000, icon: "🟣", maxMult: 100, color: "#A000D0" },
  ];

  const [openingBall, setOpeningBall] = useState(null);
  const [gachaResult, setGachaResult] = useState(null);

  const handleOpenGacha = (ball) => {
    if (balance < ball.cost) return triggerToast(`Saldo kurang untuk membeli ${ball.name}!`, true);
    if (openingBall) return;

    updateBalance(-ball.cost);
    setOpeningBall(ball.id);
    setGachaResult(null);

    setTimeout(() => {
      const rand = Math.random();
      let mult = 0;

      if (rand < 0.4) mult = 0;
      else if (rand < 0.75) mult = 1.5 + Math.random() * 2;
      else if (rand < 0.95) mult = 4 + Math.random() * 6;
      else mult = ball.maxMult;

      mult = Number(mult.toFixed(1));
      const prize = Math.round(ball.cost * mult);
      const isWin = prize > ball.cost;

      if (prize > 0) updateBalance(prize);
      if (mult >= 5) triggerVictoryConfetti();

      setGachaResult({ ball, prize, mult, isWin });
      setOpeningBall(null);

      addHistoryRecord({
        type: "GACHA",
        title: `Buka ${ball.name}`,
        amount: isWin ? prize - ball.cost : -ball.cost,
        isWin,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }, 1200);
  };

  // =============================================================
  // MODE 4: HISTORY & STATS STATE
  // =============================================================
  const historyList = getHistory();
  const stats = getStats();
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  return (
    <div className="casino-container">
      <Confetti active={showConfetti} />

      {/* Header Banner */}
      <div className="casino-banner">
        <div className="banner-left">
          <div className="casino-chip-icon">🎰</div>
          <div>
            <h1 className="casino-title">PokéCasino & Spaceman Hub</h1>
            <p className="casino-subtitle">Tempat Taruhan Spaceman Multiplier & Duel Arena Terpanas!</p>
          </div>
        </div>

        <div className="banner-right">
          <div className="wallet-card">
            <span className="wallet-label">SALDO POKÉCOINS</span>
            <span className="wallet-amount">{formatCoins(balance)}</span>
          </div>

          <div className="wallet-actions">
            <button className="casino-btn bonus-btn" onClick={() => triggerToast(claimDailyBonus().message)}>
              🎁 Klaim Bonus (+500)
            </button>
            {balance < 50 && (
              <button className="casino-btn reset-btn" onClick={() => setBalance(resetBalance())}>
                🔄 Reset 1.000 Coins
              </button>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast-notification ${toast.isError ? "error" : "success"}`}>
          {toast.msg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="casino-tabs">
        <button
          className={`casino-tab-btn ${activeTab === "spaceman" ? "active" : ""}`}
          onClick={() => setActiveTab("spaceman")}
        >
          🚀 PokéFly Spaceman (HOT 🔥)
        </button>
        <button
          className={`casino-tab-btn ${activeTab === "arena" ? "active" : ""}`}
          onClick={() => setActiveTab("arena")}
        >
          ⚔️ Arena Duel Pokémon
        </button>
        <button
          className={`casino-tab-btn ${activeTab === "slot" ? "active" : ""}`}
          onClick={() => setActiveTab("slot")}
        >
          🎰 PokéSlot Spin
        </button>
        <button
          className={`casino-tab-btn ${activeTab === "gacha" ? "active" : ""}`}
          onClick={() => setActiveTab("gacha")}
        >
          🎁 Mystery Pokéball Gacha
        </button>
        <button
          className={`casino-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          📜 Riwayat & Stat
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODE 0: POKÉFLY SPACEMAN MULTIPLIER (NEW CRASH GAME) */}
      {/* ============================================================ */}
      {activeTab === "spaceman" && (
        <div className="casino-section spaceman-section">
          <div className="section-header">
            <div>
              <h2>🚀 PokéFly Spaceman Crash Game</h2>
              <p>Terbang bersama Rayquaza & Tekan <strong>CASH OUT</strong> Sebelum Terjadi Crash!</p>
            </div>

            {/* Crash History Ribbon */}
            <div className="crash-ribbon">
              <span className="ribbon-title">Hasil Sebelumnya:</span>
              <div className="ribbon-chips">
                {crashHistory.map((val, idx) => {
                  let colorClass = "chip-green";
                  if (val < 1.5) colorClass = "chip-red";
                  else if (val < 2.5) colorClass = "chip-yellow";

                  return (
                    <span key={idx} className={`crash-chip ${colorClass}`}>
                      {val.toFixed(2)}x
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="spaceman-arena-card">
            {/* Interactive 60 FPS Starfield Flight Canvas */}
            <SpacemanCanvas
              status={spacemanStatus}
              multiplier={currentMultiplier}
              crashMultiplier={crashPoint}
            />

            {/* Betting & Cashout Action Panel */}
            <div className="spaceman-controls-panel">
              <div className="control-column">
                <label className="input-label">Jumlah Taruhan (Bet):</label>
                <div className="input-with-chips">
                  <input
                    type="number"
                    min={10}
                    max={balance}
                    value={spacemanBet}
                    onChange={(e) => setSpacemanBet(Math.max(10, parseInt(e.target.value) || 0))}
                    className="bet-number-input"
                    disabled={spacemanStatus === "FLYING" || spacemanStatus === "COUNTDOWN"}
                  />
                  <div className="quick-bet-chips">
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        className="chip-btn"
                        onClick={() => setSpacemanBet(amt)}
                        disabled={spacemanStatus === "FLYING" || spacemanStatus === "COUNTDOWN"}
                      >
                        {amt}
                      </button>
                    ))}
                    <button
                      className="chip-btn max-chip"
                      onClick={() => setSpacemanBet(balance)}
                      disabled={spacemanStatus === "FLYING" || spacemanStatus === "COUNTDOWN"}
                    >
                      ALL-IN
                    </button>
                  </div>
                </div>
              </div>

              <div className="control-column">
                <label className="input-label">Auto Cash Out Multiplier:</label>
                <div className="input-with-chips">
                  <input
                    type="number"
                    step="0.1"
                    min={1.1}
                    max={50.0}
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(Math.max(1.1, parseFloat(e.target.value) || 1.1))}
                    className="bet-number-input"
                    disabled={spacemanStatus === "FLYING" || spacemanStatus === "COUNTDOWN"}
                  />
                  <div className="quick-bet-chips">
                    {[1.5, 2.0, 3.0, 5.0].map((m) => (
                      <button
                        key={m}
                        className="chip-btn"
                        onClick={() => setAutoCashout(m)}
                        disabled={spacemanStatus === "FLYING" || spacemanStatus === "COUNTDOWN"}
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="action-button-column">
                {spacemanStatus === "FLYING" && hasBetInRound && !hasCashedOut ? (
                  <button className="cashout-now-btn" onClick={() => executeCashOut()}>
                    💰 CASH OUT SEKARANG ({formatCoins(Math.round(spacemanBet * currentMultiplier))})
                  </button>
                ) : (
                  <button
                    className="takeoff-btn"
                    onClick={startSpacemanRound}
                    disabled={
                      spacemanStatus === "FLYING" ||
                      spacemanStatus === "COUNTDOWN" ||
                      balance < spacemanBet
                    }
                  >
                    {spacemanStatus === "COUNTDOWN"
                      ? "🚀 MELUNCUR…"
                      : spacemanStatus === "FLYING"
                      ? "⚡ TERBANG BERLANGSUNG…"
                      : "🚀 TAKEOFF & PASANG TARUHAN"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 1: ARENA DUEL POKÉMON */}
      {/* ============================================================ */}
      {activeTab === "arena" && (
        <div className="casino-section arena-section">
          <div className="section-header">
            <div>
              <h2>⚔️ Stadium Pertarungan Pokémon</h2>
              <p>Pilih Sudut Merah atau Biru & Pasang Taruhan Anda!</p>
            </div>
            <button className="refresh-pair-btn" onClick={() => fetchRandomPair()} disabled={isFighting}>
              🔀 Acak Pertandingan Baru
            </button>
          </div>

          <div className="stadium-card">
            <div className="fighters-row">
              {/* P1 Corner */}
              <div
                className={`fighter-box red-corner ${selectedCorner === "red" ? "selected" : ""}`}
                onClick={() => !isFighting && setSelectedCorner("red")}
              >
                <div className="corner-badge red">SUDUT MERAH</div>
                <div className="fighter-artwork">
                  <img
                    src={getOfficialArtworkUrl(p1.id)}
                    alt={p1.name}
                    className={`fighter-img ${p1Hp <= 0 ? "fainted" : ""}`}
                  />
                </div>
                <h3 className="fighter-name">{capitalize(p1.name)}</h3>
                <div className="fighter-types">
                  {p1.types.map((t) => (
                    <span key={t.type.name} className="mini-type-badge">
                      {getTypeStyle(t.type.name).icon} {t.type.name}
                    </span>
                  ))}
                </div>
                <div className="fighter-power">
                  ⚡ Stat Power: <strong>{p1StatTotal}</strong>
                </div>

                <div className="hp-bar-container">
                  <div className="hp-bar-label">HP: {p1Hp}%</div>
                  <div className="hp-track">
                    <div className="hp-fill red" style={{ width: `${p1Hp}%` }}></div>
                  </div>
                </div>

                <div className="odds-box">
                  Multiplier Odds: <span className="odds-val">{odds1}x</span>
                </div>
              </div>

              <div className="versus-divider">
                <span className="vs-circle">VS</span>
              </div>

              {/* P2 Corner */}
              <div
                className={`fighter-box blue-corner ${selectedCorner === "blue" ? "selected" : ""}`}
                onClick={() => !isFighting && setSelectedCorner("blue")}
              >
                <div className="corner-badge blue">SUDUT BIRU</div>
                <div className="fighter-artwork">
                  <img
                    src={getOfficialArtworkUrl(p2.id)}
                    alt={p2.name}
                    className={`fighter-img ${p2Hp <= 0 ? "fainted" : ""}`}
                  />
                </div>
                <h3 className="fighter-name">{capitalize(p2.name)}</h3>
                <div className="fighter-types">
                  {p2.types.map((t) => (
                    <span key={t.type.name} className="mini-type-badge">
                      {getTypeStyle(t.type.name).icon} {t.type.name}
                    </span>
                  ))}
                </div>
                <div className="fighter-power">
                  ⚡ Stat Power: <strong>{p2StatTotal}</strong>
                </div>

                <div className="hp-bar-container">
                  <div className="hp-bar-label">HP: {p2Hp}%</div>
                  <div className="hp-track">
                    <div className="hp-fill blue" style={{ width: `${p2Hp}%` }}></div>
                  </div>
                </div>

                <div className="odds-box">
                  Multiplier Odds: <span className="odds-val">{odds2}x</span>
                </div>
              </div>
            </div>

            {/* Betting Controls */}
            <div className="arena-bet-controls">
              <div className="corner-selector-bar">
                <span className="control-label">Pilihan Taruhan:</span>
                <button
                  className={`corner-btn red ${selectedCorner === "red" ? "active" : ""}`}
                  onClick={() => !isFighting && setSelectedCorner("red")}
                >
                  🔴 {capitalize(p1.name)} ({odds1}x)
                </button>
                <button
                  className={`corner-btn blue ${selectedCorner === "blue" ? "active" : ""}`}
                  onClick={() => !isFighting && setSelectedCorner("blue")}
                >
                  🔵 {capitalize(p2.name)} ({odds2}x)
                </button>
              </div>

              <div className="bet-input-row">
                <span className="control-label">Jumlah Bet:</span>
                <input
                  type="number"
                  min={10}
                  max={balance}
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
                  className="bet-number-input"
                  disabled={isFighting}
                />
                <div className="quick-bet-chips">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      className="chip-btn"
                      onClick={() => setBetAmount(amt)}
                      disabled={isFighting}
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    className="chip-btn max-chip"
                    onClick={() => setBetAmount(balance)}
                    disabled={isFighting}
                  >
                    ALL-IN
                  </button>
                </div>
              </div>

              <div className="payout-estimate">
                Estimasi Menang:{" "}
                <strong>
                  {formatCoins(Math.round(betAmount * (selectedCorner === "red" ? odds1 : odds2)))}
                </strong>
              </div>

              <button
                className="start-fight-btn"
                onClick={handleStartBattle}
                disabled={isFighting || balance < betAmount}
              >
                {isFighting ? "⚡ PERTARUNGAN BERLANGSUNG…" : "⚔️ MULAI BERTARUNG SEKARANG!"}
              </button>
            </div>

            {/* Battle Logs */}
            {battleLogs.length > 0 && (
              <div className="battle-log-card">
                <h4>📜 Live Move Log:</h4>
                <div className="log-list">
                  {battleLogs.map((log, i) => (
                    <div key={i} className="log-item">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 2: POKÉSLOT SPIN */}
      {/* ============================================================ */}
      {activeTab === "slot" && (
        <div className="casino-section slot-section">
          <div className="section-header">
            <h2>🎰 PokéSlot Machine</h2>
            <p>Samakan 3 Simbol Pokémon untuk Hadiah Hingga 50x Multiplier!</p>
          </div>

          <div className="slot-machine-frame">
            <div className="slot-reels-row">
              {slotReels.map((item, idx) => (
                <div
                  key={idx}
                  className={`slot-reel-box ${isSpinning ? "spinning" : ""}`}
                  style={{ borderColor: item.bg }}
                >
                  <span className="reel-icon">{item.icon}</span>
                  <span className="reel-name">{item.name}</span>
                </div>
              ))}
            </div>

            <div className="slot-controls">
              <div className="bet-row">
                <span>Pasang Bet:</span>
                <input
                  type="number"
                  min={10}
                  max={balance}
                  value={slotBet}
                  onChange={(e) => setSlotBet(Math.max(10, parseInt(e.target.value) || 0))}
                  className="bet-number-input"
                  disabled={isSpinning}
                />
                <div className="quick-bet-chips">
                  {[25, 50, 100, 250].map((amt) => (
                    <button key={amt} className="chip-btn" onClick={() => setSlotBet(amt)} disabled={isSpinning}>
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="spin-slot-btn"
                onClick={handleSpinSlot}
                disabled={isSpinning || balance < slotBet}
              >
                {isSpinning ? "🎰 MEMUTAR REEL…" : "🎰 SPIN SEKARANG!"}
              </button>
            </div>
          </div>

          <div className="slot-payout-table">
            <h3>🏆 Tabel Payout Slot</h3>
            <div className="payout-grid">
              {SLOT_ITEMS.map((item) => (
                <div key={item.name} className="payout-card">
                  <span className="payout-icon">{item.icon}</span>
                  <div className="payout-info">
                    <strong>3x {item.name}</strong>
                    <span className="payout-mult">{item.mult}x Multiplier</span>
                  </div>
                </div>
              ))}
              <div className="payout-card special">
                <span className="payout-icon">✨</span>
                <div className="payout-info">
                  <strong>Cocok 2 Simbol Mana Saja</strong>
                  <span className="payout-mult">2x Multiplier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 3: MYSTERY POKÉBALL GACHA */}
      {/* ============================================================ */}
      {activeTab === "gacha" && (
        <div className="casino-section gacha-section">
          <div className="section-header">
            <h2>🎁 Mystery Pokéball Gacha</h2>
            <p>Beli & Buka Pokéball Rahasia untuk Mendapatkan Hadiah Multiplier Melimpah!</p>
          </div>

          <div className="gacha-grid">
            {GACHA_BALLS.map((ball) => (
              <div key={ball.id} className="gacha-card" style={{ borderColor: ball.color }}>
                <div className="gacha-ball-icon">{ball.icon}</div>
                <h3 className="gacha-ball-title">{ball.name}</h3>
                <p className="gacha-ball-desc">Multiplier hingga {ball.maxMult}x!</p>

                <div className="gacha-price-tag">Harga: {formatCoins(ball.cost)}</div>

                <button
                  className="buy-gacha-btn"
                  onClick={() => handleOpenGacha(ball)}
                  disabled={openingBall !== null || balance < ball.cost}
                  style={{ backgroundColor: ball.color }}
                >
                  {openingBall === ball.id ? "📦 MEMBUKA…" : `BUKA ${ball.name.toUpperCase()}`}
                </button>
              </div>
            ))}
          </div>

          {gachaResult && (
            <div className="gacha-result-overlay">
              <div className="gacha-result-modal">
                <div className="modal-icon">{gachaResult.ball.icon}</div>
                <h3>{gachaResult.ball.name} Terbuka!</h3>
                <div className="modal-mult-badge">Multiplier: {gachaResult.mult}x</div>

                <p className="modal-prize-text">
                  {gachaResult.prize > 0 ? (
                    <span>
                      🎉 Anda Mendapatkan <strong>{formatCoins(gachaResult.prize)}</strong>!
                    </span>
                  ) : (
                    <span>❌ Bola Kosong! Coba keberuntungan Anda lagi!</span>
                  )}
                </p>

                <button className="casino-btn modal-close-btn" onClick={() => setGachaResult(null)}>
                  Tutup & Lanjut
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE 4: HISTORY & STATS */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="casino-section history-section">
          <div className="section-header">
            <h2>📜 Riwayat Taruhan & Statistik</h2>
            <p>Catatan Performa Taruhan PokéCoins Anda</p>
          </div>

          <div className="stats-summary-grid">
            <div className="stat-card-box">
              <span className="stat-card-label">Total Game</span>
              <span className="stat-card-val">{stats.totalGames}</span>
            </div>
            <div className="stat-card-box win">
              <span className="stat-card-label">Kemenangan</span>
              <span className="stat-card-val">{stats.wins}</span>
            </div>
            <div className="stat-card-box loss">
              <span className="stat-card-label">Kekalahan</span>
              <span className="stat-card-val">{stats.losses}</span>
            </div>
            <div className="stat-card-box">
              <span className="stat-card-label">Win Rate</span>
              <span className="stat-card-val">{winRate}%</span>
            </div>
          </div>

          <div className="history-table-wrapper">
            <h3>Daftar 30 Aktivitas Terakhir</h3>
            {historyList.length === 0 ? (
              <p className="no-history">Belum ada riwayat taruhan. Coba mainkan Spaceman, Arena Duel, atau PokéSlot!</p>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Jenis Permainan</th>
                    <th>Keterangan</th>
                    <th>Hasil PokéCoins</th>
                  </tr>
                </thead>
                <tbody>
                  {historyList.map((item, idx) => (
                    <tr key={idx} className={item.isWin ? "row-win" : "row-loss"}>
                      <td>{item.timestamp}</td>
                      <td>
                        <span className="game-type-pill">{item.type}</span>
                      </td>
                      <td>{item.title}</td>
                      <td className="amount-col">
                        {item.amount > 0 ? `+${formatCoins(item.amount)}` : formatCoins(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CasinoPage;
