import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config.js";
import { getIdFromUrl, capitalize, getSpriteUrl, getTypeStyle } from "../utils.js";
import PokeballLoader from "./PokeballLoader.jsx";

function PokemonList() {
    const [pokemons, setPokemons] = useState([]);
    const [pokemonDetails, setPokemonDetails] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [limit, setLimit] = useState(30);

    useEffect(() => {
        let isMounted = true;

        async function loadPokemons() {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`${API_BASE_URL}/pokemon?limit=${limit}`);

                if (!response.ok) {
                    throw new Error(`Gagal memuat Pokémon (Status: ${response.status})`);
                }

                const data = await response.json();
                if (!isMounted) return;

                setPokemons(data.results);

                // Fetch extra details (types) in parallel for richer cards
                const detailsMap = {};
                await Promise.all(
                    data.results.slice(0, 30).map(async (p) => {
                        try {
                            const res = await fetch(p.url);
                            if (res.ok) {
                                const pData = await res.json();
                                detailsMap[p.name] = {
                                    types: pData.types.map((t) => t.type.name),
                                    hp: pData.stats[0]?.base_stat || 50,
                                    attack: pData.stats[1]?.base_stat || 50,
                                };
                            }
                        } catch {
                            // ignore individual fetch errors
                        }
                    })
                );

                if (isMounted) {
                    setPokemonDetails(detailsMap);
                }
            } catch (err) {
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadPokemons();

        return () => {
            isMounted = false;
        };
    }, [limit]);

    if (isLoading) {
        return <PokeballLoader message="Menyiapkan Daftar Pokédex…" />;
    }

    if (error) {
        return (
            <div className="status-card status-error">
                <span className="status-icon">⚠️</span>
                <p>Gagal memuat Pokémon: {error}</p>
            </div>
        );
    }

    return (
        <div className="pokemon-list-wrapper">
            <div className="list-header">
                <h2>Explorasi Pokédex</h2>
                <span className="count-badge">{pokemons.length} Pokémon Tampil</span>
            </div>

            <ul className="pokemon-grid">
                {pokemons.map((pokemon, index) => {
                    const id = getIdFromUrl(pokemon.url);
                    const details = pokemonDetails[pokemon.name];
                    const types = details ? details.types : ["normal"];

                    return (
                        <li
                            key={pokemon.name}
                            className="pokemon-card-item"
                            style={{ animationDelay: `${index * 0.04}s` }}
                        >
                            <Link to={`/pokemon/${pokemon.name}`} className="pokemon-card-link">
                                <div className="card-top">
                                    <span className="pokemon-number">#{id.padStart(3, "0")}</span>
                                    <div className="card-type-pills">
                                        {types.map((t) => {
                                            const style = getTypeStyle(t);
                                            return (
                                                <span
                                                    key={t}
                                                    className="type-pill"
                                                    style={{ backgroundColor: style.bg, color: style.text }}
                                                >
                                                    {style.icon} {t}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="sprite-container">
                                    <img
                                        className="pokemon-sprite-img"
                                        src={getSpriteUrl(id)}
                                        alt={pokemon.name}
                                        loading="lazy"
                                        width={96}
                                        height={96}
                                    />
                                    <div className="sprite-shadow"></div>
                                </div>

                                <div className="card-info">
                                    <h3 className="pokemon-card-name">{capitalize(pokemon.name)}</h3>
                                    {details && (
                                        <div className="mini-stats">
                                            <span>❤️ {details.hp} HP</span>
                                            <span>⚔️ {details.attack} ATK</span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-action-bar">
                                    <span className="detail-btn">Lihat Detail &rarr;</span>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>

            {limit < 150 && (
                <div className="load-more-container">
                    <button
                        className="load-more-btn"
                        onClick={() => setLimit((prev) => prev + 30)}
                    >
                        ⚡ Muat Lebih Banyak Pokémon
                    </button>
                </div>
            )}
        </div>
    );
}

export default PokemonList;