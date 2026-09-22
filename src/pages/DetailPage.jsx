import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config.js";
import { capitalize, getTypeStyle, getOfficialArtworkUrl } from "../utils.js";
import PokeballLoader from "../components/PokeballLoader.jsx";

const STAT_MAX = {
    hp: 255,
    attack: 190,
    defense: 230,
    "special-attack": 194,
    "special-defense": 230,
    speed: 200,
};

const STAT_LABELS = {
    hp: "HP (Health)",
    attack: "ATK (Attack)",
    defense: "DEF (Defense)",
    "special-attack": "SP. ATK",
    "special-defense": "SP. DEF",
    speed: "SPD (Speed)",
};

function DetailPage() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [pokemon, setPokemon] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isCurrent = true;

        async function loadPokemon() {
            setIsLoading(true);
            setError(null);
            setPokemon(null);

            try {
                const response = await fetch(`${API_BASE_URL}/pokemon/${name.toLowerCase()}`);

                if (!response.ok) {
                    throw new Error(`Pokémon "${name}" tidak ditemukan. Periksa ejaan atau ID.`);
                }

                const data = await response.json();

                if (isCurrent) {
                    setPokemon(data);
                }
            } catch (err) {
                if (isCurrent) {
                    setError(err.message);
                }
            } finally {
                if (isCurrent) {
                    setIsLoading(false);
                }
            }
        }

        loadPokemon();

        return () => {
            isCurrent = false;
        };
    }, [name]);

    if (isLoading) return <PokeballLoader message={`Memuat data ${capitalize(name)}…`} />;
    if (error) {
        return (
            <div className="detail-error-card">
                <p className="status-error-inline">⚠️ {error}</p>
                <Link to="/" className="back-btn-arcade">← Kembali ke Pokédex</Link>
            </div>
        );
    }

    const artworkUrl = pokemon.sprites?.other?.["official-artwork"]?.front_default || getOfficialArtworkUrl(pokemon.id);
    const primaryType = pokemon.types[0]?.type?.name || "normal";
    const primaryStyle = getTypeStyle(primaryType);
    const totalStats = pokemon.stats.reduce((acc, curr) => acc + curr.base_stat, 0);

    const handleBattleClick = () => {
        navigate("/casino", { state: { challenger: pokemon.name } });
    };

    return (
        <div className="detail-page-container">
            <div className="detail-header-nav">
                <Link to="/" className="back-btn-arcade">
                    ← Kembali ke Pokédex
                </Link>
                <span className="detail-id-pill">#{String(pokemon.id).padStart(3, "0")}</span>
            </div>

            <div
                className="detail-hero-card"
                style={{
                    background: `radial-gradient(circle at top, ${primaryStyle.glow} 0%, rgba(20, 24, 33, 0.95) 75%)`,
                    borderColor: primaryStyle.bg,
                }}
            >
                <div className="hero-artwork-wrapper">
                    <img
                        src={artworkUrl}
                        alt={pokemon.name}
                        className="hero-artwork-img"
                        width={240}
                        height={240}
                    />
                    <div className="artwork-glow" style={{ background: primaryStyle.bg }}></div>
                </div>

                <div className="hero-details">
                    <h1 className="detail-title">{capitalize(pokemon.name)}</h1>

                    <div className="detail-types-row">
                        {pokemon.types.map((t) => {
                            const style = getTypeStyle(t.type.name);
                            return (
                                <span
                                    key={t.type.name}
                                    className="detail-type-badge"
                                    style={{ backgroundColor: style.bg, color: style.text }}
                                >
                                    {style.icon} {t.type.name.toUpperCase()}
                                </span>
                            );
                        })}
                    </div>

                    <div className="physical-traits">
                        <div className="trait-box">
                            <span className="trait-label">Tinggi</span>
                            <span className="trait-val">{(pokemon.height / 10).toFixed(1)} m</span>
                        </div>
                        <div className="trait-box">
                            <span className="trait-label">Berat</span>
                            <span className="trait-val">{(pokemon.weight / 10).toFixed(1)} kg</span>
                        </div>
                        <div className="trait-box">
                            <span className="trait-label">Total Power</span>
                            <span className="trait-val highlight-val">⚡ {totalStats}</span>
                        </div>
                    </div>

                    <div className="arena-cta-box">
                        <button className="battle-cta-btn" onClick={handleBattleClick}>
                            ⚔️ TARUHKAN {capitalize(pokemon.name).toUpperCase()} DI ARENA JUDI! 🎰
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats section */}
            <div className="detail-stats-card">
                <h3 className="section-title">📊 Base Statistics</h3>
                <div className="stats-bars-list">
                    {pokemon.stats.map((s) => {
                        const label = STAT_LABELS[s.stat.name] || s.stat.name.toUpperCase();
                        const max = STAT_MAX[s.stat.name] || 200;
                        const pct = Math.min(100, Math.round((s.base_stat / max) * 100));

                        let barColor = "#3399FF";
                        if (s.base_stat >= 100) barColor = "#00C851";
                        else if (s.base_stat >= 70) barColor = "#FFBB33";
                        else if (s.base_stat < 50) barColor = "#ff4444";

                        return (
                            <div key={s.stat.name} className="stat-bar-row">
                                <div className="stat-info-text">
                                    <span className="stat-name-label">{label}</span>
                                    <span className="stat-num-val">{s.base_stat}</span>
                                </div>
                                <div className="stat-progress-track">
                                    <div
                                        className="stat-progress-fill"
                                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default DetailPage;