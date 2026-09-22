import { useState } from "react";
import { useNavigate } from "react-router-dom";

const QUICK_TAGS = ["pikachu", "charizard", "mewtwo", "gengar", "lucario", "greninja", "eevee"];

function SearchForm() {
    const [query, setQuery] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();
        const name = query.trim().toLowerCase();

        if (name === "") {
            setError("Ketik nama atau ID Pokémon terlebih dahulu.");
            return;
        }

        setError(null);
        navigate(`/pokemon/${name}`);
    }

    const handleQuickSearch = (name) => {
        setQuery(name);
        navigate(`/pokemon/${name}`);
    };

    return (
        <div className="search-box-card">
            <div className="search-header">
                <span className="scanner-icon">🔍</span>
                <span className="scanner-title">Pokédex Quick Search & Scanner</span>
            </div>

            <form onSubmit={handleSubmit} className="search-form-arcade">
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Cari Pokémon (contoh: Pikachu, Charizard, 25)…"
                        className="search-input-arcade"
                    />
                    {query && (
                        <button
                            type="button"
                            className="clear-input-btn"
                            onClick={() => setQuery("")}
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button type="submit" className="search-btn-arcade">
                    <span>CARI</span>
                    <span className="btn-glow"></span>
                </button>
            </form>

            {error && <p className="status-error-inline">⚠️ {error}</p>}

            <div className="quick-tags">
                <span className="tags-label">Favorit Populer:</span>
                <div className="tags-list">
                    {QUICK_TAGS.map((tag) => (
                        <button
                            key={tag}
                            className="tag-chip"
                            onClick={() => handleQuickSearch(tag)}
                        >
                            ⚡ {tag}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default SearchForm;